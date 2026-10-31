import type { Random } from './noise';
import { type CtxLike, type GainLike, type AudioParamLike } from './engine';

/** Everything the recipes say, in the audio graph's own vocabulary. */
export interface ToneSpec {
  kind: 'tone';
  /** Hz. */
  freq: number;
  type: OscillatorType;
  /** Seconds after "now" on the context clock. */
  startAt: number;
  /** Seconds the voice lasts. */
  duration: number;
  /** Linear peak 0..1 before the master's say. */
  gain: number;
  /** Seconds to the peak (attack), the rest is a symmetric release. */
  attack: number;
  detuneCents?: number;
}

export interface NoiseSpec {
  kind: 'noise';
  startAt: number;
  duration: number;
  gain: number;
  attack: number;
  filter: {
    type: BiquadFilterType;
    /** Center/cutoff Hz at the start of the sweep. */
    freq: number;
    q?: number;
  };
  /** Optional sweep target in Hz, hit at the end of the voice. */
  sweepTo?: number;
  /** Fraction of the voice the sweep takes — the rest ring-outs. */
  sweepFrac?: number;
}

export type RecipeSpec = ToneSpec | NoiseSpec;

const PIANO_C5 = 523.25;
const PIANO_G5 = 784;
const PIANO_G4 = 392;

/** ≥3kHz, ≤40ms, ≤ −24dBFS — a tick you feel rather than hear. */
export function hoverTick(rng: Random = Math.random): RecipeSpec[] {
  return [
    {
      kind: 'tone',
      freq: 3200 + Math.floor(rng() * 400),
      type: 'sine',
      startAt: 0,
      duration: 0.032,
      gain: 0.045,
      attack: 0.002,
    },
  ];
}

/** Under 80ms, a soft negative confirmation. */
export function softClick(): RecipeSpec[] {
  return [
    {
      kind: 'tone',
      freq: 1174,
      type: 'triangle',
      startAt: 0,
      duration: 0.06,
      gain: 0.14,
      attack: 0.001,
    },
  ];
}

/** A section edge: C5 + G5, detuned a few cents, blooming 1.8s. */
export function boundaryChime(): RecipeSpec[] {
  return [
    {
      kind: 'tone',
      freq: PIANO_C5,
      type: 'sine',
      startAt: 0,
      duration: 1.8,
      gain: 0.16,
      attack: 0.02,
      detuneCents: -5,
    },
    {
      kind: 'tone',
      freq: PIANO_G5,
      type: 'sine',
      startAt: 0,
      duration: 1.8,
      gain: 0.12,
      attack: 0.02,
      detuneCents: 7,
    },
  ];
}

/** Breathing rhythm: in arrives on C5, out settles on G4. */
export function phaseChime(phase: 'in' | 'out', _seed = 0): RecipeSpec[] {
  return [
    {
      kind: 'tone',
      freq: phase === 'in' ? PIANO_C5 : PIANO_G4,
      type: 'sine',
      startAt: 0,
      duration: 0.9,
      gain: 0.12,
      attack: 0.05,
      detuneCents: phase === 'in' ? -4 : 4,
    },
  ];
}

/** A room passing by: bandpassed noise, 200Hz → 2kHz, ~300ms. */
export function whoosh(_seed = 0): RecipeSpec[] {
  return [
    {
      kind: 'noise',
      startAt: 0,
      duration: 0.3,
      gain: 0.14,
      attack: 0.04,
      filter: { type: 'bandpass', freq: 200, q: 1.2 },
      sweepTo: 2000,
      sweepFrac: 0.85,
    },
  ];
}

export type BiquadLike = {
  type: BiquadFilterType;
  frequency: AudioParamLike;
  Q: AudioParamLike;
  connect(to: unknown): unknown;
};

export interface OscLike {
  type: OscillatorType;
  frequency: AudioParamLike;
  detune: AudioParamLike;
  connect(to: unknown): unknown;
  start(when?: number): unknown;
  stop(when?: number): unknown;
}

export interface BuffSourceLike {
  buffer: unknown;
  loop: boolean;
  connect(to: unknown): unknown;
  start(when?: number, offset?: number): unknown;
  stop(when?: number): unknown;
}

/** What a context must supply for recipes; real AudioContext satisfies it. */
export interface RecipeCtx extends CtxLike {
  createOscillator(): OscLike;
  createBiquadFilter(): BiquadLike;
  createBufferSource(): BuffSourceLike;
}

const clampTime = (t: number): number => Math.max(t, 0);

/**
 * Sample-accurate by construction: every start/stop/automation lands on the
 * context clock (now + offset). The audio thread never waits for us.
 */
export function scheduleSpecs(
  ctx: RecipeCtx,
  bus: GainLike,
  specs: RecipeSpec[],
  opts: { noiseBuffer?: unknown; now?: number } = {},
): void {
  const now = opts.now ?? ctx.currentTime;

  for (const spec of specs) {
    const start = clampTime(now + spec.startAt);
    if (spec.kind === 'tone') {
      const osc = ctx.createOscillator();
      osc.type = spec.type;
      osc.frequency.value = spec.freq;
      if (spec.detuneCents) osc.detune.value = spec.detuneCents;
      const env = ctx.createGain();
      osc.connect(env);
      env.connect(bus);
      envelope(env.gain, start, spec.duration, spec.gain, spec.attack);
      osc.start(start);
      osc.stop(start + spec.duration);
    } else {
      const src = ctx.createBufferSource();
      if (opts.noiseBuffer) {
        src.buffer = opts.noiseBuffer;
        src.loop = true;
      }
      const filter = ctx.createBiquadFilter();
      filter.type = spec.filter.type;
      filter.frequency.value = spec.filter.freq;
      if (spec.filter.q !== undefined) filter.Q.value = spec.filter.q;
      const env = ctx.createGain();
      src.connect(filter);
      filter.connect(env);
      env.connect(bus);
      if (spec.sweepTo !== undefined) {
        const frac = spec.sweepFrac ?? 1;
        filter.frequency.setValueAtTime(spec.filter.freq, start);
        filter.frequency.exponentialRampToValueAtTime(
          spec.sweepTo,
          start + spec.duration * frac,
        );
      }
      envelope(env.gain, start, spec.duration, spec.gain, spec.attack);
      src.start(start);
      src.stop(start + spec.duration);
    }
  }
}

/** Attack to peak, then a mirrored release — no click at either end. */
const envelope = (
  param: AudioParamLike,
  start: number,
  duration: number,
  peak: number,
  attack: number,
): void => {
  const peakAt = clampTime(start + attack);
  const releaseAt = clampTime(peakAt + (duration - attack) / 2);
  param.setValueAtTime(0, start);
  param.linearRampToValueAtTime(peak, peakAt);
  param.linearRampToValueAtTime(peak * 0.6, releaseAt);
  param.linearRampToValueAtTime(0, start + duration);
};
