import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { locationTags } from 'src/app/models/tags';
import { Place } from 'src/app/models/places';

@Component({
  selector: 'app-places-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './places-list.component.html',
  styleUrls: ['./places-list.component.scss']
})
export class PlacesListComponent {
  @Input() placesInput: Place[] = [];

  filterLocationTags(tags: string[]): string[] {
    return tags.filter(tag => !locationTags.includes(tag));
  }
}
