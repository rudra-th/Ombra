import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from './schema';
import {
  exportItem,
  importItem,
  setSettingsAccent,
  setSettingsName,
  setSoundPower,
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
