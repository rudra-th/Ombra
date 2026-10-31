/** Focus presets, in minutes — the plan's two nudge lengths. */
export const PRESETS = [25, 50] as const;

/** m:ss, counting down, clamped at zero — the honest face of a clock. */
export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** wall-clock end of a session started at `startedAt`. */
export function sessionEnd(minutes: number, startedAt: number): number {
  return startedAt + minutes * 60_000;
}

/** Whole seconds left until `endAt`, read against `now`. */
export function remaining(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}
