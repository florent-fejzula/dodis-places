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
  selectedTags: string[] = [];

  places: Place[] = [];
  filteredPlaces: Place[] = [];

  ngOnInit(): void {
    this.places = places;
  }

  onTagClicked(selectedTag: string) {
    if (this.selectedTags.includes(selectedTag)) {
      this.selectedTags = this.selectedTags.filter(selectedTag => selectedTag !== selectedTag);
    } else {
      this.selectedTags.push(selectedTag);
    }
    
    this.filteredPlaces = this.places.filter(place =>
      this.selectedTags.every(selectedTag => place.tags.includes(selectedTag))
    );
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }
  
}
