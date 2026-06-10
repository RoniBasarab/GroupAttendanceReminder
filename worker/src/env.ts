// Loads the monorepo-root .env regardless of the process working directory, so
// `npm run start -w @gar/worker` (cwd = worker/) still finds the shared secrets.
import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // worker/src
const repoRootEnv = resolve(here, '../../.env');

config({ path: repoRootEnv });
