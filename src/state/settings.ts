import { storage } from 'wxt/utils/storage';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, type Settings } from './schema';

export const settingsItem = storage.defineItem<Settings>('sync:settings', {
  fallback: DEFAULT_SETTINGS,
});

function useStoredSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let mounted = true;
    const pull = () =>
      settingsItem.getValue().then((v) => {
        if (mounted) setSettings(v);
      });
    void pull();
    const unwatch = settingsItem.watch(() => void pull());
    return () => {
      mounted = false;
      void Promise.resolve(unwatch).then((stop) => stop());
    };
  }, []);

  return settings;
}

export { useStoredSettings as useSettings };
