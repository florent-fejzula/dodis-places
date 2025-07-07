import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Place } from '../models/places';

@Injectable({ providedIn: 'root' })
export class PlacesService {
  constructor(private firestore: Firestore) {}

  getPlaces(): Observable<Place[]> {
    const placesRef = collection(this.firestore, 'places');
    return collectionData(placesRef, { idField: 'id' }) as Observable<Place[]>;
  }
}