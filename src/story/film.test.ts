import { describe, expect, it } from 'vitest';
import {
  BEATS,
  CENTER_PROGRESSES,
  TOTAL_FRAMES,
  beatAt,
  chromeAt,
  emaMs,
  frameAt,
  qualityOf,
  snapTarget,
  timecode,
} from './film';

describe('the clock', () => {
  it('quantizes progress onto 24 film frames', () => {
    expect(TOTAL_FRAMES).toBe(252); // 10.5s at 24fps
    expect(frameAt(0)).toBe(0);
    expect(frameAt(0.5)).toBe(126);
    expect(frameAt(1)).toBe(TOTAL_FRAMES - 1);
    expect(frameAt(-0.2)).toBe(0);
    expect(frameAt(1.4)).toBe(TOTAL_FRAMES - 1);
    expect(frameAt(Number.NaN)).toBe(0);
  });

  it('stamps the HUD as MM:SS:FF', () => {
    expect(timecode(0)).toBe('00:00:00');
    expect(timecode(126)).toBe('00:05:06'); // 5s + 6 frames
    expect(timecode(TOTAL_FRAMES - 1)).toBe('00:10:11');
  });
});

describe('the three beats', () => {
  it('spans the track with crossfade overlaps, none beyond five', () => {
    expect(BEATS.length).toBe(3);
    BEATS.forEach((beat, i) => {
      expect(beat.from).toBeLessThan(beat.to);
      if (i > 0) expect(beat.from).toBeLessThan(BEATS[i - 1]!.to);
    });
    expect(BEATS[0]!.from).toBe(0);
    expect(BEATS[BEATS.length - 1]!.to).toBe(1);
  });

  it('hands the scene over when each new beat begins', () => {
    expect(beatAt(0)).toBe(0);
    expect(beatAt(0.3)).toBe(0);
    expect(beatAt(0.36)).toBe(1); // drift enters as its crossfade starts
    expect(beatAt(0.5)).toBe(1);
    expect(beatAt(0.64)).toBe(2);
    expect(beatAt(0.9)).toBe(2);
    expect(beatAt(-0.5)).toBe(0);
    expect(beatAt(1.2)).toBe(2);
  });
});

describe('cinema chrome', () => {
  it('settles to its rest at zero speed', () => {
    const c = chromeAt(0);
    expect(c.bars).toBeCloseTo(0.05);
    expect(c.vignette).toBeCloseTo(0.45);
  });

  it('breathes wider with speed and never past the cap', () => {
    const slow = chromeAt(0.4);
    const fast = chromeAt(2);
    const over = chromeAt(9);
    expect(slow.bars).toBeGreaterThan(0.05);
    expect(fast.bars).toBeGreaterThan(slow.bars);
    expect(fast.vignette).toBeGreaterThan(slow.vignette);
    expect(over.bars).toBeLessThanOrEqual(0.2);
    expect(over.vignette).toBeLessThanOrEqual(1);
  });
});

describe('the weak magnet', () => {
  const span = 800; // px viewport
  const length = 2000; // px scrollable
  const at = (p: number) => p * length;

  it('offers a beat center only within its window', () => {
    expect(snapTarget(at(0.385), length, span)).toBeNull(); // between beats
    expect(snapTarget(at(0.27), length, span)).toBeCloseTo(at(CENTER_PROGRESSES[0]!));
    expect(snapTarget(at(0.55), length, span)).toBeCloseTo(at(CENTER_PROGRESSES[1]!));
  });

  it('parks the film at its resolve', () => {
    expect(snapTarget(at(0.94), length, span)).toBeCloseTo(at(CENTER_PROGRESSES[3]!));
  });

  it('never offers a point beyond the track', () => {
    const far = snapTarget(at(1.5), length, span);
    expect(far === null || far <= length).toBe(true);
  });
});

describe('adaptive quality', () => {
  it('drops below 45 fps and climbs back above 56', () => {
    expect(qualityOf(30, 'high')).toBe('low');
    expect(qualityOf(50, 'low')).toBe('low'); // hysteresis band holds
    expect(qualityOf(58, 'low')).toBe('high');
    expect(qualityOf(90, 'high')).toBe('high');
  });

  it('smooths frame time exponentially', () => {
    const warmed = emaMs(100, 16.7, 0.2);
    expect(warmed).toBeGreaterThan(16.7);
    expect(warmed).toBeLessThan(100);
    expect(emaMs(16.7, 16.7, 0.2)).toBeCloseTo(16.7);
  });
});
