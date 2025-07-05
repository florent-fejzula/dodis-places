import { Component, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { PlacesListComponent } from '../places-list/places-list.component';
import places, { Place } from 'src/app/models/places';
import { availableTags, locationTags, stuffTags, vibeTags } from 'src/app/models/tags';

@Component({
  selector: 'app-places-main',
  standalone: true,
  imports: [NgClass, PlacesListComponent],
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

  onTagClicked(selectedTag: string) {
    if (this.selectedTags.includes(selectedTag)) {
      this.selectedTags = this.selectedTags.filter(tag => tag !== selectedTag);
    } else {
      this.selectedTags.push(selectedTag);
    }
    this.applyFilters();
  }

  onStuffTagClicked(stuffTag: string) {
    if (this.selectedStuffTags.includes(stuffTag)) {
      this.selectedStuffTags = this.selectedStuffTags.filter(tag => tag !== stuffTag);
    } else {
      this.selectedStuffTags.push(stuffTag);
    }
    this.applyFilters();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  isStuffTagSelected(tag: string): boolean {
    return this.selectedStuffTags.includes(tag);
  }

  applyFilters() {
    this.filteredPlaces = this.places.filter(
      place =>
        this.selectedTags.every(tag => place.tags.includes(tag)) &&
        this.selectedStuffTags.every(tag => place.tags.includes(tag))
    );
    this.updateFilteredStuffTags();
  }

  updateFilteredStuffTags() {
    const usedStuffTags = new Set<string>();
    this.filteredPlaces.forEach(place => {
      place.tags.forEach(tag => {
        if (stuffTags.includes(tag)) {
          usedStuffTags.add(tag);
        }
      });
    });
    this.filteredStuffTags = Array.from(usedStuffTags);
  }

  clearSelectedTags() {
    this.selectedTags = [];
    this.selectedStuffTags = [];
    this.filteredPlaces = this.places;
    this.filteredStuffTags = [];
  }
}
