import { useState } from 'react';
import { storage } from 'wxt/utils/storage';
import {
  DEFAULT_SETTINGS,
  migrateSettings,
  type Settings,
} from './schema';
import { useStorageValue, enqueueWrite } from './useStorageValue';

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
 * Writes join the item's tail, so two toggles in one commit never
 * merge from the same snapshot.
 */
export function updateSettings(
  item: SettingsSeam,
  update: (prev: Settings) => Settings,
): Promise<void> {
  return enqueueWrite(item, async () => {
    const prev = migrateSettings(await item.getValue());
    await item.setValue(update(prev));
  });
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

/** Name write — the greeting's only source; trimmed like the schema does. */
export function setSettingsName(item: SettingsSeam, name: string): Promise<void> {
  return updateSettings(item, (prev) => ({ ...prev, name: name.trim() }));
}

/** Accent write — the drawer's swatch chips; choices are type-policed. */
export function setSettingsAccent(
  item: SettingsSeam,
  accent: 'ember' | 'sage' | 'fog',
): Promise<void> {
  return updateSettings(item, (prev) => ({ ...prev, accent }));
}

/** The tab-rhythm strip's visibility; the shipped default is hidden. */
export function setStatsVisible(item: SettingsSeam, visible: boolean): Promise<void> {
  return updateSettings(item, (prev) => ({ ...prev, statsVisible: visible }));
}

/**
 * Favicon tiles on the links row. Only the setting — the permission gate
 * lives beside the links row, where the ask actually happens.
 */
export function setLinkIcons(item: SettingsSeam, on: boolean): Promise<void> {
  return updateSettings(item, (prev) => ({ ...prev, linkIcons: on }));
}

/** The bytes as they would be stored: readable JSON for the drawer's export. */
export async function exportItem(item: SettingsSeam): Promise<string> {
  const settings = migrateSettings(await item.getValue());
  return JSON.stringify(settings, null, 2);
}

/**
 * Import is a read of untrusted text through the schema's door: whatever
 * comes in is migrated before it is stored, junk collapses to defaults,
 * and text that isn't JSON at all throws before anything is written.
 */
export async function importItem(item: SettingsSeam, text: string): Promise<void> {
  const parsed: unknown = JSON.parse(text);
  await item.setValue(migrateSettings(parsed));
}
