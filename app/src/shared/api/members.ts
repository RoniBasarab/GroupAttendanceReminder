import type { MemberDto, MemberRole } from '@gar/core';

import { apiFetch } from './client';

export function listMembers(token: string): Promise<MemberDto[]> {
  return apiFetch<MemberDto[]>('/api/members', { token });
}

export function setMemberRole(
  token: string,
  memberId: string,
  role: MemberRole,
): Promise<MemberDto[]> {
  return apiFetch<MemberDto[]>(`/api/members/${memberId}/role`, {
    method: 'PUT',
    token,
    body: { role },
  });
}
