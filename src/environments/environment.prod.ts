export const environment = {
  production: true,
  adminMode: true,
  firebase: {
    apiKey: 'AIzaSyDnyZ8J5fuAlurIOyvmCUdRwuWS3u9fAX8',
    authDomain: 'dodi-s-places.firebaseapp.com',
    projectId: 'dodi-s-places',
    storageBucket: 'dodi-s-places.firebasestorage.app',
    messagingSenderId: '514987896059',
    appId: '1:514987896059:web:54dedb8f20f766584a545e',
  },
  // Web Push certificate key pair, from Firebase console ->
  // Project settings -> Cloud Messaging -> Web Push certificates.
  // Public by design (same trust level as the Firebase apiKey above) -
  // it only lets a browser register for push, nothing more.
  vapidKey: 'BCt7b1jykFc6jiaGH89jLSPnLoA25Ztd3aEUI2J1rJpwSatD5tkjUg62w8xdwIObtarZglhTtpIEJP3DjjUf3uc',
  googleMapsKey: 'AIzaSyDnyZ8J5fuAlurIOyvmCUdRwuWS3u9fAX8'
};
