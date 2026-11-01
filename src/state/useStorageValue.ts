import { useEffect, useState } from 'react';
import type { WxtStorageItem } from 'wxt/utils/storage';

type AnyItem<T> = WxtStorageItem<T, Record<string, unknown>>;

type UnwatchFn = () => void;

/**
 * The one way storage reaches React: initial pull, then watch, stopped cleanly.
 * A sequence guard keeps older pulls from overwriting newer values — each read
 * race is lost by the newest reader, never the oldest.
 */
export function useStorageValue<T>(item: AnyItem<T>): T {
  const [value, setValue] = useState<T>(item.fallback);

  useEffect(() => {
    let mounted = true;
    let seq = 0;
    const pull = () => {
      const ticket = ++seq;
      item.getValue().then((v) => {
        if (mounted && ticket === seq) setValue(v);
      });
    };
    void pull();
    const unwatch: UnwatchFn = item.watch(() => void pull());
    return () => {
      mounted = false;
      void Promise.resolve(unwatch).then((stop) => stop());
    };
  }, [item]);

  return value;
}

/**
 * Read-modify-write in one seam, so no widget mutates a render-time snapshot.
 * Two windows open at once are ordinary; this keeps their writes from eating
 * each other's work (the classic lost-update race). A write joins this item's
 * tail only after the previous write has fully landed — React batches sibling
 * controls into one commit, and two toggles reading the same snapshot would
 * otherwise silently undo each other's fields.
 */
const writeTails = new WeakMap<object, Promise<void>>();

export function enqueueWrite<T extends object>(
  item: T,
  write: () => Promise<void>,
): Promise<void> {
  // a failed tail never deadheads the chain: the next write still reads
  const run = (writeTails.get(item) ?? Promise.resolve())
    .catch(() => undefined)
    .then(write);
  writeTails.set(item, run.catch(() => undefined));
  return run;
}

export async function updateItem<T>(
  item: AnyItem<T>,
  update: (prev: T) => T,
): Promise<void> {
  await enqueueWrite(item, async () => {
    const prev = await item.getValue();
    await item.setValue(update(prev));
  });
}
