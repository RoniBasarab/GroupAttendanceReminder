import { apiFetch } from './client';

export type ConfirmResponse = { status: 'submitted' | 'already' };

/** Confirms today's attendance for the signed-in member (server submits the form). */
export function confirmAttendance(deviceToken: string): Promise<ConfirmResponse> {
  return apiFetch<ConfirmResponse>('/api/attendance/confirm', {
    method: 'POST',
    token: deviceToken,
  });
}
