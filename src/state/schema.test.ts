import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, migrateSettings } from './schema';

describe('DEFAULT_SETTINGS', () => {
  it('ships a calm, silent, unnamed first run', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      version: 1,
      name: '',
      accent: 'ember',
      sound: { enabled: false, volume: 0.3 },
      scene: {
        kind: 'none',
        id: null,
        dim: 0.36,
        blur: 0,
        fit: 'cover',
      },
      statsVisible: false,
      linkIcons: false,
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
    expect(merged.sound.enabled).toBe(false);
    expect(merged.scene).toEqual(DEFAULT_SETTINGS.scene);
  });

  it('merges a partial sound block over the sound defaults', () => {
    const merged = migrateSettings({ sound: { volume: 0.5 } });
    expect(merged.sound.enabled).toBe(false);
    expect(merged.sound.volume).toBe(0.5);
  });

  it('understands the legacy soundEnabled boolean', () => {
    const merged = migrateSettings({ soundEnabled: true });
    expect(merged.sound.enabled).toBe(true);
    expect(merged.sound.volume).toBe(0.3);
  });

  it('prefers the new sound block over the legacy flip', () => {
    const merged = migrateSettings({ soundEnabled: true, sound: { enabled: false } });
    expect(merged.sound.enabled).toBe(false);
  });

  it('keeps unknown fields out of the result', () => {
    const merged = migrateSettings({ name: 'R', hacker: true });
    expect(merged).not.toHaveProperty('hacker');
    expect(Object.keys(merged).sort()).toEqual(
      ['accent', 'linkIcons', 'name', 'scene', 'sound', 'statsVisible', 'version'].sort(),
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

  it('clamps loud volume junk to deaf-safe bounds', () => {
    expect(migrateSettings({ sound: { volume: 7 } }).sound.volume).toBe(1);
    expect(migrateSettings({ sound: { volume: -2 } }).sound.volume).toBe(0);
    expect(migrateSettings({ sound: { volume: 'loud' } }).sound.volume).toBe(0.3);
  });

  it('treats a non-boolean enabled flag as silent', () => {
    expect(migrateSettings({ sound: { enabled: 'yes' } }).sound.enabled).toBe(
      false,
    );
  });
});
