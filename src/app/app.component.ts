import { Component } from '@angular/core';
import availableTags from './models/tags';
import places, { Place } from './models/places';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  allTags: string[] = availableTags;
  selectedTag = '';
  places: Place[] = [];
  filteredPlaces: Place[] = [];

  ngOnInit(): void {
    this.places = places;
  }

  onTagClicked(selectedTag: string) {
    this.selectedTag = selectedTag;
    this.filteredPlaces = this.places.filter((place) => place.tags.includes(selectedTag));
  }
}
