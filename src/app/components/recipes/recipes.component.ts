import { Component, OnInit } from '@angular/core';
import { NgClass, NgIf, NgFor } from '@angular/common';
import recipes, { Recipe } from 'src/app/models/recipes';
import { RecipesService } from 'src/app/services/recipes.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [NgClass],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = recipes;
  filteredRecipes: Recipe[] = [];
  selectedCategory: string = '';
  selectedRecipes: string[] = [];

  constructor(private recipesService: RecipesService) {}

  ngOnInit() {
    this.filteredRecipes = this.recipes;
    this.loadSelectedRecipes();
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filteredRecipes = category
      ? this.recipes.filter((recipe) => recipe.category === category)
      : this.recipes;
  }

  selectRecipe(recipeName: string): void {
    const index = this.selectedRecipes.indexOf(recipeName);
    if (index === -1) {
      this.selectedRecipes.push(recipeName);
    } else {
      this.selectedRecipes.splice(index, 1);
    }
    this.recipesService.updateSelectedRecipes(this.selectedRecipes);
  }

  clearSelection(): void {
    this.selectedRecipes = [];
    this.recipesService.updateSelectedRecipes(this.selectedRecipes);
  }

  loadSelectedRecipes(): void {
    this.recipesService.getSelectedRecipes().subscribe((data: any) => {
      if (data) {
        this.selectedRecipes = data.recipes;
      }
    });
  }
}
