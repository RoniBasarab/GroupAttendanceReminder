import type { ScheduleDto } from '@gar/core';
import { scheduleExceptionSchema, validate, weeklyScheduleSchema } from '@gar/core';
import type { Database } from '@gar/core/db';
import { scheduleExceptions, weeklyStudyDays } from '@gar/core/schema';
import { and, eq } from 'drizzle-orm';

import { AppError } from '../errors.js';

export async function getSchedule(db: Database, groupId: string): Promise<ScheduleDto> {
  const weekly = await db
    .select()
    .from(weeklyStudyDays)
    .where(eq(weeklyStudyDays.groupId, groupId));
  const exceptions = await db
    .select()
    .from(scheduleExceptions)
    .where(eq(scheduleExceptions.groupId, groupId));

  return {
    weekly: weekly.map((w) => ({ weekday: w.weekday, kind: w.kind })),
    exceptions: exceptions.map((e) => ({ date: e.date, exception: e.exception, kind: e.kind })),
  };
}

/** Replaces the whole weekly recurrence for a group. */
export async function setWeeklySchedule(
  db: Database,
  groupId: string,
  input: unknown,
): Promise<ScheduleDto> {
  const parsed = validate(weeklyScheduleSchema, input);
  if (!parsed.ok) throw new AppError(400, parsed.errors.join(' '));

  await db.transaction(async (tx) => {
    await tx.delete(weeklyStudyDays).where(eq(weeklyStudyDays.groupId, groupId));
    if (parsed.data.days.length > 0) {
      await tx
        .insert(weeklyStudyDays)
        .values(parsed.data.days.map((d) => ({ groupId, weekday: d.weekday, kind: d.kind })));
    }
  });
  return getSchedule(db, groupId);
}

/** Adds or updates a one-off exception (by date). */
export async function upsertException(
  db: Database,
  groupId: string,
  input: unknown,
): Promise<ScheduleDto> {
  const parsed = validate(scheduleExceptionSchema, input);
  if (!parsed.ok) throw new AppError(400, parsed.errors.join(' '));
  const { date, exception, kind } = parsed.data;

  await db
    .insert(scheduleExceptions)
    .values({ groupId, date, exception, kind: kind ?? null })
    .onConflictDoUpdate({
      target: [scheduleExceptions.groupId, scheduleExceptions.date],
      set: { exception, kind: kind ?? null },
    });
  return getSchedule(db, groupId);
}

export async function deleteException(
  db: Database,
  groupId: string,
  date: string,
): Promise<ScheduleDto> {
  await db
    .delete(scheduleExceptions)
    .where(and(eq(scheduleExceptions.groupId, groupId), eq(scheduleExceptions.date, date)));
  return getSchedule(db, groupId);
}
