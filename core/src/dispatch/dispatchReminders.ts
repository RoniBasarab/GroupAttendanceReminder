// The shared 19:00 dispatch. Called by the PC worker (primary) and the Vercel
// backup cron; reminder_log dedupes so the two never double-send. Senders are
// injected so the logic can be tested without real push/email.
import { eq, inArray } from 'drizzle-orm';

import type { Database } from '../db/client';
import { groups, members, pushTokens, reminderLog } from '../db/schema';
import type { EmailMessage } from '../notify/email';
import type { PushMessage, PushResult } from '../notify/push';
import { resolveStudyDay, todayInTimeZone } from '../schedule';
import type { FormKind } from '../types';
import { buildReminderEmail, buildReminderPush } from './content';
import { loadSchedule } from './loadSchedule';

const TIMEZONE = 'Asia/Jerusalem';

export type Senders = {
  sendPush: (tokens: string[], message: PushMessage) => Promise<PushResult>;
  sendEmail: (message: EmailMessage) => Promise<void>;
};

export type DispatchDeps = {
  senders: Senders;
  webUrl: string;
  /** Override "now" (for tests). */
  now?: Date;
};

export type GroupDispatch = {
  groupId: string;
  formKind: FormKind | null;
  pushed: number;
  emailed: number;
  status: 'sent' | 'not-study-day' | 'already-sent';
};

export type DispatchSummary = { date: string; groups: GroupDispatch[] };

export async function dispatchReminders(db: Database, deps: DispatchDeps): Promise<DispatchSummary> {
  const date = todayInTimeZone(TIMEZONE, deps.now);
  const allGroups = await db.select().from(groups);
  const summary: DispatchSummary = { date, groups: [] };

  for (const group of allGroups) {
    const schedule = await loadSchedule(db, group.id);
    const formKind = resolveStudyDay(schedule, date);
    if (!formKind) {
      summary.groups.push({ groupId: group.id, formKind: null, pushed: 0, emailed: 0, status: 'not-study-day' });
      continue;
    }

    // Atomically claim today's dispatch (dedupe between primary and backup).
    const claimed = await db
      .insert(reminderLog)
      .values({ groupId: group.id, studyDate: date })
      .onConflictDoNothing()
      .returning();
    if (claimed.length === 0) {
      summary.groups.push({ groupId: group.id, formKind, pushed: 0, emailed: 0, status: 'already-sent' });
      continue;
    }

    const memberRows = await db.select().from(members).where(eq(members.groupId, group.id));
    const memberIds = memberRows.map((m) => m.id);
    const tokenRows =
      memberIds.length > 0
        ? await db.select().from(pushTokens).where(inArray(pushTokens.memberId, memberIds))
        : [];

    const memberHasToken = new Set(tokenRows.map((t) => t.memberId));
    const allTokens = tokenRows.map((t) => t.token);

    // Push to every registered device.
    const pushResult: PushResult =
      allTokens.length > 0
        ? await deps.senders.sendPush(allTokens, buildReminderPush(group.name, formKind, date))
        : { sent: 0, failed: 0, invalidTokens: [] };
    if (pushResult.invalidTokens.length > 0) {
      await db.delete(pushTokens).where(inArray(pushTokens.token, pushResult.invalidTokens));
    }

    // Email the members who have no push token (push-first fallback).
    let emailed = 0;
    for (const member of memberRows) {
      if (memberHasToken.has(member.id)) continue;
      await deps.senders.sendEmail(
        buildReminderEmail(member.email, member.firstName, group.name, formKind, date, deps.webUrl),
      );
      emailed += 1;
    }

    await db
      .update(reminderLog)
      .set({ recipientCount: pushResult.sent + emailed })
      .where(eq(reminderLog.id, claimed[0].id));

    summary.groups.push({ groupId: group.id, formKind, pushed: pushResult.sent, emailed, status: 'sent' });
  }

  return summary;
}
