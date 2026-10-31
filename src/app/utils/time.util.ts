/**
 * Reads the free-text cook time on a recipe ("35 mins", "1 hr 30 mins",
 * "1h30", "1.5 hrs", "20-30 mins", "45 min - 1 hr", "3 hrs") as minutes.
 * Returns null when there is no number to read (e.g. "overnight").
 */
export function parseCookTime(text: string): { min: number; max: number } | null {
  if (!text) return null;
  const s = text
    .toLowerCase()
    .replace(/½/g, '.5')
    .replace(/(\d),(\d)/g, '$1.$2');

  // A range: "20-30 mins", "1–1.5 hrs", "45 min to 1 hr"
  const parts = s.split(/\s*(?:-|–|—|\bto\b)\s*/).filter((p) => /\d/.test(p));
  if (parts.length === 2) {
    // "20-30 mins": the first half borrows the unit of the second
    const unitOfSecond = /h/.test(parts[1].replace(/\d|\.|\s/g, '')) ? 'h' : 'm';
    const a = durationMinutes(parts[0], unitOfSecond);
    const b = durationMinutes(parts[1]);
    if (a !== null && b !== null) return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  const single = durationMinutes(s);
  return single === null ? null : { min: single, max: single };
}

/** One duration, every part added up: "1 hr 30 mins" -> 90, "1h30" -> 90. */
function durationMinutes(text: string, bareUnit: 'h' | 'm' = 'm'): number | null {
  const re = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)?(?![a-z])/g;
  let total = 0;
  let found = false;
  let sawHours = false;

  for (const [, num, unit] of text.matchAll(re)) {
    const n = parseFloat(num);
    if (unit?.startsWith('h')) {
      total += n * 60;
      sawHours = true;
    } else if (unit) {
      total += n;
    } else {
      // A bare number: minutes after an hour part ("1h30"), else the default
      total += sawHours || bareUnit === 'm' ? n : n * 60;
    }
    found = true;
  }

  return found ? Math.round(total) : null;
}

/** A single number for a cook time: the middle of a range. */
export function cookMinutes(text: string): number | null {
  const t = parseCookTime(text);
  return t === null ? null : (t.min + t.max) / 2;
}
