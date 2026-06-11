import type { ScheduleDto, ScheduleExceptionInput, WeeklyStudyDayDto } from '@gar/core';

import { apiFetch } from './client';

export function getSchedule(token: string): Promise<ScheduleDto> {
  return apiFetch<ScheduleDto>('/api/schedule', { token });
}

export function setWeeklySchedule(token: string, days: WeeklyStudyDayDto[]): Promise<ScheduleDto> {
  return apiFetch<ScheduleDto>('/api/schedule/weekly', { method: 'PUT', token, body: { days } });
}

export function addException(token: string, input: ScheduleExceptionInput): Promise<ScheduleDto> {
  return apiFetch<ScheduleDto>('/api/schedule/exceptions', { method: 'POST', token, body: input });
}

export function removeException(token: string, date: string): Promise<ScheduleDto> {
  return apiFetch<ScheduleDto>(`/api/schedule/exceptions/${date}`, { method: 'DELETE', token });
}
