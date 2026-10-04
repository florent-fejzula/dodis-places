/**
 * Recipe reminders.
 *
 * Runs every 15 minutes from 11:00 to 14:45, and for every (user, category)
 * pair with a reminder frequency set, checks whether its randomly rolled
 * next date (about every N days, at a random time 11:00-14:00) has come.
 * When it has: picks a random recipe from that category (not the same one
 * as last time, if there's a choice), and pushes "Long time no <category>!"
 * to every device that user has registered.
 *
 * Data model (all under the existing `users/{uid}` doc, so the existing
 * Firestore rule - owner-only read/write on `users/{uid}/**` - already
 * covers it; nothing new to open up):
 *   users/{uid}/reminderSettings/{categorySlug}
 *     { category, frequencyDays, lastSentAt?, lastRecipeId?, createdAt,
 *       nextDueAt?, nextDueForDays? }   <- the last two are server-only
 *   users/{uid}/fcmTokens/{tokenId}
 *     { token, createdAt }
 */
import { initializeApp } from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
  FieldValue,
  DocumentReference,
} from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

interface ReminderSettings {
  category: string;
  frequencyDays: number | null;
  lastSentAt?: Timestamp;
  lastRecipeId?: string;
  createdAt?: Timestamp;
  /** When the next reminder goes out - rolled with jitter, see rollNextDue. */
  nextDueAt?: Timestamp;
  /** The frequencyDays nextDueAt was rolled for; a mismatch means re-roll. */
  nextDueForDays?: number;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  ownerId: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// "Every 2 weeks" should feel like "about every 2 weeks", not clockwork:
// each gap is a whole number of days, uniformly random within +/-15% of the
// setting. 7 -> 6..8, 14 -> 12..16, 30 -> 26..35, 60 -> 51..69, 90 -> 77..103.
const JITTER = 0.15;

function jitteredDays(frequencyDays: number): number {
  const min = Math.max(1, Math.round(frequencyDays * (1 - JITTER)));
  const max = Math.max(min, Math.round(frequencyDays * (1 + JITTER)));
  return min + Math.floor(Math.random() * (max - min + 1));
}

// The time of day is random too: somewhere between 11:00 and 14:00 local.
// The schedule below only runs inside this window, so keep them in sync.
const TIME_ZONE = 'Europe/Skopje';
const WINDOW_START_MIN = 11 * 60;
const WINDOW_END_MIN = 14 * 60;

/** Calendar date and minutes-past-midnight of `ms`, as seen in TIME_ZONE. */
function localParts(ms: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    minutes: get('hour') * 60 + get('minute'),
  };
}

/** The instant that is `minutes` past local midnight on `ms`'s local date. */
function atLocalTime(ms: number, minutes: number): number {
  const { year, month, day } = localParts(ms);
  const asIfUtc = Date.UTC(year, month - 1, day) + minutes * 60 * 1000;
  // Shift by the zone's offset at that moment (+1h winter, +2h summer).
  const seen = localParts(asIfUtc);
  const seenAsUtc =
    Date.UTC(seen.year, seen.month - 1, seen.day) + seen.minutes * 60 * 1000;
  return asIfUtc - (seenAsUtc - asIfUtc);
}

function rollNextDue(from: Timestamp, frequencyDays: number) {
  const dueDay = from.toMillis() + jitteredDays(frequencyDays) * DAY_MS;
  const minutes =
    WINDOW_START_MIN +
    Math.floor(Math.random() * (WINDOW_END_MIN - WINDOW_START_MIN + 1));
  return {
    nextDueAt: Timestamp.fromMillis(atLocalTime(dueDay, minutes)),
    nextDueForDays: frequencyDays,
  };
}

/** Dates rolled before the time window existed (any time of day) get re-rolled. */
function inWindow(at: Timestamp): boolean {
  const { minutes } = localParts(at.toMillis());
  return minutes >= WINDOW_START_MIN && minutes <= WINDOW_END_MIN;
}

function isDue(nextDueAt: Timestamp, now: Timestamp): boolean {
  // A minute of slack in case a run starts a hair before the quarter-hour.
  return now.toMillis() >= nextDueAt.toMillis() - 60 * 1000;
}

function pickRecipe(recipes: Recipe[], avoidId?: string): Recipe | null {
  if (!recipes.length) return null;
  const pool =
    recipes.length > 1 && avoidId
      ? recipes.filter((r) => r.id !== avoidId)
      : recipes;
  const from = pool.length ? pool : recipes;
  return from[Math.floor(Math.random() * from.length)];
}

