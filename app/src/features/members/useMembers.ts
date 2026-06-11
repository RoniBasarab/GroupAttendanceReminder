import type { MemberDto, MemberRole } from '@gar/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listMembers, setMemberRole } from '@/shared/api/members';
import { useSessionStore } from '@/shared/state/useSessionStore';

const MEMBERS_KEY = ['members'] as const;

export function useMembersQuery() {
  const token = useSessionStore((state) => state.session?.deviceToken);
  return useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: () => listMembers(token as string),
    enabled: Boolean(token),
  });
}

export function useSetRole() {
  const token = useSessionStore((state) => state.session?.deviceToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: string; role: MemberRole }) =>
      setMemberRole(token as string, input.memberId, input.role),
    onSuccess: (members: MemberDto[]) => queryClient.setQueryData(MEMBERS_KEY, members),
  });
}
