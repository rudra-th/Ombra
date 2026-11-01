import { describe, expect, it } from 'vitest';
import { PRESETS, presetAmbience, presetSettings } from './presets';

describe('the three presets', () => {
  it('speaks in settings and ambience only, never film or name', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
      expect(preset.bed === null || typeof preset.bed === 'string').toBe(true);
      expect(typeof preset.accent).toBe('string');
      expect(preset.sound.enabled).toBe(true); // a preset wakes the room
      expect(preset.sound.volume).toBeGreaterThan(0);
      expect(preset.sound.volume).toBeLessThanOrEqual(1);
      expect(['morning', 'deep', 'evening']).toContain(id);
    }
  });

  it('applies as settings bytes', () => {
    expect(presetSettings('morning')).toEqual({
      ...presetSettings('morning'),
      accent: 'sage',
      sound: { enabled: true, volume: presetSettings('morning').sound.volume },
    });
    expect(presetSettings('deep').accent).toBe('fog');
    expect(presetSettings('evening').accent).toBe('ember');
  });

  it('applies as an ambience bed with its own level', () => {
    expect(presetAmbience('morning').bed).toBe('birds');
    expect(presetAmbience('deep').bed).toBe('rain');
    expect(presetAmbience('evening').bed).toBe('fire');
    for (const id of ['morning', 'deep', 'evening'] as const) {
      const { bed, level } = presetAmbience(id);
      expect(level).toBeGreaterThan(0);
      expect(level).toBeLessThanOrEqual(1);
      expect(bed).not.toBeNull();
    }
  });
});