async function recipesForCategory(
  uid: string,
  category: string
): Promise<Recipe[]> {
  const snap = await db
    .collection('recipes')
    .where('ownerId', '==', uid)
    .where('category', '==', category)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

/** Sends to every token on file; prunes the ones FCM says are dead. */
async function pushToUser(
  uid: string,
  category: string,
  recipe: Recipe
): Promise<boolean> {
  const tokensSnap = await db
    .collection('users')
    .doc(uid)
    .collection('fcmTokens')
    .get();
  if (tokensSnap.empty) return false;

  const tokens = tokensSnap.docs.map((d) => d.data()['token'] as string);
  // Data-only on purpose. With a `notification` block the Firebase SDK in
  // the service worker displays it by itself, and combined-sw.js then shows
  // its own as well - two notifications per reminder, one without an icon.
  // Data-only leaves exactly one place that draws it: combined-sw.js.
  const result = await messaging.sendEachForMulticast({
    tokens,
    data: {
      title: `Long time no ${category}!`,
      body: `How about making ${recipe.name} again?`,
      recipeId: recipe.id,
      category,
      url: `/recipes?open=${recipe.id}`,
    },
    webpush: {
      // Data-only pushes default to normal priority, which Android can hold
      // back while the phone is idle; a reminder should arrive on time.
      headers: { Urgency: 'high', TTL: String(24 * 60 * 60) },
    },
  });

  const dead: DocumentReference[] = [];
  result.responses.forEach((r, i) => {
    const code = r.error?.code;
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      dead.push(tokensSnap.docs[i].ref);
    }
  });
  if (dead.length) {
    const batch = db.batch();
    dead.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  return result.successCount > 0;
}

async function processDueReminder(
  settingsRef: DocumentReference,
  settings: ReminderSettings,
  now: Timestamp
) {
  const uid = settingsRef.parent.parent?.id;
  if (!uid) return;

  const recipes = await recipesForCategory(uid, settings.category);
  const recipe = pickRecipe(recipes, settings.lastRecipeId);
  if (!recipe) {
    logger.info(`No recipes left in "${settings.category}" for ${uid}, skipping.`);
    return;
  }

  const sent = await pushToUser(uid, settings.category, recipe);
  if (!sent) {
    logger.info(`No registered device for ${uid}, leaving "${settings.category}" due.`);
    return;
  }

  await settingsRef.update({
    lastSentAt: FieldValue.serverTimestamp(),
    lastRecipeId: recipe.id,
    ...rollNextDue(now, settings.frequencyDays!),
  });
  logger.info(`Reminded ${uid} about "${settings.category}" -> ${recipe.name}`);
}

export const sendRecipeReminders = onSchedule(
  // Every 15 minutes from 11:00 to 14:45 - a reminder goes out on the first
  // run at or after its rolled time, so 11:00-14:00 in quarter-hour steps.
  // (The 14:15-14:45 runs only matter if a send failed and is retrying.)
  { schedule: '*/15 11-14 * * *', timeZone: TIME_ZONE },
  async () => {
    const now = Timestamp.now();
    const snap = await db.collectionGroup('reminderSettings').get();

    for (const doc of snap.docs) {
      const settings = doc.data() as ReminderSettings;
      const frequencyDays = settings.frequencyDays;

      if (!frequencyDays) {
        // Turned off: forget the rolled date, so turning it back on later
        // rolls a fresh one instead of firing on a stale one.
        if (settings.nextDueAt) {
          await doc.ref.update({
            nextDueAt: FieldValue.delete(),
            nextDueForDays: FieldValue.delete(),
          });
        }
        continue;
      }

      let nextDueAt = settings.nextDueAt;
      if (
        !nextDueAt ||
        settings.nextDueForDays !== frequencyDays ||
        !inWindow(nextDueAt)
      ) {
        // New reminder, or the frequency was changed on the Settings page:
        // roll from the last send (or from when it was set up, so a new
        // reminder waits about one interval before its first ping).
        const baseline = settings.lastSentAt ?? settings.createdAt;
        if (!baseline) continue;
        const rolled = rollNextDue(baseline, frequencyDays);
        await doc.ref.update(rolled);
        nextDueAt = rolled.nextDueAt;
      }

      if (isDue(nextDueAt, now)) {
        await processDueReminder(doc.ref, settings, now);
      }
    }
  }
);

/**
 * Lets the Settings page send one reminder right now, for whichever category
 * the caller asks for - so "does this actually work" doesn't require waiting
 * for the daily schedule (or the real interval) to find out.
 */
export const sendTestReminder = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Log in first.');

  const category = (request.data?.category as string | undefined)?.trim();
  if (!category) throw new HttpsError('invalid-argument', 'Missing category.');

  const recipes = await recipesForCategory(uid, category);
  const recipe = pickRecipe(recipes);
  if (!recipe) {
    throw new HttpsError('not-found', `No recipes in "${category}" yet.`);
  }

  const sent = await pushToUser(uid, category, recipe);
  if (!sent) {
    throw new HttpsError(
      'failed-precondition',
      'No device registered for notifications yet.'
    );
  }

  return { recipeName: recipe.name };
});
