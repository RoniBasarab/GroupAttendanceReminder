import type { MemberDto } from '@gar/core';
import { setRoleSchema, validate } from '@gar/core';
import type { Database } from '@gar/core/db';
import type { Member } from '@gar/core/schema';
import { members } from '@gar/core/schema';
import { and, eq } from 'drizzle-orm';

import { AppError } from '../errors.js';

function toMemberDto(member: Member): MemberDto {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    role: member.role,
  };
}

export async function listMembers(db: Database, groupId: string): Promise<MemberDto[]> {
  const rows = await db
    .select()
    .from(members)
    .where(eq(members.groupId, groupId))
    .orderBy(members.firstName, members.lastName);
  return rows.map(toMemberDto);
}

/** Promotes/demotes a member. A group must always keep at least one admin. */
export async function setMemberRole(
  db: Database,
  groupId: string,
  memberId: string,
  input: unknown,
): Promise<MemberDto[]> {
  const parsed = validate(setRoleSchema, input);
  if (!parsed.ok) throw new AppError(400, parsed.errors.join(' '));
  const { role } = parsed.data;

  const [target] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.groupId, groupId)))
    .limit(1);
  if (!target) throw new AppError(404, 'Member not found in this group.');

  if (target.role !== role) {
    if (role === 'member' && target.role === 'admin') {
      const admins = await db
        .select()
        .from(members)
        .where(and(eq(members.groupId, groupId), eq(members.role, 'admin')));
      if (admins.length <= 1) throw new AppError(400, 'A group must keep at least one admin.');
    }
    await db.update(members).set({ role }).where(eq(members.id, memberId));
  }

  return listMembers(db, groupId);
}
