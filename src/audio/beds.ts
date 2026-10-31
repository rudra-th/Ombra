export type BedId =
  | 'rain'
  | 'brown'
  | 'pink'
  | 'fire'
  | 'cafe'
  | 'ocean'
  | 'forest'
  | 'wind'
  | 'birds';

/** The whole mixer menu, in the order the plan names them. */
export const BEDS = [
  'rain',
  'brown',
  'pink',
  'fire',
  'cafe',
  'ocean',
  'forest',
  'wind',
  'birds',
] as const satisfies readonly BedId[];

/** A sleeping mixer: no bed, no remembered gains. */
export interface AmbienceState {
  bed: BedId | null;
  levels: Partial<Record<BedId, number>>;
}

export const FALLBACK_AMBIENCE: AmbienceState = { bed: null, levels: {} };

/** A bed nobody turned on yet plays at a gentle half-gain. */
export function levelFor(state: AmbienceState, bed: BedId): number {
  return state.levels[bed] ?? 0.5;
}

export function setBed(state: AmbienceState, bed: BedId | null): AmbienceState {
  return { bed, levels: { ...state.levels } };
}

export function setLevel(
  state: AmbienceState,
  bed: BedId,
  raw: number,
): AmbienceState {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return state;
  const levels = { ...state.levels, [bed]: Math.min(1, Math.max(0, raw)) };
  return { bed: state.bed, levels };
}

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Stored bytes pass through before React or the engine ever see them. */
export function readAmbience(raw: unknown): AmbienceState {
  if (!asRecord(raw)) return FALLBACK_AMBIENCE;
  const bed = BEDS.includes(raw.bed as BedId) ? (raw.bed as BedId) : null;
  const storedLevels = asRecord(raw.levels) ? raw.levels : {};
  const levels: Partial<Record<BedId, number>> = {};
  for (const bedId of BEDS) {
    const v = storedLevels[bedId];
    if (typeof v === 'number' && Number.isFinite(v)) {
      levels[bedId] = Math.min(1, Math.max(0, v));
    }
  }
  return { bed, levels };
}
