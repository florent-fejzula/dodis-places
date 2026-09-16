import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  effect,
  signal,
  computed,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription, filter, of, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

import { RecipesService } from 'src/app/services/recipes.service';
import { Recipe } from 'src/app/models/recipes';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/auth/auth.service';
import {
  MobileNavAction,
  MobileNavService,
} from 'src/app/services/mobile-nav.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent implements OnInit, OnDestroy {
  private static readonly CATEGORY_ORDER = [
    'Breakfast', 'Soups', 'Appetizers', 'Dips', 'Salads', 'Sides',
    'Sandwich', 'Sandwiches', 'Pastas', 'Pasta', 'Mains', 'Snacks', 'Desserts',
  ];

  /**
   * One colour per cuisine, picked deterministically from the name, so a new
   * cuisine gets its own colour without anyone choosing one. Tuned to read
   * against the dark gradient at the bottom of a card photo.
   */
  private static readonly CUISINE_COLORS = [
    '#f0b429', // amber
    '#7ec8e3', // sky
    '#f4728c', // rose
    '#7ed6a5', // mint
    '#c9a0f0', // violet
    '#ff9269', // coral
    '#9fd356', // lime
    '#4fc3c3', // teal
    '#e8a0c0', // blush
    '#d4b483', // sand
  ];

  private static readonly TIME_BUCKETS = [
    { label: '15 mins', minMinutes: 1,   maxMinutes: 15  },
    { label: '30 mins', minMinutes: 16,  maxMinutes: 30  },
    { label: '1 hr',    minMinutes: 31,  maxMinutes: 60  },
    { label: '2 hrs',   minMinutes: 61,  maxMinutes: 120 },
  ];
  private recipesSvc = inject(RecipesService);
  private adminSvc = inject(AdminService);
  private router = inject(Router);
  auth = inject(AuthService);
  private mobileNav = inject(MobileNavService);

  // UI state
  selectedCategory = signal<string>('');
  selectedTimes = signal<ReadonlySet<number>>(new Set());
  showAddForm = signal<boolean>(false);
  showDetail = signal<boolean>(false);
  detailRecipe = signal<Recipe | null>(null);
  editMode = signal(false);
  editNotesText = '';
  editTimeText = '';
  editCuisineChoice = '';
  editNewCuisine = '';

  // data
  recipes = signal<Recipe[]>([]);

  // admin flag (Places tools; recipes are owned per user, see canEdit)
  isAdmin = this.adminSvc.isAdmin;

  /** Every recipe on screen belongs to the signed-in user, so signed in = can edit. */
  canEdit = computed(() => !!this.auth.user());
  signedOut = computed(() => !this.auth.loading() && !this.auth.user());

  /**
   * Emits undefined until Firebase has restored the session, so we never
   * decide "no recipes" before we know who is signed in.
   */
  private user$ = toObservable(
    computed(() => (this.auth.loading() ? undefined : this.auth.user()))
  );
  private recipesSub?: Subscription;
  private claimedLegacy = false;
  recipesLoaded = signal(false);

  cropFile: File | null = null;
  lockAspectRatio = true;

  /** Detail view, add form and cropper all count as "a modal is open". */
  anyModalOpen = computed(
    () => this.showDetail() || this.showAddForm() || this.showCropper()
  );

  /** Nothing behind a modal should scroll — phones especially. */
  private scrollLock = effect(() => {
    document.body.style.overflow = this.anyModalOpen() ? 'hidden' : '';
  });

  toast = signal<{ message: string; actionLabel?: string; action?: () => void } | null>(
    null
  );
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // long-press state for the "+1 made" gesture on touch
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private pressOrigin: { x: number; y: number } | null = null;
  private suppressClickTimer: ReturnType<typeof setTimeout> | null = null;
  private suppressNextClick = false;
  private lastPointerType: string = 'mouse';

  /** On mobile the header collapses into the top bar + side menu. */
  private mobileNavSync = effect(() => {
    const actions: MobileNavAction[] = [
      { label: 'Copy recipes', run: () => this.copyRecipes() },
    ];
    if (this.canEdit()) {
      actions.unshift({
        label: '+ Add Recipe',
        run: () => this.showAddForm.set(true),
      });
    }
    this.mobileNav.setPage('Recipes', actions);
  });

  groupedRecipes = computed(() => {
    const catFilter = this.selectedCategory();
    const timeFilter = this.selectedTimes();
    const list = this.recipes();
    let visible = !catFilter ? list : list.filter((r) => r.category === catFilter);
    if (timeFilter.size > 0) {
      const buckets = RecipesComponent.TIME_BUCKETS.filter((b) => timeFilter.has(b.maxMinutes));
      visible = visible.filter((r) => {
        const parsed = this.parseTimeMinutes(r.time ?? '');
        if (!parsed) return false;
        return buckets.some((b) => parsed.min <= b.maxMinutes && parsed.max >= b.minMinutes);
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
    cuisine: '',
    time: '',
    notes: '',
    sourceUrl: '',
  };

  // category selection (dropdown + new)
  categoryChoice = '';
  newCategory = '';
  cuisineChoice = '';
  newCuisine = '';
  readonly NEW_OPT = '__new__';

  // file input reference
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ---- Cropper state (upload-before-save)
  showCropper = signal(false);
  imageChangedEvent: Event | null = null;
  private pendingRawFileName = 'recipe-image';
  private croppedBlob: Blob | null = null;

  ngOnInit() {
    this.recipesSub = this.user$
      .pipe(
        filter((user) => user !== undefined),
        switchMap((user) =>
          user ? this.recipesSvc.getRecipes(user.uid) : of([] as Recipe[])
        )
      )
      .subscribe((list) => {
        this.recipes.set(list || []);
        this.recipesLoaded.set(true);
        this.claimLegacyIfEmpty(list ?? []);
      });
  }

  /**
   * Recipes added before ownership existed have no ownerId, so they match
   * nobody's query. Only worth a round trip when the original owner actually
   * sees an empty page - never on a normal load.
   */
  private claimLegacyIfEmpty(list: Recipe[]) {
    const user = this.auth.user();
    if (!user || !this.isAdmin() || this.claimedLegacy || list.length) return;

    this.claimedLegacy = true;
    this.recipesSvc.claimUnownedRecipes(user.uid).catch(() => 0);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.recipesSub?.unsubscribe();
    document.body.style.overflow = '';
    this.mobileNav.clear();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.suppressClickTimer) clearTimeout(this.suppressClickTimer);
    this.cancelPress();
  }

  // ---------- Copy to clipboard ----------

  /** Everything currently on screen, as plain text: whatever the filters show. */
  buildRecipesText(): string {
    const sections = this.groupedRecipes();
    const blocks: string[] = [];

    for (const section of sections) {
      const lines = [section.category.toUpperCase()];

      for (const r of section.items) {
        lines.push('');
        lines.push(r.time ? `${r.name} (${r.time})` : r.name);

        if (r.notes?.trim()) {
          for (const line of r.notes.trim().split(/\r?\n/)) {
            lines.push(`  ${line.trim()}`);
          }
        }
        if (r.sourceUrl?.trim()) lines.push(`  ${r.sourceUrl.trim()}`);
      }

      blocks.push(lines.join('\n'));
    }

    return blocks.join('\n\n');
  }

  private countVisible(): number {
    return this.groupedRecipes().reduce((sum, s) => sum + s.items.length, 0);
  }

  async copyRecipes() {
    const count = this.countVisible();
    if (!count) {
      this.showToast('Nothing to copy');
      return;
    }

    const text = this.buildRecipesText();

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Safari/iOS outside a user gesture, or an insecure context
      if (!this.copyViaTextarea(text)) {
        this.showToast('Couldn’t copy — check clipboard permissions');
        return;
      }
    }

    this.showToast(
      count === 1 ? 'Copied 1 recipe' : `Copied ${count} recipes`
    );
  }

  private copyViaTextarea(text: string): boolean {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  private showToast(
    message: string,
    action?: { label: string; run: () => void },
    ms = 2500
  ) {
    this.toast.set({
      message,
      actionLabel: action?.label,
      action: action?.run,
    });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), ms);
  }

  runToastAction() {
    const action = this.toast()?.action;
    this.toast.set(null);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    action?.();
  }

  // ---------- Cooked counter ----------

  madeCount(recipe: Recipe | null | undefined): number {
    return Math.max(0, recipe?.madeCount ?? 0);
  }

  madeLabel(recipe: Recipe | null | undefined): string {
    const n = this.madeCount(recipe);
    if (!n) return 'Not made yet';
    return n === 1 ? 'Made once' : `Made ${n} times`;
  }

  /** What the corner badge itself says: the count once there is one, "+1" as an invite before that. */
  madeBadgeText(recipe: Recipe | null | undefined): string {
    const n = this.madeCount(recipe);
    return n > 0 ? `${n}×` : '+1';
  }

  /** One gesture, no confirmation - the toast offers an undo instead. */
  async addMade(recipe: Recipe, ev?: Event) {
    ev?.stopPropagation();
    if (!recipe?.id || !this.canEdit()) return;

    const next = this.madeCount(recipe) + 1;
    this.patchLocalRecipe(recipe.id, { madeCount: next });

    this.showToast(
      next === 1 ? 'Made once' : `Made ${next} times`,
      { label: 'Undo', run: () => this.undoMade(recipe) },
      4000
    );

    try {
      await this.recipesSvc.bumpMade(recipe.id, 1);
    } catch {
      this.patchLocalRecipe(recipe.id, { madeCount: next - 1 });
      this.showToast('Couldn’t save that');
    }
  }

  private async undoMade(recipe: Recipe) {
    if (!recipe?.id) return;
    const current = this.madeCount(this.recipes().find((r) => r.id === recipe.id));
    if (current <= 0) return;

    this.patchLocalRecipe(recipe.id, { madeCount: current - 1 });
    await this.recipesSvc.bumpMade(recipe.id, -1).catch(() => {});
  }

  /** Keeps the grid and the open detail in step before Firestore answers. */
  private patchLocalRecipe(id: string, patch: Partial<Recipe>) {
    this.recipes.update((list) =>
      list.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
    const open = this.detailRecipe();
    if (open?.id === id) this.detailRecipe.set({ ...open, ...patch });
  }

  // ---------- Long press (touch) = +1 ----------

  onCardPointerDown(recipe: Recipe, ev: PointerEvent) {
    this.lastPointerType = ev.pointerType;
    // Desktop has the hover button; a long mouse press should not fire too
    if (ev.pointerType === 'mouse' || !this.canEdit()) return;

    this.cancelPress();
    this.pressOrigin = { x: ev.clientX, y: ev.clientY };
    this.pressTimer = setTimeout(() => {
      this.pressTimer = null;
      this.holdClickSuppression();
      navigator.vibrate?.(18);
      this.addMade(recipe);
    }, 500);
  }

  onCardPointerMove(ev: PointerEvent) {
    if (!this.pressTimer || !this.pressOrigin) return;
    // A finger travelling this far is scrolling the grid, not holding a card
    if (
      Math.abs(ev.clientX - this.pressOrigin.x) > 10 ||
      Math.abs(ev.clientY - this.pressOrigin.y) > 10
    ) {
      this.cancelPress();
    }
  }

  onCardPointerUp() {
    this.cancelPress();
  }

  onCardContextMenu(ev: Event) {
    // Stop the iOS/Android press-and-hold menu stealing the gesture
    if (this.lastPointerType !== 'mouse') ev.preventDefault();
  }

  /** The card's click fires right after a long press - swallow that one. */
  openDetailsFromCard(recipe: Recipe) {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    this.openDetails(recipe);
  }

  private holdClickSuppression() {
    this.suppressNextClick = true;
    if (this.suppressClickTimer) clearTimeout(this.suppressClickTimer);
    // Some browsers swallow the click entirely; do not strand the flag
    this.suppressClickTimer = setTimeout(
      () => (this.suppressNextClick = false),
      700
    );
  }

  private cancelPress() {
    if (this.pressTimer) clearTimeout(this.pressTimer);
    this.pressTimer = null;
    this.pressOrigin = null;
  }

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  /** Esc closes the topmost thing that is open, one layer at a time. */
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showCropper()) {
      this.closeCropper();
      return;
    }
    if (this.showAddForm()) {
      this.showAddForm.set(false);
      return;
    }
    if (this.showDetail()) {
      // step back out of editing first, rather than losing the edits outright
      if (this.editMode()) this.cancelEdit();
      else this.closeDetails();
    }
  }

  // details
  openDetails(r: Recipe) {
    this.detailRecipe.set(r);
    this.showDetail.set(true);
  }
  closeDetails() {
    this.showDetail.set(false);
    this.detailRecipe.set(null);
    this.editMode.set(false);
  }

  // inline edit (admin)
  startEdit() {
    const r = this.detailRecipe();
    this.editNotesText = r?.notes ?? '';
    this.editTimeText = r?.time ?? '';

    const cuisine = (r?.cuisine ?? '').trim();
    // A cuisine that no other recipe uses still has to be selectable
    this.editCuisineChoice =
      cuisine && !this.cuisines().includes(cuisine) ? this.NEW_OPT : cuisine;
    this.editNewCuisine =
      this.editCuisineChoice === this.NEW_OPT ? cuisine : '';

    this.editMode.set(true);
  }
  cancelEdit() { this.editMode.set(false); }

  private resolvedEditCuisine(): string {
    return (
      this.editCuisineChoice === this.NEW_OPT
        ? this.editNewCuisine
        : this.editCuisineChoice
    ).trim();
  }
  async saveEdit() {
    const recipe = this.detailRecipe();
    if (!recipe?.id) return;
    const updates: Partial<Recipe> = {
      notes: this.editNotesText,
      time: this.editTimeText,
      cuisine: this.resolvedEditCuisine(),
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

  // every cuisine already in use, for the dropdowns
  cuisines = computed(() => {
    const set = new Set<string>(
      this.recipes()
        .map((r) => (r.cuisine || '').trim())
        .filter(Boolean)
    );
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  /** Stable colour for a cuisine name — same name always gets the same one. */
  cuisineColor(cuisine: string | undefined | null): string {
    const name = (cuisine || '').trim().toLowerCase();
    if (!name) return RecipesComponent.CUISINE_COLORS[0];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    const palette = RecipesComponent.CUISINE_COLORS;
    return palette[Math.abs(hash) % palette.length];
  }

  /**
   * Same colour, darkened — the palette is tuned for white text over a photo,
   * so it needs more weight on the light detail page.
   */
  cuisineInk(cuisine: string | undefined | null): string {
    const hex = this.cuisineColor(cuisine).replace('#', '');
    const darker = [0, 2, 4]
      .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.62))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('');
    return `#${darker}`;
  }

  timeBuckets = computed(() => {
    const recipes = this.recipes();
    return RecipesComponent.TIME_BUCKETS.filter((bucket) =>
      recipes.some((r) => {
        const parsed = this.parseTimeMinutes(r.time ?? '');
        return parsed !== null && parsed.min <= bucket.maxMinutes && parsed.max >= bucket.minMinutes;
      }),
    );
  });

  toggleTime(maxMinutes: number) {
    const next = new Set(this.selectedTimes());
    if (next.has(maxMinutes)) { next.delete(maxMinutes); } else { next.add(maxMinutes); }
    this.selectedTimes.set(next);
  }

  clearTimes() {
    this.selectedTimes.set(new Set());
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

  onCuisineChange(val: string) {
    this.cuisineChoice = val;
    this.newRecipe.cuisine = val === this.NEW_OPT ? '' : val;
  }

  // ---- Image from clipboard (kept simple: direct upload, no crop)
  async onPasteImage(e: ClipboardEvent) {
    if (this.showCropper()) return;
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
    this.showCropper.set(true);

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
    this.showCropper.set(true);

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
    this.showCropper.set(false);
    this.cropFile = null;
    this.croppedBlob = null;
  }

  async addRecipe() {
    const category =
      this.categoryChoice === this.NEW_OPT
        ? (this.newCategory || '').trim()
        : (this.categoryChoice || this.newRecipe.category || '').trim();

    this.newRecipe.category = category;
    this.newRecipe.cuisine = (
      this.cuisineChoice === this.NEW_OPT
        ? this.newCuisine || ''
        : this.cuisineChoice || this.newRecipe.cuisine || ''
    ).trim();

    const { name, image, category: cat } = this.newRecipe;
    if (!name || !image || !cat) return;

    const uid = this.auth.user()?.uid;
    if (!uid) return;

    await this.recipesSvc.addRecipe(this.newRecipe, uid);

    // reset form
    this.newRecipe = {
      name: '',
      image: '',
      category: '',
      cuisine: '',
      time: '',
      notes: '',
      sourceUrl: '',
    };
    this.categoryChoice = '';
    this.newCategory = '';
    this.cuisineChoice = '';
    this.newCuisine = '';
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
