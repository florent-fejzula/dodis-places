// Combined service worker.
//
// provideServiceWorker() registers THIS file instead of the plain
// ngsw-worker.js, because a page can only have one service worker per scope.
// Pulling in ngsw-worker.js keeps every existing PWA behaviour (offline
// shell, the recipe-photo cache) exactly as it was; the Firebase Messaging
// piece on top is what lets a reminder notification show up while the app
// isn't open.
//
// Firebase config here is the same public web config as environment.ts -
// safe to inline, since it only identifies the project, like the apiKey
// already committed there.
importScripts('./ngsw-worker.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDnyZ8J5fuAlurIOyvmCUdRwuWS3u9fAX8',
  authDomain: 'dodi-s-places.firebaseapp.com',
  projectId: 'dodi-s-places',
  storageBucket: 'dodi-s-places.firebasestorage.app',
  messagingSenderId: '514987896059',
  appId: '1:514987896059:web:54dedb8f20f766584a545e',
});

const messaging = firebase.messaging();

// Fires when a push arrives and no tab has the app focused - the normal
// case for a "long time no X" reminder.
// Reminders arrive as data-only messages (see functions/src/index.ts), so
// this is the only code that draws them - the SDK shows nothing on its own.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data ?? {};
  const recipeId = data.recipeId;

  return self.registration.showNotification(
    data.title ?? payload.notification?.title ?? 'Recipe reminder',
    {
      body: data.body ?? payload.notification?.body,
      icon: 'assets/icons/icon-192x192.png',
      badge: 'assets/icons/icon-72x72.png',
      // Same tag for the same recipe: a repeat replaces, never stacks
      tag: recipeId ? `recipe-${recipeId}` : 'recipe-reminder',
      data: {
        url: data.url ?? (recipeId ? `/recipes?open=${recipeId}` : '/recipes'),
      },
    }
  );
});

// Tapping the notification should land on that exact recipe, reusing an
// already-open tab rather than piling up new ones.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/recipes';

  event.waitUntil(
    (async () => {
      const clientsList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const existing = clientsList.find((c) => 'focus' in c);

      if (existing) {
        await existing.focus();
        existing.postMessage({ type: 'open-recipe', url });
        return;
      }
      await clients.openWindow(url);
    })()
  );
});
