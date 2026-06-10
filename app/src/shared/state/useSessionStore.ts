import { create } from 'zustand';

// Client/UI state for the current device's session. Persistence to MMKV is
// added in Section 8.4 (identity & membership); for now it is in-memory.
type SessionState = {
  groupCode: string | null;
  setGroupCode: (groupCode: string | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  groupCode: null,
  setGroupCode: (groupCode) => set({ groupCode }),
}));
