import type { AuthSession, GroupDto, MemberDto, SessionInfo } from '@gar/core';
import { validateCreateGroup, validateJoinGroup } from '@gar/core';
import type { Database } from '@gar/core/db';
import { loadForms } from '@gar/core/forms';
import type { Group, Member } from '@gar/core/schema';
import { formConfigs, groups, members } from '@gar/core/schema';
import { eq } from 'drizzle-orm';

import { generateJoinCode } from '../auth/joinCode.js';
import { generateDeviceToken, hashToken } from '../auth/tokens.js';
import { AppError } from '../errors.js';

const MAX_JOIN_CODE_ATTEMPTS = 5;

function toGroupDto(group: Group): GroupDto {
  return { id: group.id, name: group.name, joinCode: group.joinCode };
}

function toMemberDto(member: Member): MemberDto {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    role: member.role,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

/** Creates a group + admin member and seeds its form configs; returns the device token. */
export async function createGroup(db: Database, input: unknown): Promise<AuthSession> {
  const parsed = validateCreateGroup(input);
  if (!parsed.ok) throw new AppError(400, parsed.errors.join(' '));
  const { groupName, firstName, lastName, email } = parsed.data;

  let forms;
  try {
    forms = Object.values(loadForms());
  } catch (error) {
    throw new AppError(500, error instanceof Error ? error.message : 'Form config unavailable.');
  }

  const deviceToken = generateDeviceToken();
  const deviceTokenHash = hashToken(deviceToken);

  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
    const joinCode = generateJoinCode();
    try {
      const created = await db.transaction(async (tx) => {
        const [group] = await tx.insert(groups).values({ name: groupName, joinCode }).returning();
        const [member] = await tx
          .insert(members)
          .values({ groupId: group.id, firstName, lastName, email, role: 'admin', deviceTokenHash })
          .returning();
        await tx.insert(formConfigs).values(
          forms.map((form) => ({
            groupId: group.id,
            kind: form.kind,
            title: form.title,
            formResponseUrl: form.formResponseUrl,
            firstNameField: form.firstNameField,
            lastNameField: form.lastNameField,
            lessons: form.lessons,
          })),
        );
        return { group, member };
      });
      return { deviceToken, group: toGroupDto(created.group), member: toMemberDto(created.member) };
    } catch (error) {
      if (isUniqueViolation(error) && attempt < MAX_JOIN_CODE_ATTEMPTS - 1) continue;
      throw error;
    }
  }
  throw new AppError(500, 'Could not allocate a unique join code.');
}

/** Joins an existing group by code; re-joining with the same email rotates the device token. */
export async function joinGroup(db: Database, input: unknown): Promise<AuthSession> {
  const parsed = validateJoinGroup(input);
  if (!parsed.ok) throw new AppError(400, parsed.errors.join(' '));
  const { joinCode, firstName, lastName, email } = parsed.data;

  const [group] = await db.select().from(groups).where(eq(groups.joinCode, joinCode)).limit(1);
  if (!group) throw new AppError(404, 'No group found for that join code.');

  const deviceToken = generateDeviceToken();
  const deviceTokenHash = hashToken(deviceToken);

  const [member] = await db
    .insert(members)
    .values({ groupId: group.id, firstName, lastName, email, role: 'member', deviceTokenHash })
    .onConflictDoUpdate({
      target: [members.groupId, members.email],
      set: { firstName, lastName, deviceTokenHash },
    })
    .returning();

  return { deviceToken, group: toGroupDto(group), member: toMemberDto(member) };
}

/** Resolves the current session (member + group) for an already-authenticated member. */
export async function getSessionInfo(db: Database, member: Member): Promise<SessionInfo> {
  const [group] = await db.select().from(groups).where(eq(groups.id, member.groupId)).limit(1);
  if (!group) throw new AppError(404, 'Group not found.');
  return { group: toGroupDto(group), member: toMemberDto(member) };
}
