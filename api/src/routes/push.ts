import { db } from '@gar/core/db';
import { Router } from 'express';

import { requireMember } from '../auth/middleware.js';
import { AppError, asyncHandler } from '../errors.js';
import { registerToken, unregisterToken } from '../services/push.js';

export const pushRouter = Router();

pushRouter.post(
  '/tokens',
  requireMember(db),
  asyncHandler(async (req, res) => {
    await registerToken(db, req.member!.id, req.body);
    res.status(204).end();
  }),
);

// Token is sent in the body (FCM tokens are long/URL-unsafe).
pushRouter.delete(
  '/tokens',
  requireMember(db),
  asyncHandler(async (req, res) => {
    const token = String(req.body?.token ?? '');
    if (!token) throw new AppError(400, 'token is required.');
    await unregisterToken(db, req.member!.id, token);
    res.status(204).end();
  }),
);
