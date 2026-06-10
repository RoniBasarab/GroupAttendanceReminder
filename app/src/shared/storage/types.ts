// Minimal synchronous key/value store. Backed by MMKV on native and
// localStorage on web (Metro picks the platform file automatically).
export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}
