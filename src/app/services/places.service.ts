// src/app/services/places.service.ts
import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  CollectionReference,
  DocumentData,
  arrayUnion,
  arrayRemove,
  docData,
  writeBatch,
} from '@angular/fire/firestore';
import {
  Storage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  updateMetadata,
} from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { Place } from '../models/places';

type ImageMeta = { url: string; tags: string[]; weight?: number };
type TagDoc = { name: string; color?: string | null; createdAt: any };

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private placesRef!: CollectionReference<DocumentData>;
  private tagsRef!: CollectionReference<DocumentData>;

  constructor(
    private db: Firestore,
    private storage: Storage,
    private injector: Injector
  ) {
    this.placesRef = collection(this.db, 'places');
    this.tagsRef = collection(this.db, 'tags');
  }

  /** Helper to ensure calls happen inside Angular injection context */
  private inCtx<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  // =========================
  // Places (read/query/write)
  // =========================

  getPlaces(): Observable<Place[]> {
    return this.inCtx(
      () =>
        collectionData(this.placesRef, { idField: 'id' }) as Observable<Place[]>
    );
  }

  getPlacesByTags(tags: string[]): Observable<Place[]> {
    if (!tags?.length || tags.length > 10) return this.getPlaces();
    return this.inCtx(() => {
      const qRef = query(
        this.placesRef,
        where('tags', 'array-contains-any', tags)
      );
      return collectionData(qRef, { idField: 'id' }) as Observable<Place[]>;
    });
  }

  async addPlace(p: Place): Promise<string> {
    const payload: Place = {
      name: p.name.trim(),
      description: p.description?.trim() || '',
      gmapsUrl: p.gmapsUrl.trim(),
      lat: Number(p.lat),
      lng: Number(p.lng),
      tags: [...(p.tags || [])],
      imagePrimaryUrl: p.imagePrimaryUrl,
      images: p.images || [],
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    } as any;

    // Remove undefined keys (Firestore rejects them)
    Object.keys(payload).forEach(
      (k) => (payload as any)[k] === undefined && delete (payload as any)[k]
    );

    const docRef = await this.inCtx(() => addDoc(this.placesRef, payload));
    return docRef.id;
  }

  getPlace(id: string) {
    const d = doc(this.db, 'places', id);
    return this.inCtx(() => docData(d, { idField: 'id' }) as Observable<Place>);
  }

  async updatePlace(id: string, patch: Partial<Place>): Promise<void> {
    const ref = doc(this.db, 'places', id);
    const cleaned: any = {
      ...patch,
      updatedAt: serverTimestamp(),
    };

    ['name', 'description', 'gmapsUrl'].forEach((k) => {
      if (typeof cleaned[k] === 'string') cleaned[k] = cleaned[k].trim();
    });

    Object.keys(cleaned).forEach(
      (k) => cleaned[k] === undefined && delete cleaned[k]
    );

    await this.inCtx(() => updateDoc(ref, cleaned));
  }

  async deletePlace(id: string): Promise<void> {
    await this.inCtx(() => deleteDoc(doc(this.db, 'places', id)));
  }

  async bulkAdd(places: Place[]): Promise<void> {
    for (const p of places) {
      if (!p?.name || !p?.gmapsUrl || p.lat == null || p.lng == null) continue;
      await this.addPlace(p);
    }
  }

  // ==============
  // Images (Storage)
  // ==============

  /** Upload a single image file and return its download URL (with caching) */
  async uploadPlaceImage(placeId: string, file: File): Promise<string> {
    const safeName = file.name.replace(/[^\w.-]+/g, '_');
    const path = `places/${placeId}/${Date.now()}_${safeName}`;
    const ref = storageRef(this.storage, path);

    // ✅ Add long-term caching metadata
    const metadata = {
      contentType: file.type,
      cacheControl: 'public,max-age=31536000,immutable', // 1 year caching
    };

    const snapshot = await uploadBytes(ref, file, metadata);

    // Ensure metadata is correctly applied (some Firebase versions require explicit update)
    await updateMetadata(snapshot.ref, metadata).catch(() => {});

    // ✅ Get stable download URL (browser will cache it)
    const url = await getDownloadURL(snapshot.ref);
    return url;
  }

  /** Append one image metadata (url/tags/weight) to place.images */
  async appendImageMeta(placeId: string, image: ImageMeta): Promise<void> {
    const ref = doc(this.db, 'places', placeId);
    await this.inCtx(() =>
      updateDoc(ref, {
        images: arrayUnion(image),
        updatedAt: serverTimestamp() as any,
      } as any)
    );
  }

  async setPrimaryImage(placeId: string, url: string): Promise<void> {
    const ref = doc(this.db, 'places', placeId);
    await this.inCtx(() =>
      updateDoc(ref, {
        imagePrimaryUrl: url,
        updatedAt: serverTimestamp() as any,
      } as any)
    );
  }

  // ==========
  // Tags (CRUD)
  // ==========

  getTags(): Observable<(TagDoc & { id: string })[]> {
    return this.inCtx(
      () =>
        collectionData(this.tagsRef, { idField: 'id' }) as Observable<
          (TagDoc & { id: string })[]
        >
    );
  }

  async createTag(name: string, color?: string) {
    const payload: TagDoc = {
      name: name.trim(),
      color: color ?? null,
      createdAt: serverTimestamp(),
    };
    await this.inCtx(() => addDoc(this.tagsRef, payload));
  }

  // ===================
  // Bulk Tag Operations
  // ===================

  async bulkAddTagToPlaces(tag: string, placeIds: string[]) {
    const t = tag.trim();
    if (!t || !placeIds?.length) return;

    const CHUNK = 450;
    for (let i = 0; i < placeIds.length; i += CHUNK) {
      const slice = placeIds.slice(i, i + CHUNK);
      await this.inCtx(async () => {
        const batch = writeBatch(this.db);
        for (const id of slice) {
          const ref = doc(this.db, 'places', id);
          batch.update(ref, {
            tags: arrayUnion(t),
            updatedAt: serverTimestamp(),
          } as any);
        }
        await batch.commit();
      });
    }
  }

  async bulkRemoveTagFromPlaces(tag: string, placeIds: string[]) {
    const t = tag.trim();
    if (!t || !placeIds?.length) return;

    const CHUNK = 450;
    for (let i = 0; i < placeIds.length; i += CHUNK) {
      const slice = placeIds.slice(i, i + CHUNK);
      await this.inCtx(async () => {
        const batch = writeBatch(this.db);
        for (const id of slice) {
          const ref = doc(this.db, 'places', id);
          batch.update(ref, {
            tags: arrayRemove(t),
            updatedAt: serverTimestamp(),
          } as any);
        }
        await batch.commit();
      });
    }
  }

  // ----------
  // Utilities
  // ----------

  parseMapsLink(link: string): { lat?: number; lng?: number; name?: string } {
    const url = decodeURIComponent((link || '').trim());
    if (!url) return {};

    let m = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(url);
    if (m) return { lat: +m[1], lng: +m[2], name: this.extractName(url) };

    m = /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(url);
    if (m) return { lat: +m[1], lng: +m[2], name: this.extractName(url) };

    m = /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(url);
    if (m) return { lat: +m[1], lng: +m[2], name: this.extractName(url) };

    return { name: this.extractName(url) };
  }

  private extractName(url: string): string | undefined {
    const seg = url.split('/place/')[1]?.split(/[/?#]/)[0];
    if (seg) return seg.replace(/\+/g, ' ').replace(/%20/g, ' ').trim();

    try {
      const u = new URL(url);
      const q = u.searchParams.get('q');
      if (q && !/^[-\d.,\s]+$/.test(q)) return q.replace(/\+/g, ' ').trim();
    } catch {}
    return undefined;
  }
}
