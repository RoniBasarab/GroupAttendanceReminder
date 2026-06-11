// buildFormBody + confirm-token units, and the idempotent confirm flow (mock submit).
process.env.CONFIRM_SECRET = 'test-confirm-secret';

import { PGlite } from '@electric-sql/pglite';
import { todayInTimeZone, weekdayOf } from '@gar/core';
import { signConfirmToken, verifyConfirmToken } from '@gar/core/auth';
import type { Database } from '@gar/core/db';
import { submissions } from '@gar/core/schema';
import { buildFormBody, type AttendancePerson, type SubmittableForm } from '@gar/core/submit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { confirmAttendance } from './attendance.js';
import { createGroup } from './membership.js';
import { setWeeklySchedule } from './schedule.js';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(here, '../../../core/drizzle');

function testBuildFormBody() {
  const body = buildFormBody(
    {
      formResponseUrl: 'https://x/formResponse',
      firstNameField: 'entry.1',
      lastNameField: 'entry.2',
      lessons: [{ entryId: 'entry.3' }, { entryId: 'entry.4' }],
    },
    { firstName: 'Sarah', lastName: 'Cohen' },
  );
  assert.equal(body.get('entry.1'), 'Sarah');
  assert.equal(body.get('entry.2'), 'Cohen');
  assert.equal(body.get('entry.3'), 'נוכח');
  assert.equal(body.get('entry.4'), 'נוכח');
  assert.equal(body.get('fvv'), '1');
}

function testConfirmToken() {
  const id = '5a5abdd8-61f2-4a9d-9d8f-d9ab5a9dc644';
  const token = signConfirmToken(id, '2026-06-11');
  assert.deepEqual(verifyConfirmToken(token), { memberId: id, date: '2026-06-11' });
  assert.equal(verifyConfirmToken(`${token}tamper`), null);
  assert.equal(verifyConfirmToken('not-a-token'), null);
}

async function main() {
  testBuildFormBody();
  testConfirmToken();

  const client = new PGlite();
  const pg = drizzle({ client });
  await migrate(pg, { migrationsFolder });
  const db = pg as unknown as Database;

  const todayWeekday = weekdayOf(todayInTimeZone('Asia/Jerusalem'));

  const submitCalls: { firstName: string; url: string }[] = [];
  const okSubmit = async (form: SubmittableForm, person: AttendancePerson): Promise<void> => {
    submitCalls.push({ firstName: person.firstName, url: form.formResponseUrl });
  };
  const failSubmit = async (): Promise<void> => {
    throw new Error('boom');
  };

  // Group A: study day -> first confirm submits, second is idempotent.
  const a = await createGroup(db, { groupName: 'A', firstName: 'Sarah', lastName: 'Cohen', email: 's@a.com' });
  await setWeeklySchedule(db, a.group.id, { days: [{ weekday: todayWeekday, kind: 'morning' }] });

  let result = await confirmAttendance(db, a.member.id, { submit: okSubmit });
  assert.equal(result, 'submitted');
  assert.equal(submitCalls.length, 1);
  assert.equal(submitCalls[0].firstName, 'Sarah');
  assert.match(submitCalls[0].url, /formResponse/);

  result = await confirmAttendance(db, a.member.id, { submit: okSubmit });
  assert.equal(result, 'already');
  assert.equal(submitCalls.length, 1, 'no second submit when already confirmed');

  // Group B: submit fails -> 502 + recorded 'failed'; a retry then succeeds.
  const b = await createGroup(db, { groupName: 'B', firstName: 'Dee', lastName: 'D', email: 'd@b.com' });
  await setWeeklySchedule(db, b.group.id, { days: [{ weekday: todayWeekday, kind: 'evening' }] });
  await assert.rejects(confirmAttendance(db, b.member.id, { submit: failSubmit }), /failed/);
  const [failedRow] = await db.select().from(submissions).where(eq(submissions.memberId, b.member.id));
  assert.equal(failedRow.status, 'failed');
  result = await confirmAttendance(db, b.member.id, { submit: okSubmit });
  assert.equal(result, 'submitted');

  // Group C: no schedule -> not a study day.
  const c = await createGroup(db, { groupName: 'C', firstName: 'Eve', lastName: 'E', email: 'e@c.com' });
  await assert.rejects(confirmAttendance(db, c.member.id, { submit: okSubmit }), /not a study day/);

  console.log('attendance integration test: ALL PASSED');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
