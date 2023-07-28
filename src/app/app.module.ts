import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlacesListComponent } from './components/places-list/places-list.component';
import { TagListComponent } from './components/tag-list/tag-list.component';

@NgModule({
  declarations: [
    AppComponent,
    PlacesListComponent,
    TagListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
