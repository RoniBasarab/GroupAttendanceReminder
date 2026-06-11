// Member roster + role promotion/demotion (with last-admin guard) against pglite.
import { PGlite } from '@electric-sql/pglite';
import type { Database } from '@gar/core/db';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGroup, joinGroup } from './membership.js';
import { listMembers, setMemberRole } from './members.js';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(here, '../../../core/drizzle');

const adminCount = (list: { role: string }[]) => list.filter((m) => m.role === 'admin').length;

async function main() {
  const client = new PGlite();
  const pg = drizzle({ client });
  await migrate(pg, { migrationsFolder });
  const db = pg as unknown as Database;

  const admin = await createGroup(db, {
    groupName: 'Roster',
    firstName: 'Ann',
    lastName: 'Admin',
    email: 'ann@x.com',
  });
  const code = admin.group.joinCode;
  const m2 = await joinGroup(db, { joinCode: code, firstName: 'Bob', lastName: 'B', email: 'bob@x.com' });
  await joinGroup(db, { joinCode: code, firstName: 'Cara', lastName: 'C', email: 'cara@x.com' });

  let roster = await listMembers(db, admin.group.id);
  assert.equal(roster.length, 3);
  assert.equal(adminCount(roster), 1);

  // promote Bob -> admin
  roster = await setMemberRole(db, admin.group.id, m2.member.id, { role: 'admin' });
  assert.equal(adminCount(roster), 2);

  // demote Ann -> member (ok, Bob is still admin)
  roster = await setMemberRole(db, admin.group.id, admin.member.id, { role: 'member' });
  assert.equal(adminCount(roster), 1);
  assert.equal(roster.find((m) => m.id === admin.member.id)?.role, 'member');

  // demote Bob -> member would leave zero admins -> rejected
  await assert.rejects(
    setMemberRole(db, admin.group.id, m2.member.id, { role: 'member' }),
    /at least one admin/,
  );

  // unknown member -> 404
  await assert.rejects(
    setMemberRole(db, admin.group.id, '00000000-0000-0000-0000-000000000000', { role: 'admin' }),
    /not found/,
  );

  // invalid role -> 400
  await assert.rejects(setMemberRole(db, admin.group.id, m2.member.id, { role: 'owner' }), /.+/);

  console.log('members integration test: ALL PASSED');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
