import type { Member } from '@gar/core/schema';

// Attach the authenticated member to the request (set by requireMember).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      member?: Member;
    }
  }
}

export {};
