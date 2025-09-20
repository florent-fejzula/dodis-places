import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { availableTags } from 'src/app/models/tags';
import { PlacesService } from 'src/app/services/places.service';
import { arrayRemove, doc, updateDoc } from '@angular/fire/firestore';

type PhotoDraft = {
  file: File;
  preview: string;
  tags: Set<string>;
  weight?: number;
  _objectUrl?: string;
};

@Component({
  selector: 'app-edit-place',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-place.component.html',
  styleUrls: ['./edit-place.component.scss'],
})
export class EditPlaceComponent implements OnInit, OnDestroy {
  constructor(
    private svc: PlacesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  id = '';
  sub?: Subscription;

  // form fields
  tags = availableTags;
  selected = new Set<string>();
  name = '';
  description = '';
  mapsLink = '';
  lat: number | string | null = null;
  lng: number | string | null = null;
  coverUrl: string | null = null;

  // existing images from Firestore
  existingImages: Array<{ url: string; tags: string[]; weight?: number }> = [];

  // queued new images
  photos: PhotoDraft[] = [];
  selectedCoverIdx: number | null = null;
  error = '';
  busy = false;

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.sub = this.svc.getPlace(this.id).subscribe((p) => {
      if (!p) return;
      this.name = p.name;
      this.description = p.description ?? '';
      this.mapsLink = p.gmapsUrl;
      this.lat = p.lat;
      this.lng = p.lng;
      this.coverUrl = p.imagePrimaryUrl ?? null;
      this.selected = new Set(p.tags || []);
      this.existingImages = p.images || [];
    });
  }
  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // validation (same as Add)
  private toNumber(v: any): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }
  get latNumber(): number | null {
    return this.toNumber(this.lat);
  }
  get lngNumber(): number | null {
    return this.toNumber(this.lng);
  }
  get canSave(): boolean {
    return (
      !!this.name?.trim() &&
      !!this.mapsLink?.trim() &&
      this.latNumber !== null &&
      this.lngNumber !== null &&
      this.selected.size > 0 &&
      !this.busy
    );
  }

  // tag toggles
  toggle(tag: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    checked ? this.selected.add(tag) : this.selected.delete(tag);
  }
  togglePhotoTagExisting(
    img: { url: string; tags: string[]; weight?: number },
    tag: string,
    ev: Event
  ) {
    const checked = (ev.target as HTMLInputElement).checked;
    const set = new Set(img.tags);
    checked ? set.add(tag) : set.delete(tag);
    img.tags = Array.from(set);
  }

  async onPaste(e: ClipboardEvent) {
    if (!e.clipboardData) return;

    // 1) Prefer actual image data in the clipboard
    const items = Array.from(e.clipboardData.items);
    const imgItem = items.find(
      (i) => i.kind === 'file' && i.type.startsWith('image/')
    );
    if (imgItem) {
      const file = imgItem.getAsFile();
      if (file) {
        this.addDraftFromFile(file);
        e.preventDefault();
        return;
      }
    }

    // 2) If not a file, try an image URL from text
    const url = e.clipboardData.getData('text').trim();
    if (!url) return;

    // Simple sanity check for http(s)
    if (!/^https?:\/\//i.test(url)) return;

    try {
      const resp = await fetch(url, { mode: 'cors' }); // requires CORS from source
      if (!resp.ok) throw new Error('Fetch failed');
      const blob = await resp.blob();
      if (!blob.type.startsWith('image/')) {
        // Sometimes a page URL is copied instead of direct image
        this.error =
          'The pasted link is not a direct image. Try “Copy image”, not “Copy image address”.';
        return;
      }
      const ext = (blob.type.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '');
      const file = new File([blob], `clipboard-${Date.now()}.${ext}`, {
        type: blob.type,
      });
      this.addDraftFromFile(file);
      e.preventDefault();
    } catch {
      this.error =
        'Could not fetch the image due to cross-origin restrictions. Try pasting the image itself (not the link).';
    }
  }

  // uploads (same paste + file as Add)
  onFilesSelected(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    Array.from(files).forEach((file) => this.addDraftFromFile(file));
    (e.target as HTMLInputElement).value = '';
  }
  private addDraftFromFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    this.photos.push({
      file,
      preview: objectUrl,
      tags: new Set<string>(),
      _objectUrl: objectUrl,
    });
  }
  removePhotoDraft(p: PhotoDraft, idx: number) {
    if (p._objectUrl) URL.revokeObjectURL(p._objectUrl);
    this.photos.splice(idx, 1);
    if (this.selectedCoverIdx === idx) this.selectedCoverIdx = null;
    if (this.selectedCoverIdx && this.selectedCoverIdx > idx)
      this.selectedCoverIdx--;
  }

  // optional: remove an existing image (from Firestore array)
  async removeExistingImage(img: {
    url: string;
    tags: string[];
    weight?: number;
  }) {
    if (!confirm('Remove this image?')) return;
    const ref = doc((this.svc as any).db, 'places', this.id); // db is private; expose a remover in service if you prefer
    await updateDoc(ref, { images: arrayRemove(img) } as any);
    if (this.coverUrl === img.url) this.coverUrl = null;
  }

  async save() {
    if (!this.canSave) return;
    this.busy = true;
    try {
      // 1) Update base fields (⚠️ no imagePrimaryUrl here)
      await this.svc.updatePlace(this.id, {
        name: this.name.trim(),
        description: this.description?.trim() || '',
        gmapsUrl: this.mapsLink.trim(),
        lat: this.latNumber!,
        lng: this.lngNumber!,
        tags: Array.from(this.selected),
        images: this.existingImages,
      });

      // 2) Upload any new photos
      const uploadedUrls: string[] = [];
      for (const d of this.photos) {
        const url = await this.svc.uploadPlaceImage(this.id, d.file);
        uploadedUrls.push(url);
        await this.svc.appendImageMeta(this.id, {
          url,
          tags: Array.from(d.tags),
          weight: d.weight ?? 0,
        });
      }

      // 3) Resolve cover candidate
      let coverCandidate: string | null = this.coverUrl || null;
      if (uploadedUrls.length) {
        const idx = this.selectedCoverIdx ?? 0;
        coverCandidate = uploadedUrls[idx] || uploadedUrls[0];
      }

      // 4) Only send imagePrimaryUrl if we actually have a string
      if (coverCandidate) {
        await this.svc.updatePlace(this.id, {
          imagePrimaryUrl: coverCandidate,
        });
      }

      alert('Changes saved ✅');
      await this.router.navigate(['/places']);
    } finally {
      this.busy = false;
    }
  }

  async deletePlace() {
    if (!confirm(`Delete "${this.name}"? This cannot be undone.`)) return;
    await this.svc.deletePlace(this.id);
    this.router.navigate(['/places']);
  }
}
