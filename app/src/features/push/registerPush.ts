// Native (Android) push uses React Native Firebase, which requires a dev build to
// run — it is wired and tested in Section 8.9 (APK build). On native this is a no-op
// for now; the web build overrides this file with registerPush.web.ts.
import type { PushRegistration } from './types';

export async function registerForPush(): Promise<PushRegistration | null> {
  console.warn('[push] native push is wired in Section 8.9 (dev build).');
  return null;
}
