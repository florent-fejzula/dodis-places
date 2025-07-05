import { Routes } from '@angular/router';
import { RecipesComponent } from './components/recipes/recipes.component';
import { PlacesMainComponent } from './components/places-main/places-main.component';

export const routes: Routes = [
  { path: '', component: PlacesMainComponent },
  { path: 'recipes', component: RecipesComponent },
];
