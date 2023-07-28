import { Component, Input } from '@angular/core';
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

}
