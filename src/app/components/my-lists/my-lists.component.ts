import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService } from 'src/app/services/favorites.service';
import { PlacesService } from 'src/app/services/places.service';
import { Place } from 'src/app/models/places';

@Component({
  selector: 'app-my-lists',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-lists.component.html',
  styleUrls: ['./my-lists.component.scss'],
})
export class MyListsComponent implements OnInit {
  private favs = inject(FavoritesService);
  private places = inject(PlacesService);
  favorites: Place[] = [];

  async ngOnInit() {
    const ids = await this.favs.getFavorites();
    this.places.getPlaces().subscribe((all) => {
      this.favorites = all.filter((p) => ids.includes(p.id!));
    });
  }
}
