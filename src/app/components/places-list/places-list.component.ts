import { Component, OnInit } from '@angular/core';
import places, { Place } from 'src/app/models/places';

@Component({
  selector: 'app-places-list',
  templateUrl: './places-list.component.html',
  styleUrls: ['./places-list.component.scss']
})
export class PlacesListComponent implements OnInit {

  places: Place[] = [];

  ngOnInit(): void {
    this.places = places;
  }

}
