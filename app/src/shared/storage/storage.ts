// Native implementation (Android + the default for type-checking).
// MMKV is C++/JSI backed and fully synchronous. The web build overrides this
// file with storage.web.ts.
import { createMMKV } from 'react-native-mmkv';

import type { KeyValueStore } from './types';

const mmkv = createMMKV();

export const storage: KeyValueStore = {
  getString: (key) => mmkv.getString(key),
  set: (key, value) => mmkv.set(key, value),
  delete: (key) => {
    mmkv.remove(key);
  },
};
