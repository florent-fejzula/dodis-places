// src/app/routes.ts
import { Routes } from '@angular/router';
import { PlacesMainComponent } from './components/places-main/places-main.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { AddPlaceComponent } from './admin/add-place/add-place.component';

export const routes: Routes = [
  // Main map page
  { path: 'places', component: PlacesMainComponent },

  // Easter egg
  { path: 'recipes', component: RecipesComponent },

  // Admin
  { path: 'admin/add', component: AddPlaceComponent },

  // Default redirect
  { path: '', redirectTo: '/places', pathMatch: 'full' },

  // Fallback (404)
  { path: '**', redirectTo: '/places' },
];
