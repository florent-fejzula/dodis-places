import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  doc,
  collection,
  docData,
  collectionData,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from '@angular/fire/firestore';
import {
  Storage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  updateMetadata,
} from '@angular/fire/storage';
import { Observable, concat, of, shareReplay, tap } from 'rxjs';
import { Recipe } from '../models/recipes';

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
  private readonly LS_PREFIX = 'dodi_recipes_v1';
  private readonly LS_TTL = 10 * 60 * 1000;

  private lsKey(ownerId: string) {
    return `${this.LS_PREFIX}_${ownerId}`;
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
        } catch {}
      }),
      shareReplay(1),
    );

    const cached = this.loadCached(ownerId);
    this._recipes$ = cached ? concat(of(cached), live$).pipe(shareReplay(1)) : live$;
    return this._recipes$;
  }

  /**
   * One-off migration: recipes added before ownership existed have no ownerId,
   * so they belong to nobody and nobody would see them. Stamps them with the
   * original owner's uid. Safe to call repeatedly - it no-ops once they are
   * all claimed.
   */
  async claimUnownedRecipes(ownerId: string): Promise<number> {
    const snap = await this.inCtx(() =>
      getDocs(collection(this.firestore, 'recipes'))
    );
    const orphans = snap.docs.filter((d) => !d.data()['ownerId']);
    if (!orphans.length) return 0;

    const batch = writeBatch(this.firestore);
    for (const d of orphans) {
      batch.update(d.ref, { ownerId, updatedAt: serverTimestamp() });
    }
    await batch.commit();
    this.bustCache(ownerId);
    return orphans.length;
  }

  private loadCached(ownerId: string): Recipe[] | null {
    try {
      const raw = localStorage.getItem(this.lsKey(ownerId));
      if (!raw) return null;
      const { t, data } = JSON.parse(raw);
      if (!Array.isArray(data) || Date.now() - t > this.LS_TTL) return null;
      return data;
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
    const payload: Partial<Recipe> = {
      ownerId,
      name: recipe.name?.trim() || 'Untitled',
      image: recipe.image?.trim() || '',
      category: recipe.category?.trim() || 'Other',
      cuisine: recipe.cuisine?.trim() || '',
      time: recipe.time?.trim() || '',
      notes: recipe.notes?.trim() || '',
      sourceUrl: recipe.sourceUrl?.trim() || '',
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

  async deleteRecipe(id: string): Promise<void> {
    const ref = doc(this.firestore, `recipes/${id}`);
    await deleteDoc(ref);
    this.bustCache();
  }

  // ---- Storage upload for images
  async uploadRecipeImage(file: File): Promise<string> {
    const safeName = file.name?.replace(/[^\w.-]+/g, '_') || 'pasted.png';
    const path = `recipes/${Date.now()}_${safeName}`;
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
}
