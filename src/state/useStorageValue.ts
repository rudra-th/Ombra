import { useEffect, useState } from 'react';
import type { WxtStorageItem } from 'wxt/utils/storage';

type AnyItem<T> = WxtStorageItem<T, Record<string, unknown>>;

/**
 * The one way storage reaches React: initial pull, then watch, stopped cleanly.
 * Unwatch may be synchronous or async — both are handled.
 */
export function useStorageValue<T>(item: AnyItem<T>): T {
  const [value, setValue] = useState<T>(item.fallback);

  useEffect(() => {
    let mounted = true;
    const pull = () =>
      item.getValue().then((v) => {
        if (mounted) setValue(v);
      });
    void pull();
    const unwatch = item.watch(() => void pull());
    return () => {
      mounted = false;
      void Promise.resolve(unwatch).then((stop) => stop());
    };
  }, [item]);

  return value;
}
