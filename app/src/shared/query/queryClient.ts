import { QueryClient } from '@tanstack/react-query';

// Single client for all server state (schedule, membership). Tuned conservatively:
// our data changes rarely, so a 1-minute staleTime avoids needless refetches.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});
