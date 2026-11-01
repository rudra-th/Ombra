import { describe, expect, it, vi } from 'vitest';
import type { WxtStorageItem } from 'wxt/utils/storage';
import { updateItem } from './useStorageValue';

type TestItem<V> = WxtStorageItem<V, Record<string, unknown>>;

/**
 * A stand-in storage item that models the real store's write latency:
 * every write lands a microtask after it is called, which is exactly how
 * two same-batch read-modify-writes race in the wild.
 */
const racyItem = <V,>(initial: V) => {
  let stored: V = initial;
  const item = {
    fallback: stored,
    getValue: async () => stored,
    setValue: async (v: V) => {
      await Promise.resolve();
      stored = v;
    },
  };
  return {
    item: item as unknown as TestItem<V>,
    read: (): V => stored,
  };
};

describe('updateItem — the shared write seam', () => {
  it('threads concurrent writes through one queue, none is lost', async () => {
    const { item, read } = racyItem<{ count: number }>({ count: 0 });
    const bumps = [...Array(3)].map(() =>
      updateItem(item, (prev) => ({ count: prev.count + 1 })),
    );
    await Promise.all(bumps);
    expect(read()).toEqual({ count: 3 });
  });

  it('runs a later write even when a queued one failed to read', async () => {
    const { item, read } = racyItem<{ n: number }>({ n: 1 });
    const broken = { ...item } as unknown as TestItem<{ n: number }>;
    broken.getValue = async () => {
      throw new Error('read failed');
    };
    const first = updateItem(broken, (prev) => ({ n: prev.n + 1 }));
    const second = updateItem(item, (prev) => ({ n: prev.n + 1 }));
    await Promise.allSettled([first, second]);
    expect(read().n).toBe(2);
  });
});
