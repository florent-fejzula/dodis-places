import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { Place } from '../models/places';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  async toggleFavorite(place: Place): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not logged in');

    const ref = doc(this.firestore, 'users', user.uid);
    const snap = await getDoc(ref);
    const current = ((snap.data() && snap.data()!['favorites']) ||
      []) as string[];

    if (current.includes(place.id!)) {
      await updateDoc(ref, { favorites: arrayRemove(place.id) });
    } else {
      await updateDoc(ref, { favorites: arrayUnion(place.id) });
    }
  }

  async getFavorites(): Promise<string[]> {
    const user = this.auth.user();
    if (!user) return [];

    const ref = doc(this.firestore, 'users', user.uid);
    const snap = await getDoc(ref);
    const data = snap.data();
    return ((data && data['favorites']) || []) as string[];
  }
}
