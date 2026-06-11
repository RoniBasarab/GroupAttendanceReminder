import { useMutation } from '@tanstack/react-query';

import { confirmAttendance } from '@/shared/api/attendance';
import { useSessionStore } from '@/shared/state/useSessionStore';

export function useConfirmAttendance() {
  const token = useSessionStore((state) => state.session?.deviceToken);
  return useMutation({
    mutationFn: () => confirmAttendance(token as string),
  });
}
