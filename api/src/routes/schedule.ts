import { db } from '@gar/core/db';
import { Router } from 'express';

import { ensureAdmin, requireMember } from '../auth/middleware.js';
import { asyncHandler } from '../errors.js';
import {
  deleteException,
  getSchedule,
  setWeeklySchedule,
  upsertException,
} from '../services/schedule.js';

export const scheduleRouter = Router();

// Any member can read the schedule (to sync + know when to expect a reminder).
scheduleRouter.get(
  '/',
  requireMember(db),
  asyncHandler(async (req, res) => {
    res.json(await getSchedule(db, req.member!.groupId));
  }),
);

// Admin-only mutations.
scheduleRouter.put(
  '/weekly',
  requireMember(db),
  ensureAdmin,
  asyncHandler(async (req, res) => {
    res.json(await setWeeklySchedule(db, req.member!.groupId, req.body));
  }),
);

scheduleRouter.post(
  '/exceptions',
  requireMember(db),
  ensureAdmin,
  asyncHandler(async (req, res) => {
    res.json(await upsertException(db, req.member!.groupId, req.body));
  }),
);

scheduleRouter.delete(
  '/exceptions/:date',
  requireMember(db),
  ensureAdmin,
  asyncHandler(async (req, res) => {
    const date = String(req.params.date);
    res.json(await deleteException(db, req.member!.groupId, date));
  }),
);
