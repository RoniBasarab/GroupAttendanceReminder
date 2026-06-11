// Home-PC scheduler (primary). At 19:00 Asia/Jerusalem it runs the shared dispatch:
// compute today's study-day groups and send push + email. Outbound-only.
import './env.js';

import { db } from '@gar/core/db';
import { dispatchReminders } from '@gar/core/dispatch';
import { sendEmail, sendPush } from '@gar/core/notify';
import cron from 'node-cron';

const TIMEZONE = 'Asia/Jerusalem';
const DAILY_AT_1900 = '0 19 * * *';
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:8081';

async function runDispatch(): Promise<void> {
  const summary = await dispatchReminders(db, { senders: { sendPush, sendEmail }, webUrl: WEB_URL });
  console.log(`[worker] dispatch ${summary.date}:`, JSON.stringify(summary.groups));
}

console.log('[worker] starting scheduler...');
cron.schedule(
  DAILY_AT_1900,
  () => {
    runDispatch().catch((error) => console.error('[worker] dispatch error', error));
  },
  { timezone: TIMEZONE },
);
console.log(`[worker] scheduled daily dispatch at 19:00 ${TIMEZONE}`);

// Manual one-off run for testing: `npm run tick -w @gar/worker` or RUN_ONCE=1.
if (process.argv.includes('--once') || process.env.RUN_ONCE === '1') {
  runDispatch()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
