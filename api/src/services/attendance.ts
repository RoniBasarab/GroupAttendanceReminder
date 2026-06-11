import { resolveStudyDay, todayInTimeZone } from '@gar/core';
import type { Database } from '@gar/core/db';
import { loadSchedule } from '@gar/core/dispatch';
import { formConfigs, members, submissions } from '@gar/core/schema';
import { submitGoogleForm, type AttendancePerson, type SubmittableForm } from '@gar/core/submit';
import { and, eq } from 'drizzle-orm';

import { AppError } from '../errors.js';

export type ConfirmResult = 'submitted' | 'already';

export type ConfirmDeps = {
  date?: string;
  submit?: (form: SubmittableForm, person: AttendancePerson) => Promise<void>;
};

/** Confirms a member's attendance for a study day: submits the group's form, idempotently. */
export async function confirmAttendance(
  db: Database,
  memberId: string,
  deps: ConfirmDeps = {},
): Promise<ConfirmResult> {
  const date = deps.date ?? todayInTimeZone('Asia/Jerusalem');
  const submit = deps.submit ?? submitGoogleForm;

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  if (!member) throw new AppError(404, 'Member not found.');

  const schedule = await loadSchedule(db, member.groupId);
  const formKind = resolveStudyDay(schedule, date);
  if (!formKind) throw new AppError(400, 'Today is not a study day.');

  const [form] = await db
    .select()
    .from(formConfigs)
    .where(and(eq(formConfigs.groupId, member.groupId), eq(formConfigs.kind, formKind)))
    .limit(1);
  if (!form) throw new AppError(500, 'No form is configured for this group.');

  // Idempotent: a prior successful submission today means we do not POST again.
  const [existing] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.memberId, memberId), eq(submissions.studyDate, date)))
    .limit(1);
  if (existing && existing.status === 'submitted') return 'already';

  let status: 'submitted' | 'failed' = 'submitted';
  try {
    await submit(form, { firstName: member.firstName, lastName: member.lastName });
  } catch {
    status = 'failed';
  }

  await db
    .insert(submissions)
    .values({ memberId, studyDate: date, kind: formKind, status })
    .onConflictDoUpdate({
      target: [submissions.memberId, submissions.studyDate],
      set: { status, kind: formKind, submittedAt: new Date() },
    });

  if (status === 'failed') {
    throw new AppError(502, 'Submitting to the attendance form failed. Please try again.');
  }
  return 'submitted';
}
