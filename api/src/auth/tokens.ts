import { createHash, randomBytes } from 'node:crypto';

/** A fresh opaque device token (given to the client once; we only store its hash). */
export function generateDeviceToken(): string {
  return randomBytes(32).toString('base64url');
}

/** SHA-256 of a token — what we store and compare against. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
