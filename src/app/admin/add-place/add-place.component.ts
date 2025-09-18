// src/app/admin/add-place.component.ts
import { CommonModule } from '@angular/common';
import { Component, Injector } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Place } from 'src/app/models/places';
import { availableTags } from 'src/app/models/tags';
import { PlacesService } from 'src/app/services/places.service';

type PhotoDraft = {
  file: File;
  preview: string;
  tags: Set<string>;
  weight?: number;
  _objectUrl?: string;   // to revoke later if used
};

@Component({
  selector: 'app-add-place',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-place.component.html',
  styleUrls: ['./add-place.component.scss'],
})
export class AddPlaceComponent {
  constructor(private svc: PlacesService, private injector: Injector) {}

  // ----- base place fields
  tags = availableTags;
  selected = new Set<string>();
  name = '';
  description = '';
  mapsLink = '';
  lat: number | string | null = null;
  lng: number | string | null = null;
  error = '';
  busy = false;

  // ----- photo queue
  photos: PhotoDraft[] = [];
  selectedCoverIdx: number | null = null; // which uploaded photo becomes cover

  // helpers
  private toNumber(v: any): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }
  get latNumber(): number | null { return this.toNumber(this.lat); }
  get lngNumber(): number | null { return this.toNumber(this.lng); }
  private hasTags(): boolean { return this.selected.size > 0; }

  get disableReason(): string | null {
    if (!this.mapsLink?.trim()) return 'Paste a Google Maps link';
    if (!this.name?.trim()) return 'Enter a name';
    if (this.latNumber === null) return 'Lat is invalid';
    if (this.lngNumber === null) return 'Lng is invalid';
    if (!this.hasTags()) return 'Pick at least one tag';
    return null;
  }
  get canSave(): boolean { return this.disableReason === null && !this.busy; }

  // events
  toggle(tag: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    checked ? this.selected.add(tag) : this.selected.delete(tag);
  }
  togglePhotoTag(p: PhotoDraft, tag: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    checked ? p.tags.add(tag) : p.tags.delete(tag);
  }
 
  async onPaste(e: ClipboardEvent) {
    if (!e.clipboardData) return;

    // 1) Prefer file items (actual image in clipboard)
    const items = Array.from(e.clipboardData.items);
    const imgItem = items.find(i => i.kind === 'file' && i.type.startsWith('image/'));
    if (imgItem) {
      const file = imgItem.getAsFile();
      if (file) {
        this.addDraftFromFile(file);
        e.preventDefault();
        return;
      }
    }

    // 2) If not a file, check for an image URL text
    const url = e.clipboardData.getData('text').trim();
    if (url && /^https?:\/\/.+/i.test(url) && /\.(png|jpe?g|webp|gif|bmp)(\?|#|$)/i.test(url)) {
      try {
        const resp = await fetch(url, { mode: 'cors' }); // needs CORS from source
        // Some sites block CORS; if so this will throw on resp.blob()
        const blob = await resp.blob();
        const ext = (blob.type.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '');
        const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type: blob.type });
        this.addDraftFromFile(file);
        e.preventDefault();
      } catch {
        this.error = 'Could not fetch the image due to cross-origin restrictions. Try “Copy image” (not “Copy image address”), or open the image in a new tab and copy.';
      }
    }
  }

  /** Add a draft photo from a File (used by paste & file input) */
  private addDraftFromFile(file: File) {
    // Use an object URL for fast preview without reading to base64
    const objectUrl = URL.createObjectURL(file);
    this.photos.push({ file, preview: objectUrl, tags: new Set<string>(), _objectUrl: objectUrl });
  }

  onFilesSelected(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    Array.from(files).forEach(file => this.addDraftFromFile(file));
    (e.target as HTMLInputElement).value = '';
  }

  removePhoto(p: PhotoDraft, idx: number) {
    // Revoke object URL if we created one
    if (p._objectUrl) URL.revokeObjectURL(p._objectUrl);
    this.photos.splice(idx, 1);
    if (this.selectedCoverIdx === idx) this.selectedCoverIdx = null;
    if (this.selectedCoverIdx && this.selectedCoverIdx > idx) this.selectedCoverIdx--;
  }

  async save() {
    if (!this.canSave) return;
    this.error = '';
    this.busy = true;

    try {
      // 1) Create place WITHOUT imagePrimaryUrl/images first
      const place: Place = {
        name: this.name.trim(),
        description: this.description?.trim() || '',
        gmapsUrl: this.mapsLink.trim(),
        lat: this.latNumber!, lng: this.lngNumber!,
        tags: Array.from(this.selected),
      };
      const id = await this.svc.addPlace(place);

      // 2) Upload each photo → append metadata
      const uploadedUrls: string[] = [];
      for (const draft of this.photos) {
        const url = await this.svc.uploadPlaceImage(id, draft.file);
        uploadedUrls.push(url);
        await this.svc.appendImageMeta(id, {
          url,
          tags: Array.from(draft.tags),
          weight: draft.weight ?? 0,
        });
      }

      // 3) Set cover image if there is any uploaded
      if (uploadedUrls.length) {
        const coverUrl =
          (this.selectedCoverIdx != null && uploadedUrls[this.selectedCoverIdx]) ||
          uploadedUrls[0];
        await this.svc.updatePlace(id, { imagePrimaryUrl: coverUrl });
      }

      // 4) Reset UI
      this.name = ''; this.description = ''; this.mapsLink = '';
      this.lat = null; this.lng = null; this.selected.clear();
      this.photos = []; this.selectedCoverIdx = null;
      alert('Place added ✅');
    } catch (e: any) {
      this.error = e?.message || 'Failed to add place.';
    } finally {
      this.busy = false;
    }
  }

  autoFill() {
    const link = this.mapsLink?.trim();
    if (!link) return;
    const parsed = this.svc.parseMapsLink(link);
    if (parsed.lat != null) this.lat = parsed.lat;
    if (parsed.lng != null) this.lng = parsed.lng;
    if (parsed.name && !this.name) this.name = parsed.name;
  }
}
