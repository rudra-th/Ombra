import { describe, expect, it } from 'vitest';
import {
  BEDS,
  FALLBACK_AMBIENCE,
  levelFor,
  readAmbience,
  setBed,
  setLevel,
  type BedId,
} from './beds';

describe('the bed catalog', () => {
  it('offers exactly the nine planned beds', () => {
    expect(BEDS).toEqual([
      'rain',
      'brown',
      'pink',
      'fire',
      'cafe',
      'ocean',
      'forest',
      'wind',
      'birds',
    ]);
  });
});

describe('setBed', () => {
  it('turns a bed on without touching levels', () => {
    const state = setBed(FALLBACK_AMBIENCE, 'rain');
    expect(state.bed).toBe<BedId>('rain');
    expect(state.levels).toEqual({});
  });

  it('powers the mixer off when asked', () => {
    const state = setBed({ bed: 'pink', levels: { pink: 0.2 } }, null);
    expect(state.bed).toBeNull();
  });
});

describe('levelFor', () => {
  it('uses the recorded level when there is one', () => {
    expect(levelFor({ bed: 'rain', levels: { rain: 0.25 } }, 'rain')).toBe(0.25);
  });

  it('falls back to a gentle half-gain when unset', () => {
    expect(levelFor(FALLBACK_AMBIENCE, 'ocean')).toBe(0.5);
  });
});

describe('setLevel', () => {
  it('clips the slider to honest bounds', () => {
    expect(setLevel(FALLBACK_AMBIENCE, 'rain', 7).levels.rain).toBe(1);
    expect(setLevel(FALLBACK_AMBIENCE, 'rain', -2).levels.rain).toBe(0);
  });

  it('ignores junk instead of destroying a working gain', () => {
    const prev = setLevel(FALLBACK_AMBIENCE, 'rain', 0.4);
    expect(setLevel(prev, 'rain', NaN as unknown as number).levels.rain).toBe(0.4);
    expect(
      setLevel(prev, 'rain', undefined as unknown as number).levels.rain,
    ).toBe(0.4);
  });
});

describe('readAmbience', () => {
  it('falls back to silence on garbage', () => {
    expect(readAmbience(null)).toEqual(FALLBACK_AMBIENCE);
    expect(readAmbience('noise')).toEqual(FALLBACK_AMBIENCE);
  });

  it('keeps a known bed and its level', () => {
    expect(readAmbience({ bed: 'fire', levels: { fire: 0.33 } })).toEqual({
      bed: 'fire',
      levels: { fire: 0.33 },
    });
  });

  it('retires an unknown bed name', () => {
    expect(readAmbience({ bed: 'k-pop', levels: {} }).bed).toBeNull();
  });

  it('clamps levels and drops entries for unknown beds', () => {
    const state = readAmbience({
      bed: 'rain',
      levels: { rain: 9, 'k-pop': 0.5, wind: -1 },
    });
    expect(state.levels).toEqual({ rain: 1, wind: 0 });
  });

  it('reads a non-object levels block as empty', () => {
    expect(readAmbience({ bed: 'pink', levels: 'LOUD' })).toEqual({
      bed: 'pink',
      levels: {},
    });
  });
});
