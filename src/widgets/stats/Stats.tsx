import { useEffect } from 'react';
import {
  bootToday,
  readStats,
  seriesFor,
  sparkPoints,
  statsItem,
} from './store';
import { updateItem, useStorageValue } from '../../state/useStorageValue';
import { todayKey } from '../../state/day';
import { useDailyTick } from '../../state/useDailyTick';

/**
 * The tab's quiet rhythm: a 7-day spark of how many tabs this device
 * opened, one boot per opened page. Every other surface counts you; this
 * stays local and counts only itself.
 */
export function Stats() {
  useDailyTick(); // "today" rolls over at local midnight
  const raw = useStorageValue(statsItem);
  const map = readStats(raw);
  const today = todayKey(new Date());
  const series = seriesFor(map, today, 7);
  const todayCount = series[series.length - 1] ?? 0;
  const weekCount = series.reduce((a, b) => a + b, 0);
  const pts = sparkPoints(series, 84, 22);
  const path = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const last = pts[pts.length - 1]!;

  // one opened tab counted once — the write does its own read
  useEffect(() => {
    void updateItem(statsItem, (prev) =>
      bootToday(readStats(prev), todayKey(new Date())),
    );
  }, []);

  return (
    <div className="stats" aria-label="Tab rhythm">
      <svg
        className="stats-spark"
        viewBox="0 0 84 22"
        width="84"
        height="22"
        aria-hidden="true"
      >
        <polyline points={path} />
        <circle cx={last.x} cy={last.y} r="2" />
      </svg>
      <p className="stats-line tnum">
        <strong>{todayCount}</strong> today · {weekCount} this week
      </p>
    </div>
  );
}
