import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, migrateSettings } from './schema';

describe('DEFAULT_SETTINGS', () => {
  it('ships a calm, silent, unnamed first run', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      version: 1,
      name: '',
      accent: 'ember',
      soundEnabled: false,
      scene: {
        kind: 'none',
        id: null,
        dim: 0.36,
        blur: 0,
        fit: 'cover',
      },
    });
  });
});

describe('migrateSettings', () => {
  it('returns defaults for null / garbage', () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings(42)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings('nope')).toEqual(DEFAULT_SETTINGS);
  });

  it('merges a partial object over defaults', () => {
    const merged = migrateSettings({ name: 'Rudra', accent: 'sage' });
    expect(merged.name).toBe('Rudra');
    expect(merged.accent).toBe('sage');
    expect(merged.soundEnabled).toBe(false);
    expect(merged.scene).toEqual(DEFAULT_SETTINGS.scene);
  });

  it('keeps unknown fields out of the result', () => {
    const merged = migrateSettings({ name: 'R', hacker: true });
    expect(merged).not.toHaveProperty('hacker');
    expect(Object.keys(merged).sort()).toEqual(
      ['accent', 'name', 'scene', 'soundEnabled', 'version'].sort(),
    );
  });

  it('re-drops anything whose version it does not know', () => {
    expect(migrateSettings({ version: 99, name: 'future' })).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it('clamps scene.numeric junk to sane bounds', () => {
    const merged = migrateSettings({
      scene: { kind: 'photo', id: 'a', dim: 7, blur: -3, fit: 'cover' },
    });
    expect(merged.scene.dim).toBe(1);
    expect(merged.scene.blur).toBe(0);
  });

  it('rejects a scene kind it does not know', () => {
    const merged = migrateSettings({ scene: { kind: 'ligo' } });
    expect(merged.scene.kind).toBe('none');
  });
});
