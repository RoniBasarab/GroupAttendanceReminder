import type { Database } from '@gar/core/db';
import { members } from '@gar/core/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from 'express';

import { AppError, asyncHandler } from '../errors.js';
import { hashToken } from './tokens.js';

/** Authenticates the request by its Bearer device token and attaches req.member. */
export function requireMember(db: Database): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new AppError(401, 'Missing authentication token.');

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.deviceTokenHash, hashToken(token)))
      .limit(1);
    if (!member) throw new AppError(401, 'Invalid authentication token.');

    req.member = member;
    next();
  });
}

/** Requires the authenticated member to be the group admin. Mount after requireMember. */
export const ensureAdmin: RequestHandler = (req, _res, next) => {
  if (req.member?.role !== 'admin') {
    next(new AppError(403, 'Admin only.'));
    return;
  }
  next();
};
