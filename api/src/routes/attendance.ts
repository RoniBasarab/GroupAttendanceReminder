import { todayInTimeZone } from '@gar/core';
import { verifyConfirmToken } from '@gar/core/auth';
import { db } from '@gar/core/db';
import { Router } from 'express';

import { requireMember } from '../auth/middleware.js';
import { AppError, asyncHandler } from '../errors.js';
import { confirmAttendance } from '../services/attendance.js';

export const attendanceRouter = Router();

// App confirm (authenticated by device token).
attendanceRouter.post(
  '/confirm',
  requireMember(db),
  asyncHandler(async (req, res) => {
    const status = await confirmAttendance(db, req.member!.id);
    res.json({ status });
  }),
);

// Email one-tap confirm (HMAC token). Renders a simple HTML page (opened in a browser).
attendanceRouter.get(
  '/confirm-email',
  asyncHandler(async (req, res) => {
    const parsed = verifyConfirmToken(String(req.query.token ?? ''));
    if (!parsed) {
      res.status(400).type('html').send(page('הקישור אינו תקין.'));
      return;
    }
    if (parsed.date !== todayInTimeZone('Asia/Jerusalem')) {
      res.status(400).type('html').send(page('הקישור פג תוקף.'));
      return;
    }
    try {
      const status = await confirmAttendance(db, parsed.memberId, { date: parsed.date });
      res.type('html').send(page(status === 'already' ? 'הנוכחות כבר אושרה ✓' : 'הנוכחות אושרה ✓'));
    } catch (error) {
      const status = error instanceof AppError ? error.status : 500;
      const message = error instanceof AppError ? error.message : 'אירעה שגיאה.';
      res.status(status).type('html').send(page(message));
    }
  }),
);

function page(message: string): string {
  return `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>נוכחות</title></head><body style="font-family:system-ui,Arial;display:flex;min-height:80vh;align-items:center;justify-content:center;text-align:center"><h2>${message}</h2></body></html>`;
}
