import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from './schema';
import { setSoundPower, type SettingsSeam } from './settings';

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
