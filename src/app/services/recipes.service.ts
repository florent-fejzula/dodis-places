import { Injectable, inject } from '@angular/core';
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
} from '@angular/fire/firestore';
import {
  Storage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  updateMetadata,
} from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { Recipe } from '../models/recipes';

@Injectable({ providedIn: 'root' })
export class RecipesService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  // ---- Recipes collection
  getRecipes(): Observable<Recipe[]> {
    const ref = collection(this.firestore, 'recipes');
    return collectionData(ref, { idField: 'id' }) as Observable<Recipe[]>;
  }

  addRecipe(recipe: Partial<Recipe>) {
    const ref = collection(this.firestore, 'recipes');
    const payload: Partial<Recipe> = {
      name: recipe.name?.trim() || 'Untitled',
      image: recipe.image?.trim() || '',
      category: recipe.category?.trim() || 'Other',
      notes: recipe.notes?.trim() || '',
      sourceUrl: recipe.sourceUrl?.trim() || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    return addDoc(ref, payload as any);
  }

  updateRecipe(id: string, data: Partial<Recipe>): Promise<void> {
    const ref = doc(this.firestore, `recipes/${id}`);
    const patch: any = { ...data, updatedAt: serverTimestamp() };
    Object.keys(patch).forEach(
      (k) => patch[k] === undefined && delete patch[k]
    );
    return updateDoc(ref, patch);
  }

  deleteRecipe(id: string): Promise<void> {
    const ref = doc(this.firestore, `recipes/${id}`);
    return deleteDoc(ref);
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
