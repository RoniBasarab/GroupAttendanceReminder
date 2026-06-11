import { apiFetch } from './client';

/** Registers an FCM token for this signed-in member. */
export function registerPushToken(
  fcmToken: string,
  deviceToken: string,
  platform: 'android' | 'web',
): Promise<void> {
  return apiFetch<void>('/api/push/tokens', {
    method: 'POST',
    token: deviceToken,
    body: { token: fcmToken, platform },
  });
}
