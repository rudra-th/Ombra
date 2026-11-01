import { describe, expect, it } from 'vitest';
import {
  STATS_KEEP_DAYS,
  bootToday,
  readStats,
  seriesFor,
  sparkPoints,
  type StatsMap,
} from './store';

describe('the day ledger', () => {
  it('counts a boot on today and prunes the ledger behind', () => {
    const map = readStats({
      '2026-10-20': 3,
      '2026-10-28': 1,
      '2026-10-29': 0,
    });
    const booted = bootToday(map, '2026-10-31');
    expect(booted['2026-10-31']).toBe(1);
    const again = bootToday(booted, '2026-10-31');
    expect(again['2026-10-31']).toBe(2); // several tabs share the day

    // everything older than the ledger floor dissolves
    const stale: StatsMap = { '2026-01-01': 9 };
    for (let i = 0; i < STATS_KEEP_DAYS; i += 1) void i; // silence, just shape
    const old = bootToday({ ...stale, '2026-10-31': 0 }, '2026-10-31');
    expect(old['2026-01-01']).toBeUndefined();
  });

  it('never lets a count go negative or fractional', () => {
    const booted = bootToday(readStats({ '2026-10-31': -4 }), '2026-10-31');
    expect(booted['2026-10-31']).toBeGreaterThanOrEqual(0);
  });
});

describe('the seven-day series', () => {
  it('reads oldest to newest, zero where the ledger is quiet', () => {
    const map = readStats({
      '2026-10-26': 2, // five days back
      '2026-10-28': 5, // three days back
      '2026-10-31': 7, // today
    });
    const s = seriesFor(map, '2026-10-31', 7);
    expect(s).toHaveLength(7);
    // indices are days-back 6..0: Oct 24..31, only the ledger's days lit
    expect(s).toEqual([0, 2, 0, 5, 0, 0, 7]);
  });
});

describe('the sparkline', () => {
  it('spans the box with its first and last point on the margins', () => {
    const pts = sparkPoints([1, 3, 2, 5], 100, 20);
    expect(pts[0]!.x).toBeCloseTo(2); // pad
    expect(pts[3]!.x).toBeCloseTo(98); // w - pad
    expect(pts[3]!.y).toBeCloseTo(2); // the peak
  });

  it('holds a flat baseline when every day is zero', () => {
    const pts = sparkPoints([0, 0, 0], 60, 20);
    pts.forEach((p) => {
      expect(p.y).toBeCloseTo(18);
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    });
  });
});
