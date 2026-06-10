import { db } from '@gar/core/db';
import { Router } from 'express';

import { requireMember } from '../auth/middleware.js';
import { asyncHandler } from '../errors.js';
import { createGroup, getSessionInfo, joinGroup } from '../services/membership.js';

export const groupsRouter = Router();

groupsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const session = await createGroup(db, req.body);
    res.status(201).json(session);
  }),
);

groupsRouter.post(
  '/join',
  asyncHandler(async (req, res) => {
    const session = await joinGroup(db, req.body);
    res.status(201).json(session);
  }),
);

export const meRouter = Router();

meRouter.get(
  '/',
  requireMember(db),
  asyncHandler(async (req, res) => {
    const info = await getSessionInfo(db, req.member!);
    res.json(info);
  }),
);
