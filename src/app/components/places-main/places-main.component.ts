import { Component, OnInit } from '@angular/core';
import places, { Place } from 'src/app/models/places';
import { availableTags, locationTags, stuffTags, vibeTags } from 'src/app/models/tags';

@Component({
  selector: 'app-places-main',
  templateUrl: './places-main.component.html',
  styleUrls: ['./places-main.component.scss']
})
export class PlacesMainComponent implements OnInit {

  allTags: string[] = availableTags;
  locationTags: string[] = locationTags;
  vibeTags: string[] = vibeTags;
  stuffTags: string[] = stuffTags;
  selectedTags: string[] = [];
  selectedStuffTags: string[] = [];

  places: Place[] = [];
  filteredPlaces: Place[] = [];
  filteredStuffTags: string[] = [];

  ngOnInit(): void {
    this.places = places;
    this.filteredPlaces = this.places;
  }

  // Handle tag click for location and vibe tags
  onTagClicked(selectedTag: string) {
    if (this.selectedTags.includes(selectedTag)) {
      this.selectedTags = this.selectedTags.filter(
        (tag) => tag !== selectedTag
      );
    } else {
      this.selectedTags.push(selectedTag);
    }

    this.applyFilters();
  }

  // Handle tag click for stuff tags
  onStuffTagClicked(stuffTag: string) {
    if (this.selectedStuffTags.includes(stuffTag)) {
      this.selectedStuffTags = this.selectedStuffTags.filter(
        (tag) => tag !== stuffTag
      );
    } else {
      this.selectedStuffTags.push(stuffTag);
    }

    this.applyFilters();
  }

  // Check if a location or vibe tag is selected
  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  // Check if a stuff tag is selected
  isStuffTagSelected(tag: string): boolean {
    return this.selectedStuffTags.includes(tag);
  }

  // Apply filters to the places based on selected tags
  applyFilters() {
    this.filteredPlaces = this.places.filter(
      (place) =>
        this.selectedTags.every((tag) => place.tags.includes(tag)) &&
        this.selectedStuffTags.every((tag) => place.tags.includes(tag))
    );

    this.updateFilteredStuffTags();
  }

  // Update the list of filtered stuff tags based on the filtered places
  updateFilteredStuffTags() {
    const usedStuffTags = new Set<string>();

    this.filteredPlaces.forEach((place) => {
      place.tags.forEach((tag) => {
        if (stuffTags.includes(tag)) {
          usedStuffTags.add(tag);
        }
      });
    });

    this.filteredStuffTags = Array.from(usedStuffTags);
  }

  // Clear all selected tags and reset the filters
  clearSelectedTags() {
    this.selectedTags = [];
    this.selectedStuffTags = []; // Clear the selected stuff tags
    this.filteredPlaces = this.places;
    this.filteredStuffTags = [];
  }

}
