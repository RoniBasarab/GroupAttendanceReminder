import { eq } from 'drizzle-orm';

import type { Database } from '../db/client';
import { scheduleExceptions, weeklyStudyDays } from '../db/schema';
import type { ScheduleDto } from '../schedule';

/** Loads a group's schedule (weekly recurrence + exceptions) as the resolver shape. */
export async function loadSchedule(db: Database, groupId: string): Promise<ScheduleDto> {
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
