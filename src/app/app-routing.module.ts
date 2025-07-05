import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecipesComponent } from './components/recipes/recipes.component';
import { PlacesMainComponent } from './components/places-main/places-main.component';

export const routes: Routes = [
  { path: 'places', component: PlacesMainComponent },
  { path: 'recipes', component: RecipesComponent },
  { path: '', redirectTo: '/places', pathMatch: 'full' }, // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }