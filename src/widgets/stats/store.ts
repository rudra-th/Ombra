import { storage } from 'wxt/utils/storage';
import { daysBetween } from '../../state/day';

/**
 * The tab's attendance ledger: how many tabs this device opened per day.
 * Local only, hand-sized, keeps itself to about a month and then forgets.
 */
export type StatsMap = Record<string, number>;

/** Days the ledger remembers before it lets go. */
export const STATS_KEEP_DAYS = 30;

export const statsItem = storage.defineItem<StatsMap>('local:stats', {
  fallback: {},
});

/** The only key shape the ledger keeps and the only counts it believes. */
function believable(key: string): boolean {
  return /^20\d{2}-\d{2}-\d{2}$/.test(key);
}

/** Stored bytes pass the ledger's guard before React ever sees them. */
export function readStats(raw: unknown): StatsMap {
  const map: StatsMap = {};
  if (typeof raw === 'object' && raw !== null) {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (believable(key) && typeof value === 'number' && Number.isFinite(value)) {
        map[key] = Math.max(0, Math.floor(value));
      }
    }
  }
  return map;
}

/**
 * One tab was opened: today's count grows, and anything older than the
 * ledger's floor dissolves before it can grow read-only forever.
 */
export function bootToday(map: StatsMap, today: string, keep: number = STATS_KEEP_DAYS): StatsMap {
  const next: StatsMap = {};
  for (const [key, value] of Object.entries(map)) {
    if (daysBetween(key, today) >= 0 && daysBetween(key, today) <= keep) {
      next[key] = value;
    }
  }
  next[today] = (next[today] ?? 0) + 1;
  return next;
}

/** The last `n` days of counts, oldest first, zero-filled — for the spark. */
export function seriesFor(map: StatsMap, today: string, n: number = 7): number[] {
  const series: number[] = [];
  for (let back = n - 1; back >= 0; back -= 1) {
    const [y = 0, m = 0, d = 0] = today.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    day.setDate(day.getDate() - back);
    const pad = (v: number) => String(v).padStart(2, '0');
    const key = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    series.push(map[key] ?? 0);
  }
  return series;
}

export interface SparkDot {
  x: number;
  y: number;
}

/** Points for an SVG polyline across a `w × h` box with a small pad. */
export function sparkPoints(values: number[], w: number, h: number, pad = 2): SparkDot[] {
  const inner = w - pad * 2;
  const innerH = h - pad * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return values.map((v, i) => ({
    x: values.length === 1 ? pad : pad + (inner * i) / (values.length - 1),
    y: pad + innerH * (1 - (v - min) / span),
  }));
}
