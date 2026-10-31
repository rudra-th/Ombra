import { describe, expect, it } from 'vitest';
import { PATTERNS, phaseAt } from './store';

describe('patterns', () => {
  it('ships box, 4-7-8 and triangle', () => {
    // integer-like keys enumerate first (JS object mechanics); order here
    // is structure, not sequence — the mixer presents them deliberately
    expect(Object.keys(PATTERNS)).toEqual(['478', 'box', 'triangle']);
  });

  it('describes each pattern in honest seconds', () => {
    expect(PATTERNS.box).toEqual({ name: 'box', segments: [4, 4, 4, 4] });
    expect(PATTERNS['478']).toEqual({ name: '4-7-8', segments: [4, 7, 8] });
    expect(PATTERNS.triangle).toEqual({ name: 'triangle', segments: [4, 4, 4] });
  });
});

describe('phaseAt', () => {
  const box = PATTERNS.box;

  it('starts a cycle on the inhale', () => {
    expect(phaseAt(box, 0)).toEqual({ index: 0, kind: 'in', remains: 4 });
  });

  it('walks in-hold-out-hold across one cycle', () => {
    expect(phaseAt(box, 2).kind).toBe('in');
    expect(phaseAt(box, 5).kind).toBe('hold');
    expect(phaseAt(box, 9).kind).toBe('out');
    expect(phaseAt(box, 14.5).kind).toBe('hold2');
  });

  it('remains counts down inside a phase', () => {
    expect(phaseAt(box, 2).remains).toBeCloseTo(2);
    expect(phaseAt(box, 6.5).remains).toBeCloseTo(1.5);
  });

  it('wraps cycles over and over without drift', () => {
    const cycle = box.segments.reduce((a, s) => a + s, 0); // 16s
    const wrapped = phaseAt(box, cycle * 3 + 2); // same beat as t=2
    expect(wrapped.index).toBe(phaseAt(box, 2).index);
    expect(wrapped.kind).toBe('in');
  });

  it('orders holds without overrunning the cycle length', () => {
    // triangle: 4/4/4 — no second hold
    const tri = PATTERNS.triangle;
    expect(phaseAt(tri, 8).kind).toBe('out');
    expect(phaseAt(tri, 12.5).kind).toBe('in'); // wrapped
    // 4-7-8: one true hold
    const p478 = PATTERNS['478'];
    expect(phaseAt(p478, 5).kind).toBe('hold');
    expect(phaseAt(p478, 11).kind).toBe('out');
  });
});
