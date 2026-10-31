/**
 * The film's pure core: the clock, the beats, the chrome, the magnet.
 * No DOM here — Story.tsx fills in the pixels, film.test.ts keeps the truth.
 */

/** The film runs at 24 fps like restitution of a real print. */
export const FPS = 24;

/** The film is 10.5 seconds of screen: one pass covers 252 frames. */
export const FILM_SECONDS = 10.5;
export const TOTAL_FRAMES = Math.round(FPS * FILM_SECONDS);

export interface BeatSpan {
  /** Share of track progress where the beat starts taking over. */
  from: number;
  /** Share where it has fully receded. */
  to: number;
}

/**
 * Three pinned beats; the overlaps ARE the crossfades. Five beats is the
 * ceiling — three is the film, never a scratch track.
 */
export const BEATS: readonly BeatSpan[] = [
  { from: 0.0, to: 0.44 },
  { from: 0.36, to: 0.74 },
  { from: 0.64, to: 1.0 },
];

/** Where the weak magnet wants the transport to rest. */
export const CENTER_PROGRESSES: readonly number[] = [0.22, 0.55, 0.82, 1.0];

/** The magnet reaches this fraction of the viewport around each center. */
export const MAGNET_FRACTION = 0.2;

/** Letterbox and vignette, as 0..1 strengths the CSS multiplies. */
export interface Chrome {
  bars: number;
  vignette: number;
}

/** The chrome at rest, its lift per speed step, and the caps. */
export const CHROME = {
  rest: { bars: 0.05, vignette: 0.45 },
  barsAdd: 0.1,
  vignetteAdd: 0.3,
  /** Progress per second treated as "fast" — 1.0 is a brisk flick. */
  refSpeed: 2,
  caps: { bars: 0.2, vignette: 1 },
} as const;

export type Quality = 'high' | 'low';

/** Below this fps the film goes austere; above this one it may climb back. */
export const FPS_DOWN = 45;
export const FPS_UP = 56;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Progress onto the frame ladder — the only place time is quantized. */
export function frameAt(progress: number, total: number = TOTAL_FRAMES): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(total - 1, Math.floor(clamp01(progress) * total));
}

/** HUD stamp: MM:SS:FF, hours are always zero in a tab. */
export function timecode(frame: number): string {
  const f = Math.max(0, Math.floor(frame));
  const ff = String(f % FPS).padStart(2, '0');
  const ss = String(Math.floor(f / FPS) % 60).padStart(2, '0');
  const mm = String(Math.floor(f / FPS / 60)).padStart(2, '0');
  return `${mm}:${ss}:${ff}`;
}

/** The beat holding the stage as each new one begins its crossfade. */
export function beatAt(progress: number): number {
  const p = clamp01(progress);
  let held = 0;
  for (let i = 0; i < BEATS.length; i += 1) {
    if (p >= BEATS[i]!.from) held = i;
  }
  return held;
}

/**
 * Chrome breathes with scroll speed and settles at rest — the bars lift,
 * the vignette steals a little more light, then everything relaxes.
 */
export function chromeAt(speed: number): Chrome {
  const gust = clamp01(Math.abs(speed) / CHROME.refSpeed);
  return {
    bars: Math.min(CHROME.caps.bars, CHROME.rest.bars + CHROME.barsAdd * gust),
    vignette: Math.min(CHROME.caps.vignette, CHROME.rest.vignette + CHROME.vignetteAdd * gust),
  };
}

/**
 * A rest point for the transport, or null when the hand is between beats —
 * the magnet only answers within its shouting distance.
 */
export function snapTarget(at: number, length: number, span: number): number | null {
  const window = MAGNET_FRACTION * span;
  let best: number | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const p of CENTER_PROGRESSES) {
    const t = p * length;
    const d = Math.abs(at - t);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  if (best === null || bestDist > window) return null;
  // never ask for a rest past the end of the reel
  return Math.min(best, Math.max(0, length));
}

/** Quality from smoothed fps: hysteresis keeps it from thrashing. */
export function qualityOf(fps: number, current: Quality): Quality {
  if (fps < FPS_DOWN) return 'low';
  if (fps > FPS_UP) return 'high';
  return current;
}

/** Exponential smoothing of frame time, k in 0..1. */
export function emaMs(prev: number, dt: number, k = 0.2): number {
  return prev + k * (dt - prev);
}
