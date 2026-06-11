// dispatchReminders against pglite with mock senders: routing (push-first), dedupe,
// invalid-token pruning, and the not-a-study-day path.
import { PGlite } from '@electric-sql/pglite';
import { todayInTimeZone, weekdayOf } from '@gar/core';
import type { Database } from '@gar/core/db';
import { dispatchReminders, type DispatchSummary, type GroupDispatch, type Senders } from '@gar/core/dispatch';
import { pushTokens, reminderLog } from '@gar/core/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGroup, joinGroup } from './membership.js';
import { registerToken } from './push.js';
import { setWeeklySchedule } from './schedule.js';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(here, '../../../core/drizzle');

process.env.CONFIRM_SECRET = 'test-confirm-secret'; // for the email link's signed token

const pushCalls: { tokens: string[] }[] = [];
const emailCalls: { to: string }[] = [];
const badTokens = new Set<string>();

const senders: Senders = {
  sendPush: async (tokens) => {
    pushCalls.push({ tokens });
    const invalidTokens = tokens.filter((t) => badTokens.has(t));
    return { sent: tokens.length - invalidTokens.length, failed: invalidTokens.length, invalidTokens };
  },
  sendEmail: async (message) => {
    emailCalls.push({ to: message.to });
  },
};
const deps = { senders, webUrl: 'http://localhost' };

function find(summary: DispatchSummary, id: string): GroupDispatch {
  const group = summary.groups.find((g) => g.groupId === id);
  if (!group) throw new Error(`group ${id} not in summary`);
  return group;
}

async function main() {
  const client = new PGlite();
  const pg = drizzle({ client });
  await migrate(pg, { migrationsFolder });
  const db = pg as unknown as Database;

  const todayWeekday = weekdayOf(todayInTimeZone('Asia/Jerusalem'));

  // Group A: today is a study day; admin + 2 members; one member has a push token.
  const a = await createGroup(db, { groupName: 'A', firstName: 'Ann', lastName: 'A', email: 'ann@a.com' });
  await setWeeklySchedule(db, a.group.id, { days: [{ weekday: todayWeekday, kind: 'morning' }] });
  const a2 = await joinGroup(db, { joinCode: a.group.joinCode, firstName: 'Bob', lastName: 'B', email: 'bob@a.com' });
  await joinGroup(db, { joinCode: a.group.joinCode, firstName: 'Cy', lastName: 'C', email: 'cy@a.com' });
  await registerToken(db, a2.member.id, { token: 'tokA', platform: 'web' });

  // Run 1: group A sends — push to the 1 token, email to the 2 token-less members.
  let summary = await dispatchReminders(db, deps);
  const ga = find(summary, a.group.id);
  assert.equal(ga.status, 'sent');
  assert.equal(ga.formKind, 'morning');
  assert.equal(ga.pushed, 1);
  assert.equal(ga.emailed, 2);
  assert.equal(pushCalls.length, 1);
  assert.deepEqual(pushCalls[0].tokens, ['tokA']);
  assert.equal(emailCalls.length, 2);

  // Run 2: deduped — nothing new sent.
  summary = await dispatchReminders(db, deps);
  assert.equal(find(summary, a.group.id).status, 'already-sent');
  assert.equal(pushCalls.length, 1, 'no extra push on dedupe');
  assert.equal(emailCalls.length, 2, 'no extra email on dedupe');

  // Group B: today study day; admin holds a token that FCM will reject -> pruned.
  const b = await createGroup(db, { groupName: 'B', firstName: 'Dee', lastName: 'D', email: 'dee@b.com' });
  await setWeeklySchedule(db, b.group.id, { days: [{ weekday: todayWeekday, kind: 'evening' }] });
  await registerToken(db, b.member.id, { token: 'tokB', platform: 'android' });
  badTokens.add('tokB');

  summary = await dispatchReminders(db, deps);
  assert.equal(find(summary, a.group.id).status, 'already-sent');
  assert.equal(find(summary, b.group.id).status, 'sent');
  const tokBRows = await db.select().from(pushTokens).where(eq(pushTokens.token, 'tokB'));
  assert.equal(tokBRows.length, 0, 'invalid token pruned');

  // Group C: no schedule -> not a study day.
  const c = await createGroup(db, { groupName: 'C', firstName: 'Eve', lastName: 'E', email: 'eve@c.com' });
  summary = await dispatchReminders(db, deps);
  assert.equal(find(summary, c.group.id).status, 'not-study-day');

  // reminder_log has exactly the two dispatched groups (A, B), not C.
  const logs = await db.select().from(reminderLog);
  assert.equal(logs.length, 2);

  console.log('dispatch integration test: ALL PASSED');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
