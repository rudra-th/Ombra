import { describe, expect, it } from 'vitest';
import { PRESETS, fmtClock, remaining, sessionEnd } from './store';

describe('fmtClock', () => {
  it('renders m:ss for minutes and seconds', () => {
    expect(fmtClock(25 * 60)).toBe('25:00');
    expect(fmtClock(299)).toBe('4:59');
    expect(fmtClock(0)).toBe('0:00');
  });

  it('counts down, never below zero', () => {
    expect(fmtClock(-3)).toBe('0:00');
  });
});

describe('remaining / sessionEnd', () => {
  it('learns the end wall-time when a session starts', () => {
    const end = sessionEnd(25, Date.now());
    expect(end - Date.now()).toBeCloseTo(25 * 60 * 1000, -2);
  });

  it('reads back seconds from the clock', () => {
    const now = Date.now();
    expect(remaining(now + 90_000, now)).toBe(90);
    expect(remaining(now - 10, now)).toBe(0);
  });
});

describe('presets', () => {
  it('offers the two planned lengths', () => {
    expect(PRESETS).toEqual([25, 50]);
  });
});
