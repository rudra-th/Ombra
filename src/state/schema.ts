export interface SceneSettings {
  kind: 'none' | 'photo' | 'procedural';
  id: string | null;
  /** 0..1 — ink over the image */
  dim: number;
  /** 0..24 px */
  blur: number;
  fit: 'cover' | 'contain';
}

export type Accent = 'ember' | 'sage' | 'fog';

export interface SoundSettings {
  /** Master arm — false is the shipped default; the engine never sounds without it. */
  enabled: boolean;
  /** Master gain 0..1, default 0.3. */
  volume: number;
}

export interface Settings {
  version: 1;
  name: string;
  accent: Accent;
  sound: SoundSettings;
  scene: SceneSettings;
  /** The tab-rhythm strip under the quote — shipped hidden, never forced. */
  statsVisible: boolean;
  /** Favicon tiles on the links row; off until both option and permission agree. */
  linkIcons: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
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
};

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const asNumber = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.min(max, Math.max(min, v))
    : fallback;

const asText = (v: unknown, fallback: string) =>
  typeof v === 'string' ? v : fallback;

const asChoice = <T extends string>(v: unknown, choices: readonly T[], fallback: T): T =>
  choices.includes(v as T) ? (v as T) : fallback;

const ACCENTS: readonly Accent[] = ['ember', 'sage', 'fog'];
const SCENE_KINDS = ['none', 'photo', 'procedural'] as const;
const FITS = ['cover', 'contain'] as const;

function migrateScene(raw: unknown): SceneSettings {
  if (!asRecord(raw)) {
    return { ...DEFAULT_SETTINGS.scene };
  }
  return {
    kind: asChoice(raw.kind, SCENE_KINDS, DEFAULT_SETTINGS.scene.kind),
    id: typeof raw.id === 'string' ? raw.id : null,
    dim: asNumber(raw.dim, 0, 1, DEFAULT_SETTINGS.scene.dim),
    blur: asNumber(raw.blur, 0, 24, DEFAULT_SETTINGS.scene.blur),
    fit: asChoice(raw.fit, FITS, DEFAULT_SETTINGS.scene.fit),
  };
}

function migrateSound(
  raw: unknown,
  legacyFlag: unknown,
): SoundSettings {
  // The old flat `soundEnabled: boolean` blob migrates on read: its flag
  // seeds `sound.enabled`, and a present sound block always wins.
  if (!asRecord(raw)) {
    return { enabled: legacyFlag === true, volume: DEFAULT_SETTINGS.sound.volume };
  }
  return {
    enabled: raw.enabled === true,
    volume: asNumber(raw.volume, 0, 1, DEFAULT_SETTINGS.sound.volume),
  };
}

/** Unknown versions fall back to defaults; missing version = v1 partial. */
export function migrateSettings(raw: unknown): Settings {
  if (!asRecord(raw) || (raw.version !== undefined && raw.version !== 1)) {
    return { ...DEFAULT_SETTINGS, scene: { ...DEFAULT_SETTINGS.scene } };
  }
  return {
    version: 1,
    name: asText(raw.name, DEFAULT_SETTINGS.name).trim(),
    accent: asChoice(raw.accent, ACCENTS, DEFAULT_SETTINGS.accent),
    sound: migrateSound(raw.sound, raw.soundEnabled),
    scene: migrateScene(raw.scene),
    statsVisible: raw.statsVisible === true,
    linkIcons: raw.linkIcons === true,
  };
}
