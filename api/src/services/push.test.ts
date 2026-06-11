// Push-token register/upsert/unregister against in-memory Postgres (pglite).
import { PGlite } from '@electric-sql/pglite';
import type { Database } from '@gar/core/db';
import { pushTokens } from '@gar/core/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGroup } from './membership.js';
import { registerToken, unregisterToken } from './push.js';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(here, '../../../core/drizzle');

async function main() {
  const client = new PGlite();
  const pg = drizzle({ client });
  await migrate(pg, { migrationsFolder });
  const db = pg as unknown as Database;

  const admin = await createGroup(db, {
    groupName: 'Push',
    firstName: 'A',
    lastName: 'B',
    email: 'a@b.com',
  });
  const memberId = admin.member.id;

  await registerToken(db, memberId, { token: 'tok-1', platform: 'web' });
  let rows = await db.select().from(pushTokens).where(eq(pushTokens.memberId, memberId));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].platform, 'web');

  await registerToken(db, memberId, { token: 'tok-1', platform: 'android' });
  rows = await db.select().from(pushTokens).where(eq(pushTokens.memberId, memberId));
  assert.equal(rows.length, 1, 'token upserted, not duplicated');
  assert.equal(rows[0].platform, 'android');

  await registerToken(db, memberId, { token: 'tok-2', platform: 'web' });
  rows = await db.select().from(pushTokens).where(eq(pushTokens.memberId, memberId));
  assert.equal(rows.length, 2);

  await assert.rejects(registerToken(db, memberId, { token: '', platform: 'web' }), /required/);
  await assert.rejects(registerToken(db, memberId, { token: 'x', platform: 'ios' }), /.+/);

  await unregisterToken(db, memberId, 'tok-1');
  rows = await db.select().from(pushTokens).where(eq(pushTokens.memberId, memberId));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].token, 'tok-2');

  console.log('push token integration test: ALL PASSED');
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
