// Express REST API. On Vercel this whole app becomes a single Function via the
// default export; locally it self-hosts with app.listen (guarded by !VERCEL).
import './env.js';

import express from 'express';

import { errorHandler } from './errors.js';
import { groupsRouter, meRouter } from './routes/groups.js';
import { healthRouter } from './routes/health.js';
import { internalRouter } from './routes/internal.js';
import { membersRouter } from './routes/members.js';
import { pushRouter } from './routes/push.js';
import { scheduleRouter } from './routes/schedule.js';

export const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'gar-api', docs: '/api/health' });
});
app.use('/api/health', healthRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/me', meRouter);
app.use('/api/members', membersRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/push', pushRouter);
app.use('/api/internal', internalRouter);

app.use(errorHandler);

export default app;

// Local development only — Vercel sets VERCEL=1 and manages the listener itself.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`);
  });
}
