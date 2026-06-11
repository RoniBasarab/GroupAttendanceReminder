import type { ScheduleDto, ScheduleExceptionInput, WeeklyStudyDayDto } from '@gar/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addException, getSchedule, removeException, setWeeklySchedule } from '@/shared/api/schedule';
import { useSessionStore } from '@/shared/state/useSessionStore';

const SCHEDULE_KEY = ['schedule'] as const;

export function useScheduleQuery() {
  const token = useSessionStore((state) => state.session?.deviceToken);
  return useQuery({
    queryKey: SCHEDULE_KEY,
    queryFn: () => getSchedule(token as string),
    enabled: Boolean(token),
  });
}

export function useSetWeekly() {
  const token = useSessionStore((state) => state.session?.deviceToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (days: WeeklyStudyDayDto[]) => setWeeklySchedule(token as string, days),
    onSuccess: (schedule: ScheduleDto) => queryClient.setQueryData(SCHEDULE_KEY, schedule),
  });
}

export function useAddException() {
  const token = useSessionStore((state) => state.session?.deviceToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleExceptionInput) => addException(token as string, input),
    onSuccess: (schedule: ScheduleDto) => queryClient.setQueryData(SCHEDULE_KEY, schedule),
  });
}

export function useRemoveException() {
  const token = useSessionStore((state) => state.session?.deviceToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => removeException(token as string, date),
    onSuccess: (schedule: ScheduleDto) => queryClient.setQueryData(SCHEDULE_KEY, schedule),
  });
}
