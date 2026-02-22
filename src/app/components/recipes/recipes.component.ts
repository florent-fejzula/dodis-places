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
import { RecipesService } from 'src/app/services/recipes.service';
import { Recipe } from 'src/app/models/recipes';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent implements OnInit {
  private recipesSvc = inject(RecipesService);
  private adminSvc = inject(AdminService);

  // UI state
  selectedCategory = signal<string>('');
  selectedRecipes = signal<string[]>([]);
  showAddForm = signal<boolean>(false);
  showDetail = signal<boolean>(false);
  detailRecipe = signal<Recipe | null>(null);

  // data
  recipes = signal<Recipe[]>([]);

  // admin flag
  isAdmin = this.adminSvc.isAdmin;

  // derived
  filteredRecipes = computed(() => {
    const cat = this.selectedCategory();
    const all = this.recipes();
    return !cat ? all : all.filter((r) => r.category === cat);
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

  ngOnInit() {
    this.recipesSvc.getRecipes().subscribe((list) => {
      this.recipes.set(list || []);
    });

    this.recipesSvc.getSelectedRecipes().subscribe((data: any) => {
      if (data?.recipes?.length) this.selectedRecipes.set(data.recipes);
    });
  }

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  toggleSelect(recipeName: string) {
    const arr = [...this.selectedRecipes()];
    const i = arr.indexOf(recipeName);
    i === -1 ? arr.push(recipeName) : arr.splice(i, 1);
    this.selectedRecipes.set(arr);
    this.recipesSvc.updateSelectedRecipes(arr);
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
        .filter(Boolean)
    );
    const pref = [
      'Breakfast',
      'Appetizers',
      'Salads',
      'Sides',
      'Pastas',
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

  // ---- Image from clipboard
  async onPasteImage(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const it = Array.from(items).find(
      (i) => i.kind === 'file' && i.type.startsWith('image/')
    );
    if (!it) return;
    const file = it.getAsFile();
    if (!file) return;
    const url = await this.recipesSvc.uploadRecipeImage(file);
    this.newRecipe.image = url;
  }

  // ---- Upload from device
  triggerFilePicker() {
    this.fileInput?.nativeElement.click();
  }
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const url = await this.recipesSvc.uploadRecipeImage(file);
    this.newRecipe.image = url;
    input.value = '';
  }

  // admin: add recipe
  async addRecipe() {
    // resolve category (existing or new)
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

  isSelected(name: string) {
    return this.selectedRecipes().includes(name);
  }
}
