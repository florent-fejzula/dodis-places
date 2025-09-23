import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  GoogleMap,
  GoogleMapsModule,
  MapInfoWindow,
  MapMarker,
} from '@angular/google-maps';
import { Loader } from '@googlemaps/js-api-loader';
import { Place } from 'src/app/models/places';
import {
  availableTags,
  locationTags,
  stuffTags,
  vibeTags,
} from 'src/app/models/tags';
import { PlacesService } from 'src/app/services/places.service';
import { environment } from 'src/environments/environment';
import { selectCardImage } from 'src/app/utils/general.util';
import { Router } from '@angular/router';
import { TagsSectionComponent } from '../tags-section/tags-section.component';

@Component({
  selector: 'app-places-main',
  standalone: true,
  imports: [
    CommonModule,
    GoogleMapsModule,
    CommonModule,
    TagsSectionComponent,
  ],
  templateUrl: './places-main.component.html',
  styleUrls: ['./places-main.component.scss'],
})
export class PlacesMainComponent implements OnInit {
  private svc = inject(PlacesService);

  adminMode = environment.adminMode;
  menuOpenFor: Place | null = null;

  // ---- filters
  allTags: string[] = availableTags;
  locationTags: string[] = locationTags;
  vibeTags: string[] = vibeTags;
  stuffTags: string[] = stuffTags;
  selectedTags: string[] = []; // single source of truth

  // ---- data
  places: Place[] = [];
  filteredPlaces: Place[] = [];

  @ViewChild(MapInfoWindow) infoWindow?: MapInfoWindow;
  selectedPlace: Place | null = null;

  disabledTags = new Set<string>();

  // ---- map
  @ViewChild(GoogleMap) map?: GoogleMap;
  apiReady = false; // gate map render
  center: google.maps.LatLngLiteral = { lat: 41.9981, lng: 21.4254 };
  zoom = 13;
  mapOptions: google.maps.MapOptions = {
    clickableIcons: false,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    styles: [
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
    ],
  };

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    // 1) Load Google Maps JS API first
    const loader = new Loader({
      apiKey: environment.googleMapsKey,
      libraries: ['marker', 'places'],
    });
    await loader.load();
    this.apiReady = true;

    // 2) Then subscribe to Firestore
    this.svc.getPlaces().subscribe((list) => {
      this.places = list ?? [];
      this.applyFilters();
      this.recomputeDisabledTags();
      this.fitToMarkers();
    });
  }

  // ---------- admin menu ----------
  openMenu(p: Place, ev: MouseEvent) {
    ev.stopPropagation();
    this.menuOpenFor = this.menuOpenFor?.id === p.id ? null : p;
  }
  goEdit(p: Place) {
    this.router.navigate(['/admin/places', p.id]);
  }
  async confirmDelete(p: Place) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await this.svc.deletePlace(p.id!);
    this.menuOpenFor = null;
  }
  closeMenu() {
    this.menuOpenFor = null;
  }

  // ---------- filter logic ----------
  onTagClicked(selectedTag: string) {
    this.toggle(this.selectedTags, selectedTag);
    this.applyFilters();
    this.recomputeDisabledTags();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  /** Disable a tag if adding it would produce 0 results */
  isTagDisabled(tag: string): boolean {
    // already selected tags are never disabled (you can always unselect)
    if (this.isTagSelected(tag)) return false;
    if (!this.places.length) return true;
    const need = [...this.selectedTags, tag];
    return !this.places.some((p) => need.every((t) => p.tags?.includes(t)));
  }

  clearSelectedTags() {
    this.selectedTags = [];
    this.filteredPlaces = this.places.slice();
    this.infoWindow?.close();
    this.fitToMarkers();
    this.recomputeDisabledTags();
  }

  private toggle(arr: string[], value: string) {
    const i = arr.indexOf(value);
    i >= 0 ? arr.splice(i, 1) : arr.push(value);
  }

  applyFilters() {
    this.filteredPlaces = this.places.filter((place) =>
      this.selectedTags.every((tag) => place.tags?.includes(tag))
    );
    this.infoWindow?.close(); // close bubble when filtering
    this.fitToMarkers();
    this.recomputeDisabledTags();
  }

  // ---------- map helpers ----------
  fitToMarkers() {
    if (!this.filteredPlaces.length || !this.map?.googleMap) return;
    const bounds = new google.maps.LatLngBounds();
    this.filteredPlaces.forEach((p) =>
      bounds.extend(new google.maps.LatLng(p.lat, p.lng))
    );
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      const s = this.filteredPlaces[0];
      this.center = { lat: s.lat, lng: s.lng };
      this.zoom = 15;
      return;
    }
    this.map.googleMap.fitBounds(bounds, {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    });
  }

  private recomputeDisabledTags() {
    const set = new Set<string>();
    for (const tag of this.allTags) {
      if (this.selectedTags.includes(tag)) continue; // never disable selected
      const need = [...this.selectedTags, tag];
      const anyHasAll = this.places.some((p) =>
        need.every((t) => p.tags?.includes(t))
      );
      if (!anyHasAll) set.add(tag);
    }
    this.disabledTags = set;
  }

  // ---------- cards & info window ----------
  getImage(p: Place): string | null {
    // use only the selected tags now
    const active = [...this.selectedTags];
    return selectCardImage(p, active);
  }

  openInfo(marker: MapMarker, p: Place) {
    this.selectedPlace = p;
    this.infoWindow?.open(marker);
  }

  openInMaps(p: Place) {
    if (p.gmapsUrl) window.open(p.gmapsUrl, '_blank');
    else
      window.open(`https://www.google.com/maps?q=${p.lat},${p.lng}`, '_blank');
  }
}
