export interface Recipe {
  id?: string;            // Firestore doc id
  ownerId?: string;       // uid of whoever added it; each cook sees only their own
  name: string;           // Card title
  image: string;          // Cover image URL (storage or external) - what the card shows
  images?: string[];      // Every photo, cover first; older recipes only have `image`
  category: string;       // Breakfast, Sides, etc.
  time?: string;          // Cook/prep time, e.g. "25 mins"
  cuisine?: string;       // Italian, Turkish, Mexican... shown as a colored pill
  notes?: string;         // Free text (tips, ingredients, small write-up)
  notesImages?: string[]; // Photos of the written instructions, in page order
  sourceUrl?: string;     // Optional external link (YouTube/blog)
  shared?: boolean;       // Owner shares their recipes - readable by anyone (see RecipeShare)
  madeCount?: number;     // How many times it has been cooked
  lastMadeAt?: any;       // serverTimestamp of the last +1
  createdAt?: any;        // serverTimestamp
  updatedAt?: any;        // serverTimestamp
}

/**
 * A cook's public, read-only link: /recipes/{handle}.
 * Stored at recipeShares/{handle}; anyone can read it. While it exists,
 * every recipe of that owner carries `shared: true`, which is what the
 * Firestore rule actually checks - deleting it alone doesn't unshare.
 */
export interface RecipeShare {
  handle: string;  // the doc id, and the last part of the link
  ownerId: string;
  name: string;    // shown to visitors: "<name>'s Recipes"
  createdAt?: any;
}

/**
 * The order categories appear in across the app: the chip bar, the sections,
 * the add/edit dropdown and the Reminders page. Anything not listed here
 * follows after these, A-Z.
 */
export const RECIPE_CATEGORY_ORDER = [
  'Breakfast', 'Soups', 'Appetizers', 'Dips', 'Salads', 'Breads & Grains',
  'Sandwich', 'Sandwiches', 'Pastas', 'Pasta', 'Mains', 'Sides', 'Snacks',
  'Desserts', 'Drinks',
];

function categoryRank(category: string): number {
  const i = RECIPE_CATEGORY_ORDER.indexOf(category);
  return i === -1 ? RECIPE_CATEGORY_ORDER.length : i;
}

/** Sort comparator for category names, following RECIPE_CATEGORY_ORDER. */
export function compareCategories(a: string, b: string): number {
  return categoryRank(a) - categoryRank(b) || a.localeCompare(b);
}

/** A recipe's photos, cover first - also for recipes saved before `images` existed. */
export function recipePhotos(r: Partial<Recipe> | null | undefined): string[] {
  if (r?.images?.length) return r.images;
  return r?.image ? [r.image] : [];
}
