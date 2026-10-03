import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import {
  getFunctions,
  httpsCallable,
  Functions,
} from 'firebase/functions';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging,
} from 'firebase/messaging';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ReminderSettings } from '../models/reminders';
import { slugify } from '../utils/general.util';

/**
 * Only reachable from Recipes and its Settings page (both lazy routes), so
 * the Messaging/Functions SDKs this pulls in never load for a visitor who
 * only ever opens Places.
 */
@Injectable({ providedIn: 'root' })
export class RemindersService {
  private firestore = inject(Firestore);
  private app = inject(FirebaseApp);
  private functions: Functions = getFunctions(this.app);

  /** Resolved once: null in a browser/context that can't do push at all. */
  private messagingReady: Promise<Messaging | null> = isSupported()
    .then((supported) => (supported ? getMessaging(this.app) : null))
    .catch(() => null);

  async countRegisteredDevices(uid: string): Promise<number> {
    const snap = await getDocs(collection(this.firestore, `users/${uid}/fcmTokens`));
    return snap.size;
  }

  permissionState(): 'unsupported' | NotificationPermission {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  }

  settings$(uid: string): Observable<ReminderSettings[]> {
    return collectionData(collection(this.firestore, `users/${uid}/reminderSettings`), {
      idField: 'id',
    }) as Observable<ReminderSettings[]>;
  }

  async setFrequency(
    uid: string,
    category: string,
    frequencyDays: number | null
  ): Promise<void> {
    const ref = doc(this.firestore, `users/${uid}/reminderSettings/${slugify(category)}`);
    const existing = await getDoc(ref);

    if (existing.exists()) {
      await updateDoc(ref, { frequencyDays, updatedAt: serverTimestamp() });
    } else {
      await setDoc(ref, {
        category,
        frequencyDays,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  /**
   * Asks for notification permission (must be called from a click - browsers
   * ignore the prompt otherwise), then registers this device for push.
   * Throws with a message suitable to show directly to the user.
   */
  async enableForDevice(uid: string): Promise<void> {
    if (typeof Notification === 'undefined') {
      throw new Error("This browser can't receive notifications.");
    }
    const messaging = await this.messagingReady;
    if (!messaging) {
      throw new Error('Notifications aren\u2019t available in this browser.');
    }
    if (!environment.vapidKey) {
      throw new Error('Notifications aren\u2019t set up yet.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notifications were not allowed.');
    }

    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: environment.vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) {
      throw new Error('Could not register this device for notifications.');
    }

    const ref = doc(this.firestore, `users/${uid}/fcmTokens/${encodeURIComponent(token)}`);
    await setDoc(ref, {
      token,
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * A push that arrives while this tab is open and focused never reaches
   * the service worker's background handler (that's the whole point of
   * "background") - the page has to show it itself. Routes it through the
   * same service-worker notification API combined-sw.js uses in the
   * background case, so the result looks and behaves identically either way.
   */
  private foregroundListenerArmed = false;

  /** Safe to call from multiple components - only ever subscribes once. */
  async listenForForegroundPushes(): Promise<void> {
    if (this.foregroundListenerArmed) return;
    this.foregroundListenerArmed = true;

    const messaging = await this.messagingReady;
    if (!messaging) return;

    onMessage(messaging, async (payload) => {
      const registration = await navigator.serviceWorker.ready;
      const recipeId = payload.data?.['recipeId'];
      await registration.showNotification(
        payload.notification?.title ?? 'Recipe reminder',
        {
          body: payload.notification?.body,
          icon: 'assets/icons/icon-192x192.png',
          badge: 'assets/icons/icon-72x72.png',
          tag: recipeId ? `recipe-${recipeId}` : 'recipe-reminder',
          data: { url: recipeId ? `/recipes?open=${recipeId}` : '/recipes' },
        }
      );
    });
  }

  async sendTestReminder(category: string): Promise<string> {
    const call = httpsCallable<{ category: string }, { recipeName: string }>(
      this.functions,
      'sendTestReminder'
    );
    const result = await call({ category });
    return result.data.recipeName;
  }
}
