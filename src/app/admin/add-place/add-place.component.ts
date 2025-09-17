// src/app/admin/add-place.component.ts
import { CommonModule } from '@angular/common';
import { Component, Injector, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Place } from 'src/app/models/places';
import { availableTags } from 'src/app/models/tags';
import { PlacesService } from 'src/app/services/places.service';

@Component({
  selector: 'app-add-place',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-place.component.html',
  styleUrls: ['./add-place.component.scss'], // <-- plural
})
export class AddPlaceComponent {
  constructor(private svc: PlacesService, private injector: Injector) {}

  // ----- form state
  tags = availableTags;
  selected = new Set<string>();

  name = '';
  description = '';
  mapsLink = '';
  lat: number | string | null = null;
  lng: number | string | null = null;
  error = '';

  // ----- helpers
  private toNumber(v: any): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }
  private hasTags(): boolean {
    return this.selected.size > 0;
  }
  get latNumber(): number | null {
    return this.toNumber(this.lat);
  }
  get lngNumber(): number | null {
    return this.toNumber(this.lng);
  }

  // reason-aware validation
  get disableReason(): string | null {
    if (!this.mapsLink?.trim()) return 'Paste a Google Maps link';
    if (!this.name?.trim()) return 'Enter a name';
    if (this.latNumber === null) return 'Lat is invalid';
    if (this.lngNumber === null) return 'Lng is invalid';
    if (!this.hasTags()) return 'Pick at least one tag';
    return null;
  }
  get canSave(): boolean {
    return this.disableReason === null;
  }

  // ----- UI events
  toggle(tag: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) this.selected.add(tag);
    else this.selected.delete(tag);
  }

  async save() {
    this.error = '';
    if (!this.canSave) return;

    try {
      const place: Place = {
        name: this.name.trim(),
        description: this.description?.trim() || '',
        gmapsUrl: this.mapsLink.trim(),
        lat: this.latNumber!, // coerced numbers
        lng: this.lngNumber!,
        tags: Array.from(this.selected),
      };
      await this.svc.addPlace(place);

      // reset
      this.name = '';
      this.description = '';
      this.mapsLink = '';
      this.lat = null;
      this.lng = null;
      this.selected.clear();
      alert('Place added ✅');
    } catch (e: any) {
      this.error = e?.message || 'Failed to add place.';
    }
  }

  autoFill() {
    const link = this.mapsLink?.trim();
    if (!link) return;

    // use service parser (handles @lat,lng, q=lat,lng, !3d.. !4d.., /place/Name/)
    const parsed = this.svc.parseMapsLink(link);
    if (parsed.lat != null) this.lat = parsed.lat;
    if (parsed.lng != null) this.lng = parsed.lng;
    if (parsed.name && !this.name) this.name = parsed.name;
  }
}
