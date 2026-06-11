// HMAC-signed token for the email one-tap confirm link (recipients aren't logged in).
// Stateless: encodes memberId + date, signed with CONFIRM_SECRET (falls back to CRON_SECRET).
import { createHmac, timingSafeEqual } from 'node:crypto';

function secret(): string {
  const value = process.env.CONFIRM_SECRET ?? process.env.CRON_SECRET;
  if (!value) throw new Error('CONFIRM_SECRET or CRON_SECRET must be set for confirm links.');
  return value;
}

export function signConfirmToken(memberId: string, date: string): string {
  const payload = `${memberId}.${date}`;
  const mac = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${mac}`;
}

export function verifyConfirmToken(token: string): { memberId: string; date: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  let payload: string;
  try {
    payload = Buffer.from(parts[0], 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  const given = Buffer.from(parts[1]);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  const [memberId, date] = payload.split('.');
  if (!memberId || !date) return null;
  return { memberId, date };
}
