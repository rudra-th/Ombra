import { describe, expect, it } from 'vitest';
import { todayKey, nextStreak, type StreakState } from './store';

const KEY = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

describe('todayKey', () => {
  it('formats a local YYYY-MM-DD without UTC drift', () => {
    expect(todayKey(new Date(2026, 9, 31))).toBe('2026-10-31');
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('nextStreak', () => {
  const prev = (streak: number, lastKey: string | null): StreakState => ({
    streak,
    lastKey,
  });

  it('starts at 1 on the very first intention', () => {
    expect(nextStreak(prev(0, null), '2026-10-31', '2026-10-31')).toBe(1);
  });

  it('keeps streak when yesterday was set', () => {
    expect(nextStreak(prev(3, '2026-10-30'), '2026-10-31', '2026-10-31')).toBe(
      4,
    );
  });

  it('does not double-count the same day', () => {
    expect(nextStreak(prev(3, '2026-10-31'), '2026-10-31', '2026-10-31')).toBe(
      3,
    );
  });

  it('resets to 1 after a gap', () => {
    expect(nextStreak(prev(3, '2026-10-28'), '2026-10-31', '2026-10-31')).toBe(
      1,
    );
  });
});
