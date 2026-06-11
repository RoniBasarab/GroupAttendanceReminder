import { db } from '@gar/core/db';
import { dispatchReminders } from '@gar/core/dispatch';
import { sendEmail, sendPush } from '@gar/core/notify';
import { Router } from 'express';

import { AppError, asyncHandler } from '../errors.js';

export const internalRouter = Router();

// Vercel Cron backup. Vercel sends a GET with `Authorization: Bearer <CRON_SECRET>`.
// The reminder_log dedupe means this is a no-op if the PC worker already ran today.
internalRouter.get(
  '/dispatch',
  asyncHandler(async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.header('authorization') !== `Bearer ${secret}`) {
      throw new AppError(401, 'Unauthorized.');
    }
    const summary = await dispatchReminders(db, {
      senders: { sendPush, sendEmail },
      webUrl: process.env.WEB_URL ?? '',
    });
    res.json(summary);
  }),
);
