import { describe, expect, it } from 'vitest';
import { brownNoise, pinkNoise, whiteNoise } from './noise';

/** Deterministic LCG so statistics are reproducible across runs. */
const lcg = (seed: number) => (): number => {
  seed = (seed * 48271) % 2147483647;
  return (seed - 1) / 2147483646;
};

const rms = (buf: Float32Array): number => {
  let sum = 0;
  for (const v of buf) sum += v * v;
  return Math.sqrt(sum / buf.length);
};

/** Zero-crossings per sample — proxy for spectral brightness. */
const zcr = (buf: Float32Array): number => {
  let cross = 0;
  for (let i = 1; i < buf.length; i++) {
    const prev = buf[i - 1]!;
    const cur = buf[i]!;
    if (prev < 0 !== cur < 0) cross++;
  }
  return cross / buf.length;
};

const N = 8192;

describe('noise renderers', () => {
  it('limits every sample to ±1 with no NaNs', () => {
    for (const buf of [whiteNoise(N, lcg(1)), brownNoise(N, lcg(1)), pinkNoise(N, lcg(1))]) {
      expect(buf.length).toBe(N);
      for (const v of buf) {
        expect(Number.isFinite(v)).toBe(true);
        expect(Math.abs(v)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('normalizes the beds to a predictable level', () => {
    // A bed should arrive around -12 dBFS, mix gain makes it quieter.
    expect(Math.abs(rms(brownNoise(N, lcg(2))) - 0.25)).toBeLessThan(0.025);
    expect(Math.abs(rms(pinkNoise(N, lcg(2))) - 0.25)).toBeLessThan(0.025);
  });

  it('keeps brightness ordered: brown darkest, white brightest', () => {
    const b = zcr(brownNoise(N, lcg(3)));
    const p = zcr(pinkNoise(N, lcg(3)));
    const w = zcr(whiteNoise(N, lcg(3)));
    expect(b).toBeLessThan(p);
    expect(p).toBeLessThan(w);
    // Brown should be a lot darker than white — half as many crossings, easily.
    expect(b).toBeLessThan(w / 2);
  });

  it('varies with its seed so two renders differ', () => {
    const a = whiteNoise(64, lcg(4));
    const b = whiteNoise(64, lcg(5));
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});
