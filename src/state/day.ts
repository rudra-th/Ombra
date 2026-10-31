const DAY_MS = 86_400_000;

/** Local `YYYY-MM-DD` — never `toISOString`, which drifts across timezones. */
export function todayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days from key `a` to key `b` (b - a). Fixed noon UTC keeps DST out. */
export function daysBetween(a: string, b: string): number {
  const parse = (key: string): number => {
    const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d, 12);
  };
  return Math.round((parse(b) - parse(a)) / DAY_MS);
}
