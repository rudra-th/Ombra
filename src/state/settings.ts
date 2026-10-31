import { storage } from 'wxt/utils/storage';
import { DEFAULT_SETTINGS, type Settings } from './schema';
import { useStorageValue } from './useStorageValue';

export const settingsItem = storage.defineItem<Settings>('sync:settings', {
  fallback: DEFAULT_SETTINGS,
});

export const useSettings = (): Settings => useStorageValue(settingsItem);
