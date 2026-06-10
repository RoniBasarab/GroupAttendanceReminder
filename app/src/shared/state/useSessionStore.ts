import type { GroupDto, MemberDto } from '@gar/core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '@/shared/storage';

/** The signed-in session, persisted to MMKV (native) / localStorage (web). */
export type Session = {
  deviceToken: string;
  member: MemberDto;
  group: GroupDto;
};

type SessionState = {
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
};

// Adapter from our sync KeyValueStore to zustand's persist storage shape.
const persistStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'gar-session',
      storage: createJSONStorage(() => persistStorage),
    },
  ),
);
