/* Firebase web-push background handler. Config below is non-secret (client-side). */
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'REDACTED_FIREBASE_API_KEY',
  authDomain: 'groupattendancereminder.firebaseapp.com',
  projectId: 'groupattendancereminder',
  storageBucket: 'groupattendancereminder.firebasestorage.app',
  messagingSenderId: '343074023273',
  appId: '1:343074023273:web:ce65a36954ea63e952fff8',
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Attendance Reminder';
  const body = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(title, { body });
});
