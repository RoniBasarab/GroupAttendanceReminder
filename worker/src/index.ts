// Home-PC scheduler. Outbound-only: at 21:00 Asia/Jerusalem it will read today's
// study-day members and send push + email (filled in Section 8.7). For now it
// just registers the cron and supports a manual one-off run for testing.
import './env.js';

import cron from 'node-cron';

const TIMEZONE = 'Asia/Jerusalem';
const DAILY_AT_2100 = '0 21 * * *';

function runDispatchTick(): void {
  // Section 8.7: load study-day members from Supabase, send FCM push + email.
  console.log(`[worker] dispatch tick @ ${new Date().toISOString()}`);
}

console.log('[worker] starting scheduler...');
cron.schedule(DAILY_AT_2100, runDispatchTick, { timezone: TIMEZONE });
console.log(`[worker] scheduled daily dispatch at 21:00 ${TIMEZONE}`);

// Manual one-off run for testing: `npm run tick -w @gar/worker` or RUN_ONCE=1.
if (process.argv.includes('--once') || process.env.RUN_ONCE === '1') {
  runDispatchTick();
  process.exit(0);
}
