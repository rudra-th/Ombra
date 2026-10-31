import { useState } from 'react';
import { storage } from 'wxt/utils/storage';
import { DEFAULT_SETTINGS, migrateSettings, type Settings } from './schema';
import { useStorageValue } from './useStorageValue';

export const settingsItem = storage.defineItem<Settings>('sync:settings', {
  fallback: DEFAULT_SETTINGS,
});

/** Stored bytes pass through the schema before React ever sees them. */
export const useSettings = (): Settings =>
  migrateSettings(useStorageValue(settingsItem));
