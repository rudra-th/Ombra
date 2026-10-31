export interface StreakState {
  streak: number;
  /** `YYYY-MM-DD` (local) of the last intention, or null before the first. */
  lastKey: string | null;
}

/** Local `YYYY-MM-DD` — never `toISOString`, it drifts across timezones. */
export function todayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_MS = 86_400_000;

/** Whole days from key `a` to key `b`. Fixed noon UTC keeps DST out of the math. */
function keyDiff(a: string, b: string): number {
  const parse = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d, 12);
  };
  return Math.round((parse(b) - parse(a)) / DAY_MS);
}

/**
 * The streak the next intention should leave behind.
 * `_today` is the day the surface is being viewed; `setFor` is the day the
 * intention is being written for (they disagree across midnight).
 */
export function nextStreak(
  prev: StreakState,
  _today: string,
  setFor: string,
): number {
  if (prev.lastKey === setFor) {
    return prev.streak; // same day, already counted
  }
  if (prev.lastKey === null) {
    return 1; // the very first intention
  }
  return keyDiff(prev.lastKey, setFor) === 1 ? prev.streak + 1 : 1;
}
