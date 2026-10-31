/**
 * Node-env tests never run inside a page: wxt/storage's defineItem schedules
 * a background read when declared (migrations/init), so the storage seam must
 * exist at import time or each item throws an unhandled rejection. A tiny
 * empty area keeps that housekeeping silent; tests use fakes or seam stubs —
 * they never read real storage.
 */
type Area = {
  get: (keys: unknown) => Promise<unknown>;
  set: (values: unknown) => Promise<void>;
  remove: (keys: unknown) => Promise<void>;
  clear: () => Promise<void>;
};

const emptyArea = (): Area => ({
  get: async (keys: unknown) =>
    typeof keys === 'string' ? { [keys]: undefined } : {},
  set: async () => undefined,
  remove: async () => undefined,
  clear: async () => undefined,
});

const g = globalThis as unknown as { chrome?: Record<string, unknown> };
g.chrome ??= {};
g.chrome.runtime ??= { id: 'vitest' };
g.chrome.storage ??= {
  sync: emptyArea(),
  local: emptyArea(),
  session: emptyArea(),
  managed: emptyArea(),
};
