// Thin wrapper over Zod's safeParse. Used by both the app (UX) and the server
// (security). On success it returns the parsed + normalized data.
import { z } from 'zod';

import { createGroupSchema, joinGroupSchema } from './contracts';

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: string[] };

export function validate<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): ValidationResult<z.infer<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, errors: result.error.issues.map((issue) => issue.message) };
}

export function validateCreateGroup(input: unknown) {
  return validate(createGroupSchema, input);
}

export function validateJoinGroup(input: unknown) {
  return validate(joinGroupSchema, input);
}
