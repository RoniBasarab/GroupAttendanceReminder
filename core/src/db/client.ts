// Drizzle client over Supabase Postgres. Node-only — never imported by the app.
// Reached via the "@gar/core/db" subpath so the Expo bundle never pulls in `postgres`.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set (see .env.example).');
}

// `prepare: false` is required for Supabase's transaction-mode pooler, which does
// not support prepared statements. postgres-js connects lazily (on first query).
const client = postgres(databaseUrl, { prepare: false });

export const db = drizzle({ client });
