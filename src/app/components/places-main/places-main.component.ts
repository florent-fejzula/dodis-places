import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GoogleMap,
  GoogleMapsModule,
  MapInfoWindow,
  MapMarker,
} from '@angular/google-maps';
import { Loader } from '@googlemaps/js-api-loader';
import { ActivatedRoute, Router } from '@angular/router';
import { effect, Injector } from '@angular/core';

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
import { TagsSectionComponent } from '../tags-section/tags-section.component';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-places-main',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, TagsSectionComponent],
  templateUrl: './places-main.component.html',
  styleUrls: ['./places-main.component.scss'],
})
export class PlacesMainComponent implements OnInit {
  // --- state ---
  isAdmin = false;
  menuOpenFor: Place | null = null;

  // --- tags ---
  allTags: string[] = availableTags;
  locationTags: string[] = locationTags;
  vibeTags: string[] = vibeTags;
  stuffTags: string[] = stuffTags;
  selectedTags: string[] = [];
  disabledTags = new Set<string>();

  // --- data ---
  places: Place[] = [];
  filteredPlaces: Place[] = [];

  // --- map ---
  @ViewChild(GoogleMap) map?: GoogleMap;
  @ViewChild(MapInfoWindow) infoWindow?: MapInfoWindow;
  selectedPlace: Place | null = null;
  apiReady = false;
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

  // --- inject dependencies ---
  private svc = inject(PlacesService);
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private injector = inject(Injector);

  async ngOnInit(): Promise<void> {
    const loader = new Loader({
      apiKey: environment.googleMapsKey,
      libraries: ['marker', 'places'],
    });
    await loader.load();
    this.apiReady = true;

    await this.adminService.initRealtimeAdminMode(this.route);

    // ✅ Use Angular’s effect with proper context
    effect(
      () => {
        this.isAdmin = this.adminService.isAdmin();
      },
      { injector: this.injector }
    );

    this.svc.getPlaces().subscribe((list) => {
      this.places = list ?? [];
      this.applyFilters();
      this.recomputeDisabledTags();
      this.fitToMarkers();
    });
  }

  ngOnDestroy() {
    this.adminService.cleanup();
  }

  // ---------- Admin menu ----------
  openMenu(p: Place, ev: MouseEvent) {
    ev.stopPropagation();
    this.menuOpenFor = this.menuOpenFor?.id === p.id ? null : p;
  }

  goEdit(p: Place) {
    this.router.navigate(['/add-place', p.id]);
  }

  async confirmDelete(p: Place) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await this.svc.deletePlace(p.id!);
    this.menuOpenFor = null;
  }

  closeMenu() {
    this.menuOpenFor = null;
  }

  // ---------- Filtering ----------
  onTagClicked(selectedTag: string) {
    this.toggle(this.selectedTags, selectedTag);
    this.applyFilters();
    this.recomputeDisabledTags();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  isTagDisabled(tag: string): boolean {
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
    this.filteredPlaces = this.places.filter((p) =>
      this.selectedTags.every((t) => p.tags?.includes(t))
    );
    this.infoWindow?.close();
    this.fitToMarkers();
    this.recomputeDisabledTags();
  }

  // ---------- Map ----------
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
      if (this.selectedTags.includes(tag)) continue;
      const need = [...this.selectedTags, tag];
      const anyHasAll = this.places.some((p) =>
        need.every((t) => p.tags?.includes(t))
      );
      if (!anyHasAll) set.add(tag);
    }
    this.disabledTags = set;
  }

  // ---------- Cards & Info Window ----------
  getImage(p: Place): string | null {
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
