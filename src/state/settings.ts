import { useState } from 'react';
import { storage } from 'wxt/utils/storage';
import {
  DEFAULT_SETTINGS,
  migrateSettings,
  type Settings,
} from './schema';
import { useStorageValue } from './useStorageValue';

export const settingsItem = storage.defineItem<Settings>('sync:settings', {
  fallback: DEFAULT_SETTINGS,
});

type SettingsItem = typeof settingsItem;

/** Structural slice of the storage seam so fakes track the real contract. */
export interface SettingsSeam {
  getValue(): Promise<unknown>;
  setValue(value: unknown): Promise<void>;
}

/** Stored bytes pass through the schema before React ever sees them. */
export const useSettings = (item: SettingsItem = settingsItem): Settings =>
  migrateSettings(useStorageValue(item));

/**
 * Read-modify-write against schemaed bytes: a legacy stored blob is
 * migrated BEFORE the update callback sees it, so toggles can never
 * crash on an old saved shape and the legacy flag never reuses memory.
 */
export async function updateSettings(
  item: SettingsSeam,
  update: (prev: Settings) => Settings,
): Promise<void> {
  const prev = migrateSettings(await item.getValue());
  await item.setValue(update(prev));
}

/** Power toggle: the one settings write the deck performs. */
export function setSoundPower(item: SettingsSeam, enabled: boolean): Promise<void> {
  return updateSettings(item, (prev) => ({
    ...prev,
    sound: { ...prev.sound, enabled },
  }));
}

/** Volume slider write, clamped upstream by the schema on the next read. */
export function setSoundVolume(item: SettingsSeam, volume: number): Promise<void> {
  return updateSettings(item, (prev) => ({
    ...prev,
    sound: { ...prev.sound, volume },
  }));
}
