import { Router } from 'express';

export const healthRouter = Router();

// Liveness check — intentionally does not touch the database so the API can report
// healthy even before/without a DB connection.
healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, service: 'gar-api', time: new Date().toISOString() });
});
