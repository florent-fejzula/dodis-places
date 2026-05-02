import {
  Component,
  OnInit,
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
export class RecipesComponent implements OnInit {
  private recipesSvc = inject(RecipesService);
  private adminSvc = inject(AdminService);

  // UI state
  selectedCategory = signal<string>('');
  showAddForm = signal<boolean>(false);
  showDetail = signal<boolean>(false);
  detailRecipe = signal<Recipe | null>(null);

  mobileMenuOpen = signal(false);

  // data
  recipes = signal<Recipe[]>([]);

  // admin flag
  isAdmin = this.adminSvc.isAdmin;

  cropFile: File | null = null;
  lockAspectRatio = true;

  // derived
  filteredRecipes = computed(() => {
    const cat = this.selectedCategory();
    const all = this.recipes();
    return !cat ? all : all.filter((r) => r.category === cat);
  });

  groupedRecipes = computed(() => {
    const catFilter = this.selectedCategory(); // if you still want sidebar filtering
    const list = this.recipes();

    const visible = !catFilter
      ? list
      : list.filter((r) => r.category === catFilter);

    // group by category
    const map = new Map<string, Recipe[]>();
    for (const r of visible) {
      const cat = (r.category || 'Other').trim() || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }

    // order categories: preferred order first, then alphabetic
    const preferred = [
      'Breakfast',
      'Appetizers',
      'Dips',
      'Salads',
      'Sides',
      'Sandwich',
      'Sandwiches',
      'Pastas',
      'Pasta',
      'Mains',
      'Snacks',
      'Desserts',
    ];

    const cats = Array.from(map.keys());
    const ordered = [
      ...preferred.filter((c) => map.has(c)),
      ...cats
        .filter((c) => !preferred.includes(c))
        .sort((a, b) => a.localeCompare(b)),
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

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  // details
  openDetails(r: Recipe) {
    this.detailRecipe.set(r);
    this.showDetail.set(true);
  }
  closeDetails() {
    this.showDetail.set(false);
    this.detailRecipe.set(null);
  }

  // categories for dropdown
  categories(): string[] {
    const set = new Set<string>(
      this.recipes()
        .map((r) => r.category)
        .filter(Boolean),
    );

    const pref = [
      'Breakfast',
      'Appetizers',
      'Dips',
      'Salads',
      'Sides',
      'Sandwich',
      'Sandwiches',
      'Pastas',
      'Pasta',
      'Mains',
      'Snacks',
      'Desserts',
    ];

    const found = pref.filter((c) => set.has(c));
    const rest = [...set].filter((c) => !pref.includes(c)).sort();
    return found.concat(rest);
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
