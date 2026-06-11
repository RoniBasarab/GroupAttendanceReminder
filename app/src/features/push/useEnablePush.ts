import { useMutation } from '@tanstack/react-query';

import { registerPushToken } from '@/shared/api/push';
import { useSessionStore } from '@/shared/state/useSessionStore';

import { registerForPush } from './';

/** Requests notification permission, gets an FCM token, and registers it with the API. */
export function useEnablePush() {
  const deviceToken = useSessionStore((state) => state.session?.deviceToken);
  return useMutation({
    mutationFn: async () => {
      if (!deviceToken) throw new Error('Not signed in.');
      const registration = await registerForPush();
      if (!registration) return 'unavailable' as const;
      await registerPushToken(registration.token, deviceToken, registration.platform);
      return registration.platform;
    },
  });
}
