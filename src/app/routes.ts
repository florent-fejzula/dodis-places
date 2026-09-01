// src/app/routes.ts
import { Routes } from '@angular/router';

// Every route is lazy: a visitor who only browses places should not download
// the recipe app, the image cropper or the admin tools.
export const routes: Routes = [
  // Login page
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },

  // Signup page
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth/signup/signup.component').then((m) => m.SignupComponent),
  },

  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },

  // My lists page
  {
    path: 'my-lists',
    loadComponent: () =>
      import('./components/my-lists/my-lists.component').then(
        (m) => m.MyListsComponent
      ),
  },

  // Main map page
  {
    path: 'places',
    loadComponent: () =>
      import('./components/places-main/places-main.component').then(
        (m) => m.PlacesMainComponent
      ),
  },

  // Recipes — each signed-in cook sees only their own
  {
    path: 'recipes',
    loadComponent: () =>
      import('./components/recipes/recipes.component').then(
        (m) => m.RecipesComponent
      ),
  },

  // Admin
  {
    path: 'add-place',
    loadComponent: () =>
      import('./admin/add-place/add-place.component').then(
        (m) => m.AddPlaceComponent
      ),
  },

  // Admin Edit
  {
    path: 'add-place/:id',
    loadComponent: () =>
      import('./admin/edit-place/edit-place.component').then(
        (m) => m.EditPlaceComponent
      ),
  },

  {
    path: 'tag-manager',
    loadComponent: () => import('./admin/bulk-tag/bulk-tag.component'),
  },

  // Default redirect
  { path: '', redirectTo: '/places', pathMatch: 'full' },

  // Fallback (404)
  { path: '**', redirectTo: '/places' },
];
