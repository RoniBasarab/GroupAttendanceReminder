// Shared input validation, used by both the app (UX) and the server (security).
import type { CreateGroupRequest, JoinGroupRequest } from './contracts';

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isFilled(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function personErrors(input: { firstName?: string; lastName?: string; email?: string }): string[] {
  const errors: string[] = [];
  if (!isFilled(input.firstName)) errors.push('First name is required.');
  if (!isFilled(input.lastName)) errors.push('Last name is required.');
  if (!isFilled(input.email)) errors.push('Email is required.');
  else if (!EMAIL_RE.test(input.email.trim())) errors.push('Email is invalid.');
  return errors;
}

export function validateCreateGroup(input: Partial<CreateGroupRequest>): ValidationResult {
  const errors: string[] = [];
  if (!isFilled(input.groupName)) errors.push('Group name is required.');
  else if (input.groupName.trim().length > 80) errors.push('Group name is too long.');
  errors.push(...personErrors(input));
  return errors.length ? { ok: false, errors } : { ok: true };
}

export function validateJoinGroup(input: Partial<JoinGroupRequest>): ValidationResult {
  const errors: string[] = [];
  if (!isFilled(input.joinCode)) errors.push('Join code is required.');
  errors.push(...personErrors(input));
  return errors.length ? { ok: false, errors } : { ok: true };
}
