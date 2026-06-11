/* Firebase web-push background handler.
   The Firebase web config is passed in via the registration query string
   (see registerPush.web.ts) so no config values are committed to the repo. */
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

const params = new URLSearchParams(self.location.search);
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Attendance Reminder';
  const body = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(title, { body });
});
