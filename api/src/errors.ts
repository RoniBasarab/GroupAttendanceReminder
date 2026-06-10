import type { ErrorRequestHandler, RequestHandler } from 'express';

/** An error with an HTTP status; the error handler turns it into a JSON response. */
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Wraps an async handler so rejected promises reach the Express error handler. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error('[api] unhandled error', err);
  res.status(500).json({ error: 'Internal error' });
};
