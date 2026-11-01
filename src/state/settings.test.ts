import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, migrateSettings } from './schema';
import {
  exportItem,
  importItem,
  setLinkIcons,
  setSettingsAccent,
  setSettingsName,
  setSoundPower,
  setStatsVisible,
  type SettingsSeam,
} from './settings';

/** A stub of the storage seam — only getValue/setValue matter. */
const fakeItem = (blob: unknown) => {
  let stored: unknown = blob;
  const item: SettingsSeam & { getValue: ReturnType<typeof vi.fn> } = {
    getValue: vi.fn(async () => stored),
    setValue: vi.fn(async (v: unknown) => {
      stored = v;
    }),
  };
  return item;
};

const legacy = {
  version: 1,
  name: 'Rudra',
  soundEnabled: true,
};

/** Read back with known types — the fake stores whatever the write said. */
const readBack = async (item: SettingsSeam): Promise<{
  sound: { enabled: boolean; volume: number };
}> =>
  (await item.getValue()) as {
    sound: { enabled: boolean; volume: number };
  };

describe('setSoundPower (migrate-on-write seam)', () => {
  it('toggles a legacy stored blob without crashing', async () => {
    const item = fakeItem(legacy);
    await setSoundPower(item, false);
    const written = await readBack(item);
    expect(written.sound).toEqual({ enabled: false, volume: 0.3 });
    // the legacy flag never reappears in stored bytes
    expect(JSON.stringify(await item.getValue()).includes('soundEnabled')).toBe(false);
  });

  it('keeps volume intact when only power changes', async () => {
    const item = fakeItem({
      version: 1,
      sound: { enabled: true, volume: 0.8 },
    });
    await setSoundPower(item, true);
    const written = await readBack(item);
    expect(written.sound.volume).toBe(0.8);
    expect(written.sound.enabled).toBe(true);
  });

  it('falls back to schema defaults for junk bytes', async () => {
    const item = fakeItem('not a settings blob');
    await setSoundPower(item, true);
    const written = await readBack(item);
    expect(written.sound.enabled).toBe(true);
  });
});

describe('defaults still guard the fresh path', () => {
  it('ship sound off at a quiet 0.3', () => {
    expect(DEFAULT_SETTINGS.sound.enabled).toBe(false);
    expect(DEFAULT_SETTINGS.sound.volume).toBe(0.3);
  });

  it('ship the tab-rhythm strip hidden and shortcut icons off', () => {
    expect(DEFAULT_SETTINGS.statsVisible).toBe(false);
    expect(DEFAULT_SETTINGS.linkIcons).toBe(false);
  });
});

describe('surface toggles', () => {
  it('hand old blobs the hidden defaults at the schema door', () => {
    const complete = migrateSettings({ version: 1, name: 'Ro' });
    expect(complete.statsVisible).toBe(false);
    expect(complete.linkIcons).toBe(false);
  });

  it('write the tab-stats toggle both ways', async () => {
    const item = fakeItem({ version: 1, name: 'Ro' });
    await setStatsVisible(item, true);
    const on = await readBack(item) as unknown as { statsVisible: boolean };
    expect(on.statsVisible).toBe(true);
    await setStatsVisible(item, false);
    const off = await readBack(item) as unknown as { statsVisible: boolean };
    expect(off.statsVisible).toBe(false);
  });

  it('write the shortcut-icons toggle', async () => {
    const item = fakeItem({ version: 1, name: 'Ro' });
    await setLinkIcons(item, true);
    const written = await readBack(item) as unknown as { linkIcons: boolean };
    expect(written.linkIcons).toBe(true);
    // junk bytes collapse to the shipped hidden default, never a surprise on
    await importItem(item, JSON.stringify({ garbage: true }));
    const reset = await readBack(item) as unknown as { linkIcons: boolean };
    expect(reset.linkIcons).toBe(false);
  });
});

/**
 * The store's own write latency (a real chrome.storage takes a microtask or
 * few) — two toggles fired in one React batch read the same snapshot before
 * either write lands, and the second's merge would undo the first's field.
 */
const racyStore = (blob: unknown): SettingsSeam => {
  let stored: unknown = blob;
  return {
    getValue: async () => stored,
    setValue: async (v: unknown) => {
      await Promise.resolve();
      stored = v;
    },
  };
};

describe('concurrent writes keep each other', () => {
  it('threads two surface toggles in one batch through the write tail', async () => {
    const item = racyStore({ version: 1, name: 'Ro' });
    await Promise.all([setStatsVisible(item, true), setLinkIcons(item, true)]);
    const written = await readBack(item) as unknown as {
      statsVisible: boolean;
      linkIcons: boolean;
    };
    expect(written.statsVisible).toBe(true);
    expect(written.linkIcons).toBe(true);
  });
});

describe('the drawer writes', () => {
  it('trims the name on write', async () => {
    const item = fakeItem({ version: 1, name: 'Rudra' });
    await setSettingsName(item, '  Ro  ');
    const written = await readBack(item as unknown as SettingsSeam) as {
      sound: unknown;
      name?: string;
    };
    expect(written.name).toBe('Ro');
  });

  it('keeps run of accent choice', async () => {
    const item = fakeItem({ version: 1, name: 'Rudra' });
    await setSettingsAccent(item, 'sage');
    const written = await readBack(item) as unknown as { accent: string };
    expect(written.accent).toBe('sage');
  });
});

describe('export and import', () => {
  it('exports migrated bytes as readable JSON', async () => {
    const item = fakeItem(legacy);
    const text = await exportItem(item);
    const parsed = JSON.parse(text) as { name?: string; sound?: unknown; soundEnabled?: unknown };
    expect(parsed.name).toBe('Rudra');
    expect(parsed.sound).toEqual({ enabled: true, volume: 0.3 });
    expect(parsed.soundEnabled).toBeUndefined(); // legacy flag washes out
  });

  it('imports parsed bytes migrated on write', async () => {
    const item = fakeItem({ version: 1, name: '' });
    await importItem(item, JSON.stringify(legacy));
    const written = await readBack(item);
    expect(written.sound).toEqual({ enabled: true, volume: 0.3 });
  });

  it('collapses junk JSON bytes to schema defaults, without crashing', async () => {
    const item = fakeItem({ version: 1, name: 'keep' });
    await importItem(item, JSON.stringify({ garbage: true }));
    const written = await readBack(item);
    expect(written.sound.enabled).toBe(false);
  });

  it('rejects unparseable text without writing anything', async () => {
    const item = fakeItem({ version: 1, name: 'keep' });
    await expect(importItem(item, '{not json')).rejects.toThrow(SyntaxError);
    // untouched: exactly the bytes the fake started with
    expect(JSON.stringify(await item.getValue())).toBe(JSON.stringify({ version: 1, name: 'keep' }));
  });
});
