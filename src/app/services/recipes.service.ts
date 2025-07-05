import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  collection,
  docData,
  collectionData,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RecipesService {
  constructor(private firestore: Firestore) {}

  getSelectedRecipes(): Observable<any> {
    const ref = doc(this.firestore, 'selectedRecipes/userRecipes');
    return docData(ref);
  }

  updateSelectedRecipes(selectedRecipes: string[]): Promise<void> {
    const ref = doc(this.firestore, 'selectedRecipes/userRecipes');
    return setDoc(ref, { recipes: selectedRecipes });
  }

  getRecipes(): Observable<any[]> {
    const ref = collection(this.firestore, 'recipes');
    return collectionData(ref, { idField: 'id' });
  }

  addRecipe(recipe: any): Promise<any> {
    const ref = collection(this.firestore, 'recipes');
    return addDoc(ref, recipe);
  }

  updateRecipe(id: string, data: any): Promise<void> {
    const ref = doc(this.firestore, `recipes/${id}`);
    return updateDoc(ref, data);
  }

  deleteRecipe(id: string): Promise<void> {
    const ref = doc(this.firestore, `recipes/${id}`);
    return deleteDoc(ref);
  }
}
