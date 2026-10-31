import { describe, expect, it } from 'vitest';
import { DUST_HIGH, DUST_LOW, seedGrains, stepGrains } from './dust';

const one = () => 0.5;
const count = (n: number) => Array.from({ length: n }, (_, i) => i / n);

describe('the dust field', () => {
  it('scatters the requested count inside the frame', () => {
    const high = seedGrains(one, 1000, 800, DUST_HIGH);
    const low = seedGrains(one, 1000, 800, DUST_LOW);
    expect(high.length).toBe(DUST_HIGH);
    expect(low.length).toBe(Math.round(DUST_HIGH / 2));
    high.forEach((g) => {
      expect(g.x >= 0 && g.x < 1000).toBe(true);
      expect(g.y >= 0 && g.y < 800).toBe(true);
    });
  });

  it('drifts slowly and wraps at the edges, never teleports', () => {
    const grains = seedGrains(one, 100, 100, 3);
    const x0 = grains[0]!.x;
    const y0 = grains[0]!.y;
    stepGrains(grains, 1 / 24, 100, 100);
    const g = grains[0]!;
    expect(Math.abs(g.x - x0)).toBeLessThan(2);
    expect(Math.abs(g.y - y0)).toBeLessThan(2);
  });

  it('wraps a grain that exits the right edge to the left side', () => {
    const grains = count(2).map(() => seedGrains(one, 100, 100, 1)[0]!);
    grains[0]!.x = 99.9;
    grains[0]!.vx = 40;
    stepGrains(grains, 1 / 24, 100, 100);
    expect(grains[0]!.x < 100).toBe(true);
    expect(grains[1]!.x >= 0).toBe(true);
  });
});
