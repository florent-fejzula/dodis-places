import { Component, Input } from '@angular/core';
import { locationTags } from 'src/app/models/tags';
import places, { Place } from 'src/app/models/places';

@Component({
  selector: 'app-places-list',
  templateUrl: './places-list.component.html',
  styleUrls: ['./places-list.component.scss']
})
export class PlacesListComponent {

  @Input() placesInput: Place[] = [];

  ngOnInit(): void {
    this.placesInput = places;
  }

  filterLocationTags(tags: string[]): string[] {
    return tags.filter(tag => !locationTags.includes(tag));
  }
}
