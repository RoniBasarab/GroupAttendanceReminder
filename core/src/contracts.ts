// API contracts. Request shapes are Zod schemas — a single source of truth for
// structure, validation, AND normalization (trim / lowercase / uppercase). Types
// are inferred from the schemas so they can never drift from the validation.
import { z } from 'zod';

const firstName = z.string().trim().min(1, 'First name is required.').max(80);
const lastName = z.string().trim().min(1, 'Last name is required.').max(80);
const email = z.string().trim().toLowerCase().email('Email is invalid.');

export const createGroupSchema = z.object({
  groupName: z.string().trim().min(1, 'Group name is required.').max(80),
  firstName,
  lastName,
  email,
});

export const joinGroupSchema = z.object({
  joinCode: z.string().trim().min(1, 'Join code is required.').toUpperCase(),
  firstName,
  lastName,
  email,
});

export type CreateGroupRequest = z.infer<typeof createGroupSchema>;
export type JoinGroupRequest = z.infer<typeof joinGroupSchema>;

// Response DTOs (constructed by the server, not parsed from untrusted input).
export type MemberRole = 'admin' | 'member';
export type GroupDto = { id: string; name: string; joinCode: string };
export type MemberDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: MemberRole;
};
export type AuthSession = { deviceToken: string; member: MemberDto; group: GroupDto };
export type SessionInfo = { member: MemberDto; group: GroupDto };

export const pushPlatformSchema = z.enum(['android', 'web']);
export const registerTokenSchema = z.object({
  token: z.string().trim().min(1, 'Push token is required.'),
  platform: pushPlatformSchema,
});
export type RegisterTokenRequest = z.infer<typeof registerTokenSchema>;
