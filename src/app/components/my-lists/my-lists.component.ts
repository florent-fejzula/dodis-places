import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService } from 'src/app/services/favorites.service';
import { PlacesService } from 'src/app/services/places.service';
import { Place } from 'src/app/models/places';
import { slugify } from 'src/app/utils/general.util';

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
  private router = inject(Router);
  favorites: Place[] = [];
  favoriteIds: string[] = [];

  async ngOnInit() {
    this.favoriteIds = await this.favs.getFavorites();
    this.places.getPlaces().subscribe((all) => {
      this.favorites = all.filter((p) => this.favoriteIds.includes(p.id!));
    });
  }

  openPlace(p: Place, ev: MouseEvent) {
    if ((ev.target as HTMLElement | null)?.closest('button, a')) return;
    this.router.navigate(['/place', slugify(p.name)]);
  }

  async toggleFavorite(place: Place) {
    await this.favs.toggleFavorite(place!);
    this.favoriteIds = await this.favs.getFavorites();
    this.favorites = this.favorites.filter((p) =>
      this.favoriteIds.includes(p.id!)
    );
  }

  isFavorite(id: string) {
    return this.favoriteIds.includes(id);
  }
}
