import type { Accent, SoundSettings } from './schema';
import type { BedId } from '../audio/beds';

/**
 * The three presets. Each is a small, complete room: a color, a sound,
 * a bed at its own level. They touch settings and ambience only — the
 * name, intention, and film stay yours.
 */
export type PresetId = 'morning' | 'deep' | 'evening';

export interface PresetSpec {
  accent: Accent;
  sound: SoundSettings;
  bed: BedId;
  /** Level just for the preset's bed, the ambient gains keep their own. */
  level: number;
}

export const PRESETS: Record<PresetId, PresetSpec> = {
  morning: {
    accent: 'sage',
    sound: { enabled: true, volume: 0.35 },
    bed: 'birds',
    level: 0.3,
  },
  deep: {
    accent: 'fog',
    sound: { enabled: true, volume: 0.25 },
    bed: 'rain',
    level: 0.4,
  },
  evening: {
    accent: 'ember',
    sound: { enabled: true, volume: 0.4 },
    bed: 'fire',
    level: 0.45,
  },
};

/** The settings bytes a preset writes. */
export function presetSettings(id: PresetId): { accent: Accent; sound: SoundSettings } {
  const p = PRESETS[id];
  return { accent: p.accent, sound: { ...p.sound } };
}

/** The ambience bytes a preset writes: its bed on, others untouched. */
export function presetAmbience(id: PresetId): { bed: BedId; level: number } {
  const p = PRESETS[id];
  return { bed: p.bed, level: p.level };
}
