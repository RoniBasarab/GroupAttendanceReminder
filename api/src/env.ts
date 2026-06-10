// Loads the monorepo-root .env for local dev (Vercel injects env itself).
import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // api/src
config({ path: resolve(here, '../../.env') });
