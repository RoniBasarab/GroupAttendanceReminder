import { registerTokenSchema, validate } from '@gar/core';
import type { Database } from '@gar/core/db';
import { pushTokens } from '@gar/core/schema';
import { and, eq } from 'drizzle-orm';

import { AppError } from '../errors.js';

/** Registers (or moves) an FCM token to this member. Tokens are globally unique. */
export async function registerToken(db: Database, memberId: string, input: unknown): Promise<void> {
  const parsed = validate(registerTokenSchema, input);
  if (!parsed.ok) throw new AppError(400, parsed.errors.join(' '));
  const { token, platform } = parsed.data;

  await db
    .insert(pushTokens)
    .values({ memberId, platform, token })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { memberId, platform, updatedAt: new Date() },
    });
}

export async function unregisterToken(db: Database, memberId: string, token: string): Promise<void> {
  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.token, token), eq(pushTokens.memberId, memberId)));
}
