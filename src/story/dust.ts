import type { Random } from '../audio/noise';

/**
 * The film's dust: a handful of slow grains drifting through the frame.
 * Quantized — Story.tsx steps this exactly once per 24fps frame tick.
 */

export interface Grain {
  x: number;
  y: number;
  /** Per-second drift, deliberately small. */
  vx: number;
  vy: number;
  /** Radius and alpha in pixels/0..1. */
  r: number;
  a: number;
}

/** The film is sparse even when the machine is healthy. */
export const DUST_HIGH = 96;
/** Adaptive quality halves the field instead of starving it. */
export const DUST_LOW = Math.round(DUST_HIGH / 2);

/** Grains of a soft, uneven dust: size skews small, alpha faint. */
export function seedGrains(rng: Random, w: number, h: number, count: number): Grain[] {
  const grains: Grain[] = [];
  for (let i = 0; i < count; i += 1) {
    grains.push({
      x: rng() * w,
      y: rng() * h,
      vx: (rng() - 0.5) * 6,
      vy: -(1 + rng() * 3),
      r: 0.6 + rng() * rng() * 1.8,
      a: 0.05 + rng() * 0.18,
    });
  }
  return grains;
}

/** One frame of drift: move by dt seconds, soft-wrap the frame. */
export function stepGrains(grains: Grain[], dt: number, w: number, h: number): void {
  for (const g of grains) {
    g.x = wrap(g.x + g.vx * dt, w);
    g.y = wrap(g.y + g.vy * dt, h);
  }
}

function wrap(v: number, span: number): number {
  const m = v % span;
  return m < 0 ? m + span : m;
}
