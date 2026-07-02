import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

import { RecipesService } from 'src/app/services/recipes.service';
import { Recipe } from 'src/app/models/recipes';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent implements OnInit, OnDestroy {
  private static readonly CATEGORY_ORDER = [
    'Breakfast', 'Appetizers', 'Dips', 'Salads', 'Sides',
    'Sandwich', 'Sandwiches', 'Pastas', 'Pasta', 'Mains', 'Snacks', 'Desserts',
  ];

  private static readonly TIME_BUCKETS = [
    { label: '15 mins', maxMinutes: 15 },
    { label: '30 mins', maxMinutes: 30 },
    { label: '1 hr',    maxMinutes: 60 },
    { label: '2 hrs',   maxMinutes: 120 },
  ];
  private recipesSvc = inject(RecipesService);
  private adminSvc = inject(AdminService);

  // UI state
  selectedCategory = signal<string>('');
  selectedTime = signal<number | null>(null);
  showAddForm = signal<boolean>(false);
  showDetail = signal<boolean>(false);
  detailRecipe = signal<Recipe | null>(null);
  editMode = signal(false);
  editNotesText = '';
  editTimeText = '';

  // data
  recipes = signal<Recipe[]>([]);

  // admin flag
  isAdmin = this.adminSvc.isAdmin;

  cropFile: File | null = null;
  lockAspectRatio = true;

  groupedRecipes = computed(() => {
    const catFilter = this.selectedCategory();
    const timeFilter = this.selectedTime();
    const list = this.recipes();
    let visible = !catFilter ? list : list.filter((r) => r.category === catFilter);
    if (timeFilter !== null) {
      visible = visible.filter((r) => {
        const parsed = this.parseTimeMinutes(r.time ?? '');
        return parsed !== null && parsed.min <= timeFilter;
      });
    }

    const map = new Map<string, Recipe[]>();
    for (const r of visible) {
      const cat = (r.category || 'Other').trim() || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }

    const order = RecipesComponent.CATEGORY_ORDER;
    const cats = Array.from(map.keys());
    const ordered = [
      ...order.filter((c) => map.has(c)),
      ...cats.filter((c) => !order.includes(c)).sort((a, b) => a.localeCompare(b)),
    ];

    return ordered.map((category) => ({
      category,
      items: (map.get(category) || [])
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    }));
  });

  // Add form model
  newRecipe: Partial<Recipe> = {
    name: '',
    image: '',
    category: '',
    time: '',
    notes: '',
    sourceUrl: '',
  };

  // category selection (dropdown + new)
  categoryChoice = '';
  newCategory = '';
  readonly NEW_OPT = '__new__';

  // file input reference
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ---- Cropper state (upload-before-save)
  showCropper = false;
  imageChangedEvent: Event | null = null;
  private pendingRawFileName = 'recipe-image';
  private croppedBlob: Blob | null = null;

  ngOnInit() {
    this.recipesSvc.getRecipes().subscribe((list) => {
      this.recipes.set(list || []);
    });
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  // details
  openDetails(r: Recipe) {
    this.detailRecipe.set(r);
    this.showDetail.set(true);
    document.body.style.overflow = 'hidden';
  }
  closeDetails() {
    this.showDetail.set(false);
    this.detailRecipe.set(null);
    this.editMode.set(false);
    document.body.style.overflow = '';
  }

  // inline edit (admin)
  startEdit() {
    const r = this.detailRecipe();
    this.editNotesText = r?.notes ?? '';
    this.editTimeText = r?.time ?? '';
    this.editMode.set(true);
  }
  cancelEdit() { this.editMode.set(false); }
  async saveEdit() {
    const recipe = this.detailRecipe();
    if (!recipe?.id) return;
    const updates: Partial<Recipe> = {
      notes: this.editNotesText,
      time: this.editTimeText,
    };
    await this.recipesSvc.updateRecipe(recipe.id, updates);
    this.detailRecipe.set({ ...recipe, ...updates });
    this.editMode.set(false);
  }

  // categories for chip bar and add-form dropdown — memoized
  categories = computed(() => {
    const set = new Set<string>(this.recipes().map((r) => r.category).filter(Boolean));
    const order = RecipesComponent.CATEGORY_ORDER;
    const found = order.filter((c) => set.has(c));
    const rest = [...set].filter((c) => !order.includes(c)).sort();
    return found.concat(rest);
  });

  timeBuckets = computed(() => {
    const recipes = this.recipes();
    return RecipesComponent.TIME_BUCKETS.filter((bucket) =>
      recipes.some((r) => {
        const parsed = this.parseTimeMinutes(r.time ?? '');
        return parsed !== null && parsed.min <= bucket.maxMinutes;
      }),
    );
  });

  selectTime(maxMinutes: number | null) {
    this.selectedTime.set(maxMinutes);
  }

  private parseTimeMinutes(timeStr: string): { min: number; max: number } | null {
    if (!timeStr) return null;
    const s = timeStr.toLowerCase().trim();

    const rangeMatch = s.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(min|hr|hour)/);
    if (rangeMatch) {
      const mult = rangeMatch[3].startsWith('h') ? 60 : 1;
      return { min: parseFloat(rangeMatch[1]) * mult, max: parseFloat(rangeMatch[2]) * mult };
    }

    const singleMatch = s.match(/(\d+(?:\.\d+)?)\s*(min|hr|hour)/);
    if (singleMatch) {
      const mins = parseFloat(singleMatch[1]) * (singleMatch[2].startsWith('h') ? 60 : 1);
      return { min: mins, max: mins };
    }

    return null;
  }

  onCategoryChange(val: string) {
    this.categoryChoice = val;
    if (val !== this.NEW_OPT) {
      this.newRecipe.category = val;
    } else {
      this.newRecipe.category = '';
    }
  }

  // ---- Image from clipboard (kept simple: direct upload, no crop)
  async onPasteImage(e: ClipboardEvent) {
    if (this.showCropper) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    const it = Array.from(items).find(
      (i) => i.kind === 'file' && i.type.startsWith('image/'),
    );
    if (!it) return;

    const blob = it.getAsFile();
    if (!blob) return;

    // Turn clipboard blob into a File so cropper can use it
    const ext = blob.type === 'image/png' ? 'png' : 'jpg';
    const file = new File([blob], `pasted-recipe-${Date.now()}.${ext}`, {
      type: blob.type,
    });

    this.pendingRawFileName = 'pasted-recipe';
    this.cropFile = file;
    this.croppedBlob = null;
    this.showCropper = true;

    // Optional: prevent the pasted image from also being inserted into inputs
    e.preventDefault();
  }

  // ---- Upload from device (now opens cropper first)
  triggerFilePicker() {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.pendingRawFileName =
      file.name?.replace(/\.[^/.]+$/, '') || 'recipe-image';

    this.cropFile = file; // ✅ pass file directly
    this.croppedBlob = null;
    this.showCropper = true;

    input.value = ''; // ✅ safe now
  }

  onImageCropped(event: ImageCroppedEvent) {
    // Prefer blob if available (newer ngx-image-cropper versions)
    if (event.blob) {
      this.croppedBlob = event.blob;
      return;
    }

    // Fallback: base64 -> blob
    if (event.base64) {
      this.croppedBlob = this.base64ToBlob(event.base64);
    }
  }

  async applyCroppedImage() {
    if (!this.croppedBlob) return;

    const file = this.blobToFile(
      this.croppedBlob,
      `${this.pendingRawFileName}-cropped.webp`,
      'image/webp',
    );

    const url = await this.recipesSvc.uploadRecipeImage(file);
    this.newRecipe.image = url;

    this.closeCropper();
  }

  closeCropper() {
    this.showCropper = false;
    this.cropFile = null;
    this.croppedBlob = null;
  }

  // admin: add recipe
  async addRecipe() {
    const category =
      this.categoryChoice === this.NEW_OPT
        ? (this.newCategory || '').trim()
        : (this.categoryChoice || this.newRecipe.category || '').trim();

    this.newRecipe.category = category;

    const { name, image, category: cat } = this.newRecipe;
    if (!name || !image || !cat) return;

    await this.recipesSvc.addRecipe(this.newRecipe);

    // reset form
    this.newRecipe = {
      name: '',
      image: '',
      category: '',
      time: '',
      notes: '',
      sourceUrl: '',
    };
    this.categoryChoice = '';
    this.newCategory = '';
    this.showAddForm.set(false);
  }

  // admin: delete
  async deleteRecipe(r: Recipe, ev: MouseEvent) {
    ev.stopPropagation();
    if (!r.id) return;
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    await this.recipesSvc.deleteRecipe(r.id);
  }

  // ---------------- helpers ----------------

  private blobToFile(blob: Blob, fileName: string, mimeType?: string): File {
    return new File([blob], fileName, {
      type: mimeType || blob.type || 'image/webp',
    });
  }

  private base64ToBlob(base64: string): Blob {
    // base64 format: data:image/png;base64,....
    const [header, data] = base64.split(',');
    const mimeMatch = header?.match(/data:(.*?);base64/);
    const mime = mimeMatch?.[1] || 'image/png';

    const byteString = atob(data);
    const byteNumbers = new Array(byteString.length);
    for (let i = 0; i < byteString.length; i++)
      byteNumbers[i] = byteString.charCodeAt(i);

    return new Blob([new Uint8Array(byteNumbers)], { type: mime });
  }
}
