import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// `generate` works offline (schema -> SQL). `migrate`/`push`/`studio` need a real
// DATABASE_URL (Supabase) — see README.
export default defineConfig({
  schema: './core/src/db/schema.ts',
  out: './core/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
