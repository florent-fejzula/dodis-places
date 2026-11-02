/**
 * Device-local copy of each cook's recipe list (localStorage), so the
 * Recipes page can draw instantly. Lives apart from RecipesService so the
 * always-loaded AuthService can clear it on logout without pulling the
 * recipes code into the startup bundle.
 */
export const RECIPE_CACHE_PREFIX = 'dodi_recipes_v1';

/** Logout: nothing of the previous cook's should be drawn for the next. */
export function clearRecipeCaches() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(RECIPE_CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}
