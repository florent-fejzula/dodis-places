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
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Place } from '../models/places';

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private placesRef!: CollectionReference<DocumentData>;

  constructor(private db: Firestore, private injector: Injector) {
    // initialize refs INSIDE constructor
    this.placesRef = collection(this.db, 'places');
  }

  /** helper to ensure calls happen inside Angular injection context */
  private inCtx<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  /** Live stream of all places (context-safe) */
  getPlaces(): Observable<Place[]> {
    return this.inCtx(
      () =>
        collectionData(this.placesRef, { idField: 'id' }) as Observable<Place[]>
    );
  }

  /** Query by up to 10 tags (OR). */
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

  /** Add a new place (timestamps auto) */
  async addPlace(p: Place): Promise<void> {
    const payload: Place = {
      name: p.name.trim(),
      description: p.description?.trim() || '',
      gmapsUrl: p.gmapsUrl.trim(),
      lat: Number(p.lat),
      lng: Number(p.lng),
      tags: [...(p.tags || [])],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    return this.inCtx(async () => {
      await addDoc(this.placesRef, payload);
    });
  }

  /** Update an existing place by id (safe partial update) */
  async updatePlace(id: string, patch: Partial<Place>): Promise<void> {
    const ref = doc(this.db, 'places', id);
    const cleaned: Partial<Place> = { ...patch, updatedAt: serverTimestamp() };
    if (typeof cleaned.name === 'string') cleaned.name = cleaned.name.trim();
    if (typeof cleaned.description === 'string')
      cleaned.description = cleaned.description.trim();
    if (typeof cleaned.gmapsUrl === 'string')
      cleaned.gmapsUrl = cleaned.gmapsUrl.trim();

    return this.inCtx(async () => {
      await updateDoc(ref, cleaned as any);
    });
  }

  /** Delete a place */
  async deletePlace(id: string): Promise<void> {
    return this.inCtx(async () => {
      await deleteDoc(doc(this.db, 'places', id));
    });
  }

  /** Bulk add (CSV/JSON import). Ignores empty rows. */
  async bulkAdd(places: Place[]): Promise<void> {
    for (const p of places) {
      if (!p?.name || !p?.gmapsUrl || p.lat == null || p.lng == null) continue;
      await this.addPlace(p);
    }
  }

  // ---------- Utilities ----------
  parseMapsLink(link: string): { lat?: number; lng?: number; name?: string } {
    const url = decodeURIComponent((link || '').trim());
    if (!url) return {};

    // 1) Prefer the actual place coordinates: !3dLAT!4dLNG
    let m = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(url);
    if (m) return { lat: +m[1], lng: +m[2], name: this.extractName(url) };

    // 2) Next, q=lat,lng (common in share links)
    m = /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(url);
    if (m) return { lat: +m[1], lng: +m[2], name: this.extractName(url) };

    // 3) Lastly, @lat,lng (viewport center; can be off)
    m = /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(url);
    if (m) return { lat: +m[1], lng: +m[2], name: this.extractName(url) };

    // Fallback: just try to infer a name
    return { name: this.extractName(url) };
  }

  private extractName(url: string): string | undefined {
    // Try /place/<Name>/
    const seg = url.split('/place/')[1]?.split(/[/?#]/)[0];
    if (seg) return seg.replace(/\+/g, ' ').replace(/%20/g, ' ').trim();

    // Try q=<query> if it looks like a name (not coords)
    try {
      const u = new URL(url);
      const q = u.searchParams.get('q');
      if (q && !/^[-\d.,\s]+$/.test(q)) return q.replace(/\+/g, ' ').trim();
    } catch {}
    return undefined;
  }
}
