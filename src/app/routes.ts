// src/app/routes.ts
import { Routes } from '@angular/router';
import { PlacesMainComponent } from './components/places-main/places-main.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { AddPlaceComponent } from './admin/add-place/add-place.component';
import { EditPlaceComponent } from './admin/edit-place/edit-place.component';
import BulkTagComponent from './admin/bulk-tag/bulk-tag.component';

export const routes: Routes = [
  // Main map page
  { path: 'places', component: PlacesMainComponent },

  // Easter egg
  { path: 'recipes', component: RecipesComponent },

  // Admin
  { path: 'admin/add', component: AddPlaceComponent },

  // Admin Edit
  { path: 'admin/places/:id', component: EditPlaceComponent },

  {
    path: 'admin/bulk-tag',
    component: BulkTagComponent,
  },

  // Default redirect
  { path: '', redirectTo: '/places', pathMatch: 'full' },

  // Fallback (404)
  { path: '**', redirectTo: '/places' },
];
