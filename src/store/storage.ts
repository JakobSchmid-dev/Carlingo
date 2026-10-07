/**
 * Storage adapters. The app only talks to this narrow, async interface, so a server backend can
 * replace local storage later without touching the rest of the app.
 */

export interface StorageAdapter {
  /** The saved text, or null if nothing was saved yet. */
  load(): Promise<string | null>;
  save(data: string): Promise<void>;
  clear(): Promise<void>;
}

export const STORAGE_KEY = 'carlingo';

/** Browser localStorage. */
export function localStorageAdapter(key = STORAGE_KEY): StorageAdapter {
  return {
    load: () => Promise.resolve(window.localStorage.getItem(key)),
    save: (data) => {
      window.localStorage.setItem(key, data);
      return Promise.resolve();
    },
    clear: () => {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}

/** In-memory storage for tests. */
export function memoryAdapter(
  initial: string | null = null,
): StorageAdapter & { data: string | null } {
  const adapter = {
    data: initial,
    load: () => Promise.resolve(adapter.data),
    save: (data: string) => {
      adapter.data = data;
      return Promise.resolve();
    },
    clear: () => {
      adapter.data = null;
      return Promise.resolve();
    },
  };
  return adapter;
}

/** Asks the browser not to evict our data under storage pressure (best effort). */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // Not supported or denied: local storage still works, just without the guarantee.
  }
}
