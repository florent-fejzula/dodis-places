import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipesService {
  private collectionName = 'selectedRecipes';

  constructor(private firestore: AngularFirestore) { }

  getSelectedRecipes(): Observable<any> {
    return this.firestore.collection(this.collectionName).doc('userRecipes').valueChanges();
  }

  updateSelectedRecipes(selectedRecipes: string[]): Promise<void> {
    return this.firestore.collection(this.collectionName).doc('userRecipes').set({ recipes: selectedRecipes });
  }

  getRecipes() {
    return this.firestore.collection('recipes').snapshotChanges();
  }

  addRecipe(recipe: any) {
    return this.firestore.collection('recipes').add(recipe);
  }

  updateRecipe(id: string, data: any) {
    return this.firestore.doc(`recipes/${id}`).update(data);
  }

  deleteRecipe(id: string) {
    return this.firestore.doc(`recipes/${id}`).delete();
  }
}
