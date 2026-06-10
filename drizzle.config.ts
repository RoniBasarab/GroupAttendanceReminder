import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// `generate` works offline (schema -> SQL). `migrate`/`push`/`studio` need a real
// connection — prefer DIRECT_URL (Supabase Session pooler, port 5432) for migrations,
// falling back to DATABASE_URL (the transaction pooler) if it is not set.
export default defineConfig({
  schema: './core/src/db/schema.ts',
  out: './core/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
