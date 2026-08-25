import { Place } from "../models/places";

const TAG_PRIORITY = [
  'specialty','dessert','pizza','sushi','burger','breakfast','coffee','food'
  // extend if you like; earlier = higher priority
];

export function selectCardImage(
  place: Place,
  activeTags: string[]
): string | null {
  const imgs = place.images || [];
  if (!imgs.length) return place.imagePrimaryUrl || null;
  if (!activeTags.length) return place.imagePrimaryUrl || imgs[0]?.url || null;

  // score images by overlap with activeTags
  const scored = imgs.map(img => {
    const overlap = img.tags.filter(t => activeTags.includes(t));
    const allMatch = activeTags.every(t => img.tags.includes(t)); // perfect
    const priority = Math.min(
      ...overlap.map(t => {
        const idx = TAG_PRIORITY.indexOf(t);
        return idx === -1 ? 999 : idx;
      }),
      999
    );
    return {
      img,
      allMatch,
      score: overlap.length,
      weight: img.weight ?? 0,
      priority
    };
  });

  // 1) perfect match
  const perfect = scored.find(s => s.allMatch);
  if (perfect) return perfect.img.url;

  // 2) best overlap → highest score, then weight, then tag priority, then first
  scored.sort((a, b) =>
    b.score - a.score ||
    (b.weight - a.weight) ||
    a.priority - b.priority
  );

  return scored[0]?.score ? scored[0].img.url : (place.imagePrimaryUrl || imgs[0]?.url || null);
}
/** Latin/Macedonian-friendly slug: "Kafe Čaršija" -> "kafe-carsija" */
export function slugify(value: string): string {
  const map: Record<string, string> = {
    č: 'c', ć: 'c', š: 's', ž: 'z', đ: 'dj',
    ѓ: 'g', ќ: 'k', ј: 'j', љ: 'lj', њ: 'nj', џ: 'dz',
  };

  return (value || '')
    .toLowerCase()
    .replace(/[čćšžđѓќјљњџ]/g, (ch) => map[ch] ?? ch)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip remaining accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Finds a place by its slug, falling back to its Firestore id. */
export function findPlaceBySlug(places: Place[], slug: string): Place | null {
  if (!slug) return null;
  const wanted = slug.toLowerCase();
  return (
    places.find((p) => slugify(p.name) === wanted) ||
    places.find((p) => p.id === slug) ||
    null
  );
}
