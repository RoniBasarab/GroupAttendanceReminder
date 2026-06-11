// Schedule model + the "is today a study day, and which form?" resolver.
// Pure and app-safe (no Node/DB). The server maps DB rows to these shapes; the
// worker (Section 8.7) and submission (Section 8.8) call resolveStudyDay().
import { z } from 'zod';

import type { FormKind } from './types';

export type WeeklyStudyDayDto = { weekday: number; kind: FormKind }; // weekday: 0=Sunday..6=Saturday
export type ScheduleExceptionDto = {
  date: string; // YYYY-MM-DD
  exception: 'extra' | 'cancelled';
  kind: FormKind | null; // set for 'extra', null for 'cancelled'
};
export type ScheduleDto = {
  weekly: WeeklyStudyDayDto[];
  exceptions: ScheduleExceptionDto[];
};

/** Day of week (0=Sunday..6=Saturday) for a YYYY-MM-DD calendar date (timezone-independent). */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** The current calendar date (YYYY-MM-DD) in the given IANA time zone, e.g. 'Asia/Jerusalem'. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  // 'en-CA' formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Which form (if any) applies on `date`: an exception overrides the weekly rule. */
export function resolveStudyDay(schedule: ScheduleDto, date: string): FormKind | null {
  const exception = schedule.exceptions.find((e) => e.date === date);
  if (exception) {
    return exception.exception === 'cancelled' ? null : exception.kind;
  }
  const rule = schedule.weekly.find((w) => w.weekday === weekdayOf(date));
  return rule ? rule.kind : null;
}

// --- Request schemas (Zod) ---
export const formKindSchema = z.enum(['morning', 'evening']);

export const weeklyScheduleSchema = z
  .object({
    days: z.array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        kind: formKindSchema,
      }),
    ),
  })
  .refine(({ days }) => new Set(days.map((d) => d.weekday)).size === days.length, {
    message: 'Each weekday can appear only once.',
    path: ['days'],
  });

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Invalid date.');

export const scheduleExceptionSchema = z
  .object({
    date: dateString,
    exception: z.enum(['extra', 'cancelled']),
    kind: formKindSchema.optional(),
  })
  .refine((v) => (v.exception === 'extra' ? Boolean(v.kind) : !v.kind), {
    message: 'Provide a form kind for an extra study day; omit it for a cancelled day.',
    path: ['kind'],
  });

export type WeeklyScheduleInput = z.infer<typeof weeklyScheduleSchema>;
export type ScheduleExceptionInput = z.infer<typeof scheduleExceptionSchema>;
