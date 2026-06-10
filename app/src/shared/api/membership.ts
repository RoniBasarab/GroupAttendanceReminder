import type { AuthSession, CreateGroupRequest, JoinGroupRequest, SessionInfo } from '@gar/core';

import { apiFetch } from './client';

export function createGroup(input: CreateGroupRequest): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/groups', { method: 'POST', body: input });
}

export function joinGroup(input: JoinGroupRequest): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/groups/join', { method: 'POST', body: input });
}

export function fetchSession(token: string): Promise<SessionInfo> {
  return apiFetch<SessionInfo>('/api/me', { token });
}
