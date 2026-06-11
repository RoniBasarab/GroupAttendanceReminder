import { db } from '@gar/core/db';
import { Router } from 'express';

import { ensureAdmin, requireMember } from '../auth/middleware.js';
import { asyncHandler } from '../errors.js';
import { listMembers, setMemberRole } from '../services/members.js';

export const membersRouter = Router();

membersRouter.get(
  '/',
  requireMember(db),
  ensureAdmin,
  asyncHandler(async (req, res) => {
    res.json(await listMembers(db, req.member!.groupId));
  }),
);

membersRouter.put(
  '/:memberId/role',
  requireMember(db),
  ensureAdmin,
  asyncHandler(async (req, res) => {
    const memberId = String(req.params.memberId);
    res.json(await setMemberRole(db, req.member!.groupId, memberId, req.body));
  }),
);
