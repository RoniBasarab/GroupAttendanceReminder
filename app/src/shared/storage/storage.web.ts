// Web implementation: MMKV has no web backend, so we use localStorage.
import type { KeyValueStore } from './types';

export const storage: KeyValueStore = {
  getString: (key) => localStorage.getItem(key) ?? undefined,
  set: (key, value) => localStorage.setItem(key, value),
  delete: (key) => localStorage.removeItem(key),
};
