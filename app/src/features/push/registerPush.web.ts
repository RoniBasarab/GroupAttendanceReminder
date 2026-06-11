// Web (PWA) push: Firebase JS messaging + service worker + VAPID.
import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

import { firebaseWebConfig, vapidKey } from './firebaseConfig';
import type { PushRegistration } from './types';

export async function registerForPush(): Promise<PushRegistration | null> {
  if (!(await isSupported())) return null;
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseWebConfig);
  const messaging = getMessaging(app);
  const swParams = new URLSearchParams({
    apiKey: firebaseWebConfig.apiKey ?? '',
    authDomain: firebaseWebConfig.authDomain ?? '',
    projectId: firebaseWebConfig.projectId ?? '',
    messagingSenderId: firebaseWebConfig.messagingSenderId ?? '',
    appId: firebaseWebConfig.appId ?? '',
  });
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${swParams.toString()}`,
  );
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

  return token ? { token, platform: 'web' } : null;
}
