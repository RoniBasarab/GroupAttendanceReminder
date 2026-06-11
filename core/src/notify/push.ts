// FCM push sender (Firebase Admin). Node-only; reached via "@gar/core/notify".
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type PushResult = {
  sent: number;
  failed: number;
  /** Tokens FCM reports as permanently invalid — callers should delete these. */
  invalidTokens: string[];
};

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

function ensureApp(): void {
  if (getApps().length > 0) return;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase admin env missing (FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).');
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

/** Sends one notification to many device tokens. Returns counts + invalid tokens to prune. */
export async function sendPush(tokens: string[], message: PushMessage): Promise<PushResult> {
  if (tokens.length === 0) return { sent: 0, failed: 0, invalidTokens: [] };
  ensureApp();
  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title: message.title, body: message.body },
    data: message.data,
  });
  const invalidTokens: string[] = [];
  response.responses.forEach((result, index) => {
    if (!result.success && result.error && INVALID_TOKEN_CODES.has(result.error.code)) {
      invalidTokens.push(tokens[index]);
    }
  });
  return { sent: response.successCount, failed: response.failureCount, invalidTokens };
}
