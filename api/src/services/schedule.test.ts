// Resolver unit checks + schedule CRUD integration against in-memory Postgres (pglite).
import { PGlite } from '@electric-sql/pglite';
import type { ScheduleDto } from '@gar/core';
import { resolveStudyDay, todayInTimeZone, weekdayOf } from '@gar/core';
import type { Database } from '@gar/core/db';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGroup } from './membership.js';
import { deleteException, getSchedule, setWeeklySchedule, upsertException } from './schedule.js';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(here, '../../../core/drizzle');

function testResolver() {
  const day = '2026-06-14';
  const nextDay = '2026-06-15';
  const dayWeekday = weekdayOf(day);

  // weekly rule applies on its weekday
  const weekly: ScheduleDto = { weekly: [{ weekday: dayWeekday, kind: 'morning' }], exceptions: [] };
  assert.equal(resolveStudyDay(weekly, day), 'morning');
  if (weekdayOf(nextDay) !== dayWeekday) {
    assert.equal(resolveStudyDay(weekly, nextDay), null, 'a non-study weekday returns null');
  }

  // a cancelled exception overrides the weekly rule
  const cancelled: ScheduleDto = {
    weekly: weekly.weekly,
    exceptions: [{ date: day, exception: 'cancelled', kind: null }],
  };
  assert.equal(resolveStudyDay(cancelled, day), null);

  // an extra exception adds a study day with its own kind
  const extra: ScheduleDto = {
    weekly: [],
    exceptions: [{ date: nextDay, exception: 'extra', kind: 'evening' }],
  };
  assert.equal(resolveStudyDay(extra, nextDay), 'evening');

  assert.match(todayInTimeZone('Asia/Jerusalem'), /^\d{4}-\d{2}-\d{2}$/);
}

async function main() {
  testResolver();

  const client = new PGlite();
  const pg = drizzle({ client });
  await migrate(pg, { migrationsFolder });
  const db = pg as unknown as Database;

  const admin = await createGroup(db, {
    groupName: 'Sched',
    firstName: 'A',
    lastName: 'B',
    email: 'a@b.com',
  });
  const groupId = admin.group.id;

  let schedule = await getSchedule(db, groupId);
  assert.equal(schedule.weekly.length, 0);
  assert.equal(schedule.exceptions.length, 0);

  schedule = await setWeeklySchedule(db, groupId, {
    days: [
      { weekday: 0, kind: 'morning' },
      { weekday: 2, kind: 'evening' },
      { weekday: 3, kind: 'evening' },
    ],
  });
  assert.equal(schedule.weekly.length, 3);

  schedule = await setWeeklySchedule(db, groupId, { days: [{ weekday: 0, kind: 'morning' }] });
  assert.equal(schedule.weekly.length, 1, 'weekly is replaced, not appended');

  await assert.rejects(
    setWeeklySchedule(db, groupId, {
      days: [
        { weekday: 0, kind: 'morning' },
        { weekday: 0, kind: 'evening' },
      ],
    }),
    /only once/,
  );

  schedule = await upsertException(db, groupId, {
    date: '2026-06-15',
    exception: 'extra',
    kind: 'morning',
  });
  assert.equal(schedule.exceptions.length, 1);
  assert.equal(schedule.exceptions[0].kind, 'morning');

  schedule = await upsertException(db, groupId, { date: '2026-06-15', exception: 'cancelled' });
  assert.equal(schedule.exceptions.length, 1, 'exception is upserted by date, not duplicated');
  assert.equal(schedule.exceptions[0].exception, 'cancelled');
  assert.equal(schedule.exceptions[0].kind, null);

  await assert.rejects(
    upsertException(db, groupId, { date: '2026-07-01', exception: 'extra' }),
    /form kind/,
  );

  schedule = await deleteException(db, groupId, '2026-06-15');
  assert.equal(schedule.exceptions.length, 0);

  console.log('schedule integration test: ALL PASSED');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
