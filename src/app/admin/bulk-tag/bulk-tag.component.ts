import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlacesService } from 'src/app/services/places.service';
import { Place } from 'src/app/models/places';

@Component({
  selector: 'app-bulk-tag',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-tag.component.html',
  styleUrls: ['./bulk-tag.component.scss'],
})
export default class BulkTagComponent {
  private svc = inject(PlacesService);

  // data
  places = signal<Place[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  // ui state
  q = '';                // search
  pageSize = 20; 
  pageIndex = signal<number>(0);

  tagName = '';          // tag to add/remove
  selectedIds = signal<Set<string>>(new Set());

  // fetch
  constructor() {
    this.svc.getPlaces().subscribe({
      next: (rows) => { this.places.set(rows || []); this.loading.set(false); },
      error: (e) => { this.error.set(e?.message || 'Failed to load places'); this.loading.set(false); }
    });

    // ensure pageIndex is valid if filters change
    effect(() => {
      void this.filteredPlaces(); // tracks q()
      this.pageIndex.set(0);
      this.selectedIds.set(new Set()); // clear selection on new search
    });
  }

  // filtering
  filteredPlaces = computed(() => {
    const term = this.q.trim().toLowerCase();
    const all = this.places();
    if (!term) return all;
    return all.filter(p =>
      (p.name || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term) ||
      (p.tags || []).some(t => t.toLowerCase().includes(term))
    );
  });

  // paging
  pagedPlaces = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.filteredPlaces().slice(start, start + this.pageSize);
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredPlaces().length / this.pageSize))
  );

  // selection
  isSelected(id: string) { return this.selectedIds().has(id); }

  toggleSelection(id: string, checked: boolean) {
    const next = new Set(this.selectedIds());
    checked ? next.add(id) : next.delete(id);
    this.selectedIds.set(next);
  }

  selectAllOnPage() {
    const next = new Set(this.selectedIds());
    for (const p of this.pagedPlaces()) next.add(p.id as string);
    this.selectedIds.set(next);
  }

  clearSelection() { this.selectedIds.set(new Set()); }

  // paging buttons
  nextPage() {
    const idx = this.pageIndex();
    if (idx + 1 < this.totalPages()) this.pageIndex.set(idx + 1);
  }
  prevPage() {
    const idx = this.pageIndex();
    if (idx > 0) this.pageIndex.set(idx - 1);
  }

  // bulk ops
  busy = signal<boolean>(false);
  message = signal<string>('');

  private getSelectionArray(): string[] {
    return Array.from(this.selectedIds());
  }

  async applyTag() {
    const tag = this.tagName.trim();
    const ids = this.getSelectionArray();
    if (!tag || ids.length === 0) return;
    this.busy.set(true); this.message.set('');
    try {
      await this.svc.bulkAddTagToPlaces(tag, ids);
      this.message.set(`Added “${tag}” to ${ids.length} place(s).`);
      // Optimistic UI: reflect locally
      const updated = this.places().map(p =>
        ids.includes(p.id as string)
          ? { ...p, tags: Array.from(new Set([...(p.tags || []), tag])) }
          : p
      );
      this.places.set(updated);
      this.clearSelection();
    } catch (e: any) {
      this.message.set(e?.message || 'Failed to apply tag.');
    } finally {
      this.busy.set(false);
    }
  }

  async removeTag() {
    const tag = this.tagName.trim();
    const ids = this.getSelectionArray();
    if (!tag || ids.length === 0) return;
    this.busy.set(true); this.message.set('');
    try {
      await this.svc.bulkRemoveTagFromPlaces(tag, ids);
      this.message.set(`Removed “${tag}” from ${ids.length} place(s).`);
      // Optimistic UI
      const updated = this.places().map(p =>
        ids.includes(p.id as string)
          ? { ...p, tags: (p.tags || []).filter(t => t !== tag) }
          : p
      );
      this.places.set(updated);
      this.clearSelection();
    } catch (e: any) {
      this.message.set(e?.message || 'Failed to remove tag.');
    } finally {
      this.busy.set(false);
    }
  }
}
