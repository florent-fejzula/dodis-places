/**
 * Recipe reminders.
 *
 * Runs once a day, and for every (user, category) pair with a reminder
 * frequency set, checks whether enough time has passed since the last one.
 * When it has: picks a random recipe from that category (not the same one
 * as last time, if there's a choice), and pushes "Long time no <category>!"
 * to every device that user has registered.
 *
 * Data model (all under the existing `users/{uid}` doc, so the existing
 * Firestore rule - owner-only read/write on `users/{uid}/**` - already
 * covers it; nothing new to open up):
 *   users/{uid}/reminderSettings/{categorySlug}
 *     { category, frequencyDays, lastSentAt?, lastRecipeId?, createdAt }
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

/** Keep in sync with the frequency options the Settings page offers. */
const APP_URL = 'https://dodi-s-places.web.app';

interface ReminderSettings {
  category: string;
  frequencyDays: number | null;
  lastSentAt?: Timestamp;
  lastRecipeId?: string;
  createdAt?: Timestamp;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  ownerId: string;
}

function isDue(settings: ReminderSettings, now: Timestamp): boolean {
  if (!settings.frequencyDays) return false;
  // A freshly-enabled reminder waits out one full interval before its first
  // ping, rather than firing the moment someone finishes setting it up.
  const baseline = settings.lastSentAt ?? settings.createdAt;
  if (!baseline) return false;
  const dueAt = baseline.toMillis() + settings.frequencyDays * 24 * 60 * 60 * 1000;
  return now.toMillis() >= dueAt;
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
  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: `Long time no ${category}!`,
      body: `How about making ${recipe.name} again?`,
    },
    data: { recipeId: recipe.id, category },
    webpush: {
      fcmOptions: { link: `${APP_URL}/recipes?open=${recipe.id}` },
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
  });
  logger.info(`Reminded ${uid} about "${settings.category}" -> ${recipe.name}`);
}

export const sendRecipeReminders = onSchedule(
  { schedule: 'every day 18:00', timeZone: 'Europe/Skopje' },
  async () => {
    const now = Timestamp.now();
    const snap = await db.collectionGroup('reminderSettings').get();

    for (const doc of snap.docs) {
      const settings = doc.data() as ReminderSettings;
      if (isDue(settings, now)) {
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
