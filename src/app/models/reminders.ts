export interface ReminderSettings {
  /** Firestore doc id - a slug of the category name */
  id?: string;
  category: string;
  /** null/absent = "don't set reminder" */
  frequencyDays: number | null;
  lastSentAt?: any;
  lastRecipeId?: string;
  createdAt?: any;
  updatedAt?: any;
}

/** The small, fixed set of cadences the Settings page offers. */
export const REMINDER_FREQUENCIES: { label: string; days: number | null }[] = [
  { label: "Don't remind", days: null },
  { label: 'Weekly', days: 7 },
  { label: 'Every 2 weeks', days: 14 },
  { label: 'Monthly', days: 30 },
  { label: 'Every 2 months', days: 60 },
  { label: 'Every 3 months', days: 90 },
];
