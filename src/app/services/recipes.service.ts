import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  doc,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  increment,
  getDoc,
  getDocs,
  setDoc,
  limit,
  writeBatch,
} from '@angular/fire/firestore';
import {
  Storage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  updateMetadata,
} from '@angular/fire/storage';
import { Observable, concat, from, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { Recipe, RecipeShare, recipePhotos } from '../models/recipes';
import { slugify } from '../utils/general.util';
import { RECIPE_CACHE_PREFIX } from '../utils/recipe-cache';

@Injectable({ providedIn: 'root' })
export class RecipesService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private injector = inject(Injector);

  private inCtx<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  private _recipes$: Observable<Recipe[]> | null = null;
  private _ownerId: string | null = null;
  /**
   * The last list each cook saw, kept on this device with no expiry: the
   * page shows it instantly and the live Firestore listener replaces it a
   * moment later. Recipes change rarely, so it's almost always already right.
   * Cleared on logout (see AuthService.logout).
   */
  private static readonly LS_LAST_OWNER = `${RECIPE_CACHE_PREFIX}__last_owner`;

  private lsKey(ownerId: string) {
    return `${RECIPE_CACHE_PREFIX}_${ownerId}`;
  }

  /**
   * The recipes of whoever was signed in last on this device - readable
   * before Firebase has even restored the session, so the page can draw
   * straight away instead of waiting on login + network.
   */
  peekLastOwnerRecipes(): { ownerId: string; recipes: Recipe[] } | null {
    try {
      const ownerId = localStorage.getItem(RecipesService.LS_LAST_OWNER);
      const recipes = ownerId ? this.loadCached(ownerId) : null;
      return ownerId && recipes ? { ownerId, recipes } : null;
    } catch {
      return null;
    }
  }


  // ---- Recipes collection (one cook's own recipes)
  getRecipes(ownerId: string): Observable<Recipe[]> {
    if (this._recipes$ && this._ownerId === ownerId) return this._recipes$;
    this._ownerId = ownerId;

    const live$ = this.inCtx(() => {
      const qRef = query(
        collection(this.firestore, 'recipes'),
        where('ownerId', '==', ownerId)
      );
      return collectionData(qRef, { idField: 'id' }) as Observable<Recipe[]>;
    }).pipe(
      tap(recipes => {
        try {
          localStorage.setItem(this.lsKey(ownerId), JSON.stringify({ t: Date.now(), data: recipes }));
          localStorage.setItem(RecipesService.LS_LAST_OWNER, ownerId);
        } catch {}
      }),
      shareReplay(1),
    );

    const cached = this.loadCached(ownerId);
    this._recipes$ = cached ? concat(of(cached), live$).pipe(shareReplay(1)) : live$;
    return this._recipes$;
  }

  private loadCached(ownerId: string): Recipe[] | null {
    try {
      const raw = localStorage.getItem(this.lsKey(ownerId));
      if (!raw) return null;
      const { data } = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  private bustCache(ownerId?: string) {
    try {
      localStorage.removeItem(this.lsKey(ownerId ?? this._ownerId ?? ''));
    } catch {}
  }

  async addRecipe(recipe: Partial<Recipe>, ownerId: string) {
    const ref = collection(this.firestore, 'recipes');
    const images = recipePhotos(recipe).map((u) => u.trim()).filter(Boolean);
    const payload: Partial<Recipe> = {
      ownerId,
      name: recipe.name?.trim() || 'Untitled',
      image: images[0] || '',
      images,
      category: recipe.category?.trim() || 'Other',
      cuisine: recipe.cuisine?.trim() || '',
      time: recipe.time?.trim() || '',
      notes: recipe.notes?.trim() || '',
      notesImages: recipe.notesImages ?? [],
      sourceUrl: recipe.sourceUrl?.trim() || '',
      // A cook who shares, shares everything - new recipes included. If the
      // lookup fails, save it private; syncSharedFlags corrects it later.
      shared: await this.getMyShare(ownerId).then((s) => !!s, () => false),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const result = await addDoc(ref, payload as any);
    this.bustCache();
    return result;
  }

  async updateRecipe(id: string, data: Partial<Recipe>): Promise<void> {
    const ref = doc(this.firestore, `recipes/${id}`);
    const patch: any = { ...data, updatedAt: serverTimestamp() };
    Object.keys(patch).forEach(
      (k) => patch[k] === undefined && delete patch[k]
    );
    await updateDoc(ref, patch);
    this.bustCache();
  }

  /**
   * Adds to (or subtracts from) the cooked counter. Uses an atomic increment
   * so two quick taps cannot overwrite each other.
   */
  async bumpMade(id: string, delta: number): Promise<void> {
    const ref = doc(this.firestore, `recipes/${id}`);
    const patch: any = {
      madeCount: increment(delta),
      updatedAt: serverTimestamp(),
    };
    if (delta > 0) patch.lastMadeAt = serverTimestamp();

    await updateDoc(ref, patch);
    this.bustCache();
  }

  async deleteRecipe(id: string): Promise<void> {
    const ref = doc(this.firestore, `recipes/${id}`);
    await deleteDoc(ref);
    this.bustCache();
  }

  // ---- Storage upload for images
  async uploadRecipeImage(file: File): Promise<string> {
    const safeName = file.name?.replace(/[^\w.-]+/g, '_') || 'pasted.png';
    // Random part: several photos can be picked at once with the same name
    const path = `recipes/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const ref = storageRef(this.storage, path);

    const metadata = {
      contentType: file.type || 'image/png',
      cacheControl: 'public,max-age=31536000,immutable',
    };

    const snap = await uploadBytes(ref, file, metadata);
    await updateMetadata(snap.ref, metadata).catch(() => {});
    const url = await getDownloadURL(snap.ref);
    return url;
  }

  // ---------------- Sharing: a public, read-only link ----------------

  /** Link names that would collide with real routes under /recipes. */
  private static readonly RESERVED_HANDLES = ['settings'];

  /** The owner's own share, if they have one. */
  async getMyShare(ownerId: string): Promise<RecipeShare | null> {
    const snap = await this.inCtx(() =>
      getDocs(
        query(
          collection(this.firestore, 'recipeShares'),
          where('ownerId', '==', ownerId),
          limit(1)
        )
      )
    );
    const d = snap.docs[0];
    return d ? ({ ...(d.data() as RecipeShare), handle: d.id }) : null;
  }

  /**
   * Turns sharing on: claims a link name from `name` ("Dodi" -> /recipes/dodi,
   * or dodi-2 if someone else has it) and marks every recipe shared.
   */
  async startSharing(ownerId: string, name: string): Promise<RecipeShare> {
    const existing = await this.getMyShare(ownerId);
    if (existing) {
      await this.setSharedFlag(ownerId, true);
      return existing;
    }

    const cleanName = name.trim() || 'My';
    const base = slugify(cleanName) || 'recipes';
    for (let n = 1; n < 50; n++) {
      const handle = n === 1 ? base : `${base}-${n}`;
      if (RecipesService.RESERVED_HANDLES.includes(handle)) continue;

      const ref = doc(this.firestore, `recipeShares/${handle}`);
      const taken = await this.inCtx(() => getDoc(ref));
      if (taken.exists()) continue;

      try {
        const share = { ownerId, name: cleanName, createdAt: serverTimestamp() };
        await this.inCtx(() => setDoc(ref, share));
      } catch {
        continue; // claimed by someone else in the meantime - the rules refuse to overwrite
      }
      await this.setSharedFlag(ownerId, true);
      return { handle, ownerId, name: cleanName };
    }
    throw new Error('Could not find a free link name');
  }

  /** Turns sharing off: recipes go private first, then the link is removed. */
  async stopSharing(ownerId: string): Promise<void> {
    await this.setSharedFlag(ownerId, false);
    const snap = await this.inCtx(() =>
      getDocs(
        query(collection(this.firestore, 'recipeShares'), where('ownerId', '==', ownerId))
      )
    );
    await Promise.all(snap.docs.map((d) => this.inCtx(() => deleteDoc(d.ref))));
  }

  /**
   * Keeps every recipe's `shared` flag in step with whether its owner shares -
   * e.g. a recipe added from an older open tab. Writes only the ones that differ.
   */
  async syncSharedFlags(ownerId: string, recipes: Recipe[]): Promise<void> {
    const shared = !!(await this.getMyShare(ownerId));
    const stale = recipes.filter((r) => r.id && !!r.shared !== shared);
    if (stale.length) await this.writeSharedFlag(stale.map((r) => r.id!), shared);
  }

  private async setSharedFlag(ownerId: string, shared: boolean) {
    const snap = await this.inCtx(() =>
      getDocs(query(collection(this.firestore, 'recipes'), where('ownerId', '==', ownerId)))
    );
    const ids = snap.docs.filter((d) => !!d.data()['shared'] !== shared).map((d) => d.id);
    await this.writeSharedFlag(ids, shared);
  }

  private async writeSharedFlag(ids: string[], shared: boolean) {
    // Batches top out at 500 writes
    for (let i = 0; i < ids.length; i += 400) {
      const batch = writeBatch(this.firestore);
      for (const id of ids.slice(i, i + 400)) {
        batch.update(doc(this.firestore, `recipes/${id}`), { shared });
      }
      await batch.commit();
    }
    this.bustCache();
  }

  /**
   * What a visitor sees at /recipes/{handle}: the share (null if the link
   * doesn't exist, or no longer does) and that cook's shared recipes, live.
   */
  getSharedRecipes(
    handle: string
  ): Observable<{ share: RecipeShare | null; recipes: Recipe[] }> {
    const ref = doc(this.firestore, `recipeShares/${handle.toLowerCase()}`);
    return from(this.inCtx(() => getDoc(ref))).pipe(
      switchMap((snap) => {
        if (!snap.exists()) return of({ share: null, recipes: [] as Recipe[] });
        const share = { ...(snap.data() as RecipeShare), handle: snap.id };
        // Both filters are required: the rule only lets strangers read shared ones
        const q = query(
          collection(this.firestore, 'recipes'),
          where('ownerId', '==', share.ownerId),
          where('shared', '==', true)
        );
        return (
          this.inCtx(() => collectionData(q, { idField: 'id' })) as Observable<Recipe[]>
        ).pipe(map((recipes) => ({ share, recipes })));
      })
    );
  }
}
