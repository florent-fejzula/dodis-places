import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  effect,
  signal,
  computed,
  WritableSignal,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, filter, of, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

import { RecipesService } from 'src/app/services/recipes.service';
import { Recipe, RecipeShare, compareCategories, recipePhotos } from 'src/app/models/recipes';
import { AuthService } from 'src/app/auth/auth.service';
import {
  MobileNavAction,
  MobileNavService,
} from 'src/app/services/mobile-nav.service';
import { RemindersService } from 'src/app/services/reminders.service';
import { downscaleImage } from 'src/app/utils/image.util';
import { cookMinutes } from 'src/app/utils/time.util';
import { DragScrollDirective } from 'src/app/directives/drag-scroll.directive';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ImageCropperComponent, DragScrollDirective],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent implements OnInit, OnDestroy {
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

  /**
   * Each recipe lands in the bucket whose label its time is closest to, so
   * 35 mins is "30 mins", not "1 hr". "Closest" is by ratio rather than by
   * difference (10 extra minutes matter more on a quick dish than on a slow
   * one), so the cut-offs sit near the geometric middle of two labels:
   * sqrt(15*30) ~ 21, sqrt(30*60) ~ 42, sqrt(60*90) ~ 74.
   */
  private static readonly TIME_BUCKETS = [
    { label: '15 mins', upTo: 21 },
    { label: '30 mins', upTo: 42 },
    { label: '1 hr', upTo: 75 },
    { label: '1½ hrs+', upTo: Infinity },
  ];

  private static timeBucketOf(time: string | undefined): string | null {
    const minutes = cookMinutes(time ?? '');
    if (minutes === null) return null;
    return RecipesComponent.TIME_BUCKETS.find((b) => minutes <= b.upTo)!.label;
  }
  private recipesSvc = inject(RecipesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);
  private mobileNav = inject(MobileNavService);
  private remindersSvc = inject(RemindersService);

  // UI state
  selectedCategory = signal<string>('');
  selectedTimes = signal<ReadonlySet<string>>(new Set());
  showAddForm = signal<boolean>(false);
  showDetail = signal<boolean>(false);
  detailRecipe = signal<Recipe | null>(null);
  editMode = signal(false);
  editNotesText = '';
  editNotePhotos = signal<string[]>([]);
  editPhotos = signal<string[]>([]);

  // Detail view photos: the big one plus thumbnails to switch between them
  detailPhotos = computed(() => recipePhotos(this.detailRecipe()));
  heroIndex = signal(0);
  heroPhoto = computed(
    () => this.detailPhotos()[this.heroIndex()] ?? this.detailPhotos()[0]
  );
  editTimeText = '';
  editCuisineChoice = '';
  editNewCuisine = '';

  // data
  recipes = signal<Recipe[]>([]);

  /**
   * /recipes/{handle}: someone's shared collection, read-only - no login,
   * no editing, no "made" counts. Plain /recipes is the signed-in cook's own.
   */
  readonly viewHandle = this.route.snapshot.paramMap.get('handle');
  readonly viewing = !!this.viewHandle;
  share = signal<RecipeShare | null>(null);
  /** The link doesn't exist, or sharing was turned off. */
  shareMissing = signal(false);
  /** The owner opened their own share link - show them it's the visitor view. */
  isOwnShare = computed(
    () => !!this.share() && this.share()!.ownerId === this.auth.user()?.uid
  );

  pageTitle = computed(() => {
    const name = this.share()?.name;
    return this.viewing && name ? `${name}'s Recipes` : 'Recipes';
  });

  /** Own page: every recipe on screen belongs to the signed-in user, so signed in = can edit. */
  canEdit = computed(() => !this.viewing && !!this.auth.user());
  signedOut = computed(
    () => !this.viewing && !this.auth.loading() && !this.auth.user()
  );

  /**
   * Emits undefined until Firebase has restored the session, so we never
   * decide "no recipes" before we know who is signed in.
   */
  private user$ = toObservable(
    computed(() => (this.auth.loading() ? undefined : this.auth.user()))
  );
  private recipesSub?: Subscription;
  private queryParamSub?: Subscription;
  recipesLoaded = signal(false);

  /** "/recipes?open=<id>" - how a tapped reminder notification lands here. */
  private pendingOpenId = signal<string | null>(null);
  private autoOpenFromLink = effect(() => {
    const id = this.pendingOpenId();
    if (!id) return;
    const match = this.recipes().find((r) => r.id === id);
    if (!match) return; // recipes may not have loaded yet - reruns when they do

    this.pendingOpenId.set(null);
    this.openDetails(match);
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  });

  cropFile: File | null = null;
  lockAspectRatio = true;

  /** Detail view, add form, cropper and photo viewer all count as "a modal is open". */
  anyModalOpen = computed(
    () =>
      this.showDetail() ||
      this.showAddForm() ||
      this.showCropper() ||
      this.lightbox() !== null
  );

  /** Nothing behind a modal should scroll — phones especially. */
  private scrollLock = effect(() => {
    // On <html>, not <body>: html { overflow-y: scroll } makes html the
    // window's scroller, so a lock on body wouldn't hold
    document.documentElement.style.overflow = this.anyModalOpen() ? 'hidden' : '';
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
      actions.push({
        label: 'Sharing & reminders',
        run: () => this.router.navigate(['/recipes/settings']),
      });
      actions.unshift({
        label: '+ Add Recipe',
        run: () => this.showAddForm.set(true),
      });
    }
    this.mobileNav.setPage(this.pageTitle(), actions);
  });

  groupedRecipes = computed(() => {
    const catFilter = this.selectedCategory();
    const timeFilter = this.selectedTimes();
    const list = this.recipes();
    let visible = !catFilter ? list : list.filter((r) => r.category === catFilter);
    if (timeFilter.size > 0) {
      visible = visible.filter((r) => {
        const bucket = RecipesComponent.timeBucketOf(r.time);
        return bucket !== null && timeFilter.has(bucket);
      });
    }

    const map = new Map<string, Recipe[]>();
    for (const r of visible) {
      const cat = (r.category || 'Other').trim() || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }

    const ordered = Array.from(map.keys()).sort(compareCategories);

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

  // ---- Recipe photos (cover first) in the add form
  newPhotos = signal<string[]>([]);
  newPhotoUrl = '';

  // ---- Cropper state (upload-before-save)
  showCropper = signal(false);
  private pendingRawFileName = 'recipe-image';
  private croppedBlob: Blob | null = null;
  uploadingPhoto = signal(false);
  photoError = signal('');
  /** The photo list a finished crop is added to (add form or edit mode). */
  private cropTarget: WritableSignal<string[]> | null = null;
  /** Picking several photos crops them one after another. */
  private cropQueue: File[] = [];
  cropRemaining = signal(0);

  ngOnInit() {
    this.queryParamSub = this.route.queryParamMap.subscribe((params) => {
      this.pendingOpenId.set(params.get('open'));
    });

    if (this.viewHandle) {
      this.recipesSub = this.recipesSvc.getSharedRecipes(this.viewHandle).subscribe({
        next: ({ share, recipes }) => {
          this.share.set(share);
          this.shareMissing.set(!share);
          this.recipes.set(share ? recipes : []);
          this.recipesLoaded.set(true);
        },
        // e.g. sharing was switched off while the page was open
        error: () => {
          this.shareMissing.set(true);
          this.recipes.set([]);
          this.recipesLoaded.set(true);
        },
      });
      return;
    }

    this.remindersSvc.listenForForegroundPushes();

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
        this.syncSharedFlagsOnce(list || []);
      });
  }

  private flagsSynced = false;

  /** Once per visit: recipes added from an older tab may lack the shared flag. */
  private syncSharedFlagsOnce(list: Recipe[]) {
    const uid = this.auth.user()?.uid;
    if (this.flagsSynced || !uid || !list.length) return;
    this.flagsSynced = true;
    this.recipesSvc.syncSharedFlags(uid, list).catch(() => {});
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.recipesSub?.unsubscribe();
    this.queryParamSub?.unsubscribe();
    document.documentElement.style.overflow = '';
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
    this.backToListTop();
  }

  private host: HTMLElement = inject(ElementRef).nativeElement;

  /**
   * A filter change swaps out the whole list; if the page was scrolled
   * down, bring the new list's start up under the pinned filters. The top
   * menu stays scrolled away, and nothing moves if we're already above that.
   */
  private backToListTop() {
    const pageTop = this.host.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > pageTop) window.scrollTo({ top: pageTop });
  }

  /** Esc closes the topmost thing that is open, one layer at a time. */
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.lightbox()) {
      this.closeLightbox();
      return;
    }
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
    this.heroIndex.set(0);
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
    this.editNotePhotos.set([...(r?.notesImages ?? [])]);
    this.editPhotos.set([...recipePhotos(r)]);
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
    if (this.uploadingNotePhotos() > 0) return;
    // The card needs a cover, so a recipe can't end up with no photo at all
    const photos = this.editPhotos();
    if (!photos.length) return;
    const updates: Partial<Recipe> = {
      image: photos[0],
      images: photos,
      notes: this.editNotesText,
      notesImages: this.editNotePhotos(),
      time: this.editTimeText,
      cuisine: this.resolvedEditCuisine(),
    };
    await this.recipesSvc.updateRecipe(recipe.id, updates);
    this.heroIndex.set(0);
    this.detailRecipe.set({ ...recipe, ...updates });
    this.editMode.set(false);
  }

  // categories for chip bar and add-form dropdown — memoized
  categories = computed(() => {
    const set = new Set<string>(this.recipes().map((r) => r.category).filter(Boolean));
    return [...set].sort(compareCategories);
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

  /** Only the time buttons that would show at least one recipe. */
  timeBuckets = computed(() => {
    const used = new Set(
      this.recipes().map((r) => RecipesComponent.timeBucketOf(r.time))
    );
    return RecipesComponent.TIME_BUCKETS.filter((b) => used.has(b.label));
  });

  toggleTime(label: string) {
    const next = new Set(this.selectedTimes());
    if (next.has(label)) { next.delete(label); } else { next.add(label); }
    this.selectedTimes.set(next);
    this.backToListTop();
  }

  clearTimes() {
    this.selectedTimes.set(new Set());
    this.backToListTop();
  }

  /** Desktop only: the time filter stays folded behind its clock button. */
  timeOpen = signal(false);

  /** What the folded time button shows while a time filter is on. */
  timeSummary = computed(() => {
    const picked = this.selectedTimes();
    return RecipesComponent.TIME_BUCKETS.filter((b) => picked.has(b.label))
      .map((b) => b.label)
      .join(' · ');
  });

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

  // ---- Photos of the written instructions (Notes section)
  // No cropper here: these are pages of text, so they go up whole (just
  // shrunk), several at a time, and keep the order they were picked in.
  notePhotos = signal<string[]>([]);
  uploadingNotePhotos = signal(0);
  uploadingSlots = computed(() => Array.from({ length: this.uploadingNotePhotos() }));
  notePhotoError = signal('');

  async addNotePhotos(event: Event, list: WritableSignal<string[]>) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter((f) =>
      f.type.startsWith('image/')
    );
    input.value = '';
    if (!files.length) return;

    this.notePhotoError.set('');
    this.uploadingNotePhotos.update((n) => n + files.length);

    // Upload in parallel, but append in pick order so page 1 stays page 1
    const urls = await Promise.all(
      files.map(async (f) => {
        try {
          return await this.recipesSvc.uploadRecipeImage(await downscaleImage(f));
        } catch (err) {
          console.error('Note photo upload failed', err);
          return null;
        } finally {
          this.uploadingNotePhotos.update((n) => n - 1);
        }
      })
    );

    const ok = urls.filter((u): u is string => !!u);
    if (ok.length) list.update((l) => [...l, ...ok]);
    if (ok.length < files.length) {
      this.notePhotoError.set(
        ok.length
          ? "Some photos couldn't be uploaded. Add them again."
          : "Couldn't upload the photo. Try again."
      );
    }
  }

  removePhoto(list: WritableSignal<string[]>, index: number) {
    list.update((l) => l.filter((_, i) => i !== index));
  }

  /** Moves a photo to the front, which is what the recipe card shows. */
  makeCover(list: WritableSignal<string[]>, index: number) {
    list.update((l) => [l[index], ...l.filter((_, i) => i !== index)]);
  }

  /** The add form's URL box: Enter (or leaving the box) adds it as a photo. */
  addPhotoUrl(ev?: Event) {
    ev?.preventDefault(); // Enter would otherwise submit the whole form
    const url = this.newPhotoUrl.trim();
    if (!url) return;
    this.newPhotos.update((l) => (l.includes(url) ? l : [...l, url]));
    this.newPhotoUrl = '';
  }

  // ---- Full-screen photo viewer
  lightbox = signal<{ images: string[]; index: number } | null>(null);
  lightboxZoom = signal(false);

  openLightbox(images: string[], index: number) {
    this.lightboxZoom.set(false);
    this.lightbox.set({ images, index });
  }

  closeLightbox() {
    this.lightbox.set(null);
  }

  stepLightbox(delta: number, ev?: Event) {
    ev?.stopPropagation();
    const lb = this.lightbox();
    if (!lb) return;
    const n = lb.images.length;
    this.lightboxZoom.set(false);
    this.lightbox.set({ ...lb, index: (lb.index + delta + n) % n });
  }

  /** Tap the photo to blow it up for small print; tap again to fit. */
  toggleLightboxZoom(ev: Event) {
    ev.stopPropagation();
    this.lightboxZoom.update((z) => !z);
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight() {
    if (this.lightbox()) this.stepLightbox(1);
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft() {
    if (this.lightbox()) this.stepLightbox(-1);
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

    // Paste only exists on the add form
    this.cropTarget = this.newPhotos;
    this.cropQueue = [];
    this.startCrop(file);

    // Optional: prevent the pasted image from also being inserted into inputs
    e.preventDefault();
  }

  // ---- Upload from device: every picked photo goes through the cropper
  onPhotosPicked(event: Event, list: WritableSignal<string[]>) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter((f) =>
      f.type.startsWith('image/')
    );
    input.value = '';
    if (!files.length) return;

    this.cropTarget = list;
    this.cropQueue = files.slice(1);
    this.startCrop(files[0]);
  }

  private startCrop(file: File) {
    this.pendingRawFileName =
      file.name?.replace(/\.[^/.]+$/, '') || 'recipe-image';
    this.cropFile = file;
    this.croppedBlob = null;
    this.photoError.set('');
    this.cropRemaining.set(this.cropQueue.length);
    this.showCropper.set(true);
  }

  /** On to the next picked photo, or done. */
  private nextCrop() {
    const next = this.cropQueue.shift();
    if (next) this.startCrop(next);
    else this.closeCropper();
  }

  /** "Skip" when several were picked: leave this one out, keep going. */
  skipCrop() {
    if (this.uploadingPhoto()) return;
    this.nextCrop();
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
    if (!this.croppedBlob || this.uploadingPhoto()) return;

    const file = this.blobToFile(
      this.croppedBlob,
      `${this.pendingRawFileName}-cropped.webp`,
      'image/webp',
    );

    this.photoError.set('');
    this.uploadingPhoto.set(true);
    try {
      const url = await this.recipesSvc.uploadRecipeImage(file);
      this.cropTarget?.update((l) => [...l, url]);
      this.uploadingPhoto.set(false);
      this.nextCrop();
    } catch (err) {
      console.error('Photo upload failed', err);
      // Stay on the cropper so the crop isn't lost - just try again
      this.photoError.set("Couldn't upload the photo. Try again.");
      this.uploadingPhoto.set(false);
    }
  }

  closeCropper() {
    // Leaving mid-upload would drop the photo without the user noticing
    if (this.uploadingPhoto()) return;
    this.photoError.set('');
    this.showCropper.set(false);
    this.cropFile = null;
    this.croppedBlob = null;
    this.cropQueue = [];
    this.cropRemaining.set(0);
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

    this.addPhotoUrl(); // a URL typed but not yet added still counts
    const photos = this.newPhotos();
    const { name, category: cat } = this.newRecipe;
    if (!name || !photos.length || !cat) return;

    const uid = this.auth.user()?.uid;
    if (!uid) return;
    if (this.uploadingNotePhotos() > 0) return;

    this.newRecipe.image = photos[0];
    this.newRecipe.images = photos;
    this.newRecipe.notesImages = this.notePhotos();
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
    this.notePhotos.set([]);
    this.newPhotos.set([]);
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
