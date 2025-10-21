// src/app/routes.ts
import { Routes } from '@angular/router';
import { PlacesMainComponent } from './components/places-main/places-main.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { AddPlaceComponent } from './admin/add-place/add-place.component';
import { EditPlaceComponent } from './admin/edit-place/edit-place.component';
import BulkTagComponent from './admin/bulk-tag/bulk-tag.component';
import { LoginComponent } from './auth/login/login.component';
import { MyListsComponent } from './components/my-lists/my-lists.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';

export const routes: Routes = [
  // Login page
  { path: 'login', component: LoginComponent },

  // Signup page
  { path: 'signup', component: SignupComponent },

  { path: 'forgot-password', component: ForgotPasswordComponent },

  // My lists page
  { path: 'my-lists', component: MyListsComponent },

  // Main map page
  { path: 'places', component: PlacesMainComponent },

  // Easter egg
  { path: 'recipes', component: RecipesComponent },

  // Admin
  { path: 'add-place', component: AddPlaceComponent },

  // Admin Edit
  { path: 'add-place/:id', component: EditPlaceComponent },

  {
    path: 'tag-manager',
    component: BulkTagComponent,
  },

  // Default redirect
  { path: '', redirectTo: '/places', pathMatch: 'full' },

  // Fallback (404)
  { path: '**', redirectTo: '/places' },
];
