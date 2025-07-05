import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PlacesListComponent } from './components/places-list/places-list.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { PlacesMainComponent } from './components/places-main/places-main.component';

import { environment } from '../environments/environment';

// ✅ Modular Firebase SDK
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

@NgModule({
  declarations: [
    AppComponent,
    PlacesListComponent,
    RecipesComponent,
    PlacesMainComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore())
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
