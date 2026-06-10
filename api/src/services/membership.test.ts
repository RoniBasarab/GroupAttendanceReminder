// Integration test against a real in-memory Postgres (pglite) — no Supabase needed.
// Applies the generated migration, then exercises create/join/getSession.
import { PGlite } from '@electric-sql/pglite';
import type { Database } from '@gar/core/db';
import { formConfigs, members } from '@gar/core/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGroup, getSessionInfo, joinGroup } from './membership.js';
import { hashToken } from '../auth/tokens.js';

const here = dirname(fileURLToPath(import.meta.url)); // api/src/services
const migrationsFolder = resolve(here, '../../../core/drizzle');

async function main() {
  const client = new PGlite();
  const pg = drizzle({ client });
  await migrate(pg, { migrationsFolder });
  const db = pg as unknown as Database;

  // create group -> admin member + join code + device token
  const admin = await createGroup(db, {
    groupName: 'Nursing הסבה 10',
    firstName: 'Sarah',
    lastName: 'Cohen',
    email: 'Sarah@example.com',
  });
  assert.equal(admin.member.role, 'admin');
  assert.equal(admin.group.joinCode.length, 6);
  assert.ok(admin.deviceToken.length > 0);
  assert.equal(admin.member.email, 'sarah@example.com', 'email is normalized to lowercase');

  // form configs are auto-seeded for the new group (morning + evening)
  const seeded = await db.select().from(formConfigs).where(eq(formConfigs.groupId, admin.group.id));
  assert.equal(seeded.length, 2, 'two form configs seeded on group creation');
  assert.deepEqual(
    seeded.map((row) => row.kind).sort(),
    ['evening', 'morning'],
    'both morning and evening configs seeded',
  );

  // join with the code -> member
  const joiner = await joinGroup(db, {
    joinCode: admin.group.joinCode.toLowerCase(), // accepts case-insensitively
    firstName: 'Dana',
    lastName: 'Levi',
    email: 'dana@example.com',
  });
  assert.equal(joiner.member.role, 'member');
  assert.equal(joiner.group.id, admin.group.id);

  // re-join with same email -> updates, does not duplicate
  const rejoin = await joinGroup(db, {
    joinCode: admin.group.joinCode,
    firstName: 'Dana',
    lastName: 'Levy',
    email: 'dana@example.com',
  });
  assert.equal(rejoin.member.id, joiner.member.id, 'same member id on re-join');
  assert.equal(rejoin.member.lastName, 'Levy', 'name updated on re-join');
  const rows = await db.select().from(members).where(eq(members.email, 'dana@example.com'));
  assert.equal(rows.length, 1, 'no duplicate member rows');

  // bad join code -> 404
  await assert.rejects(
    joinGroup(db, { joinCode: 'ZZZZZZ', firstName: 'X', lastName: 'Y', email: 'x@y.com' }),
    /No group found/,
  );

  // validation -> 400-style error
  await assert.rejects(
    createGroup(db, { groupName: '', firstName: '', lastName: '', email: 'bad' }),
    /required/,
  );

  // getSessionInfo for the authenticated admin
  const [adminRow] = await db
    .select()
    .from(members)
    .where(eq(members.deviceTokenHash, hashToken(admin.deviceToken)))
    .limit(1);
  const info = await getSessionInfo(db, adminRow);
  assert.equal(info.group.id, admin.group.id);
  assert.equal(info.member.role, 'admin');

  console.log('membership integration test: ALL PASSED');
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
