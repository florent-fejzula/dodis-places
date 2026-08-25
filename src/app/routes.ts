// src/app/routes.ts
import { Routes } from '@angular/router';
import { PlacesMainComponent } from './components/places-main/places-main.component';
import { PlaceDetailComponent } from './components/place-detail/place-detail.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { AddPlaceComponent } from './admin/add-place/add-place.component';
import { EditPlaceComponent } from './admin/edit-place/edit-place.component';
import BulkTagComponent from './admin/bulk-tag/bulk-tag.component';
import { LoginComponent } from './auth/login/login.component';
import { MyListsComponent } from './components/my-lists/my-lists.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { adminGuard } from './auth/admin.guard';

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

  // Public, shareable page for a single place
  { path: 'place/:slug', component: PlaceDetailComponent },

  // Easter egg
  { path: 'recipes', component: RecipesComponent },

  // Admin area — guarded, and the only place internal tools live
  {
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      { path: 'add-place', component: AddPlaceComponent },
      { path: 'add-place/:id', component: EditPlaceComponent },
      { path: 'tag-manager', component: BulkTagComponent },
      { path: '', redirectTo: 'add-place', pathMatch: 'full' },
    ],
  },

  // Old admin URLs (bookmarks, old links)
  { path: 'add-place', redirectTo: 'admin/add-place', pathMatch: 'full' },
  { path: 'add-place/:id', redirectTo: 'admin/add-place/:id' },
  { path: 'tag-manager', redirectTo: 'admin/tag-manager', pathMatch: 'full' },

  // Default redirect
  { path: '', redirectTo: '/places', pathMatch: 'full' },

  // Fallback (404)
  { path: '**', redirectTo: '/places' },
];
