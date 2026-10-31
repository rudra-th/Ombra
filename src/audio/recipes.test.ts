import { describe, expect, it } from 'vitest';
import {
  boundaryChime,
  hoverTick,
  phaseChime,
  softClick,
  whoosh,
  type NoiseSpec,
  type RecipeSpec,
  type ToneSpec,
} from './recipes';

const linear = (db: number): number => Math.pow(10, db / 20);

const toneAt = (specs: RecipeSpec[], i: number): ToneSpec => {
  expect(specs[i]).toBeDefined();
  return specs[i] as ToneSpec;
};
const noiseAt = (specs: RecipeSpec[], i: number): NoiseSpec => {
  expect(specs[i]).toBeDefined();
  return specs[i] as NoiseSpec;
};

describe('hover tick', () => {
  it('is a faint, fast spark in the high register', () => {
    const tone = toneAt(hoverTick(), 0);
    expect(tone.freq).toBeGreaterThanOrEqual(3000);
    expect(tone.duration).toBeLessThanOrEqual(0.04);
    expect(tone.gain).toBeLessThanOrEqual(linear(-24));
    expect(tone.attack).toBeLessThanOrEqual(0.005);
    expect(tone.startAt).toBe(0);
  });
});

describe('soft click', () => {
  it('stays under 80ms and much quieter than speech', () => {
    const tone = toneAt(softClick(), 0);
    expect(tone.duration).toBeLessThan(0.08);
    expect(tone.gain).toBeLessThanOrEqual(0.2);
  });
});

describe('boundary chime', () => {
  it('stacks C5 and G5, detuned, in a long bloom', () => {
    const specs = boundaryChime();
    expect(specs).toHaveLength(2);
    const a = toneAt(specs, 0);
    const b = toneAt(specs, 1);
    expect([a.freq, b.freq]).toEqual([523.25, 784]);
    expect(a.duration).toBeGreaterThanOrEqual(1.5);
    expect(a.duration).toBeLessThanOrEqual(2);
    expect(a.duration).toBe(b.duration);
    expect(Math.abs(a.detuneCents ?? 0)).toBeGreaterThan(0);
    expect(Math.abs(b.detuneCents ?? 0)).toBeGreaterThan(0);
  });
});

describe('phase chime', () => {
  it('answers inhale and exhale with different notes', () => {
    const inhale = toneAt(phaseChime('in'), 0);
    const exhale = toneAt(phaseChime('out'), 0);
    expect(inhale.freq).not.toBe(exhale.freq);
    expect(inhale.duration).toBeLessThan((boundaryChime()[0] as ToneSpec).duration);
    expect(exhale.startAt).toBe(0);
  });
});

describe('whoosh', () => {
  it('sweeps filtered noise from 200Hz to 2kHz in about 300ms', () => {
    const noise = noiseAt(whoosh(), 0);
    expect(noise.duration).toBeGreaterThanOrEqual(0.25);
    expect(noise.duration).toBeLessThanOrEqual(0.35);
    expect(noise.filter.type).toBe('bandpass');
    expect(noise.filter.freq).toBe(200);
    expect(noise.sweepTo).toBe(2000);
    expect(noise.gain).toBeLessThan(0.2);
  });
});
