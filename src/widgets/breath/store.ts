/** A breath pattern lists its phases in seconds: in, hold, out, (hold2). */
export interface Pattern {
  name: string;
  segments: number[];
}

export const PATTERNS = {
  box: { name: 'box', segments: [4, 4, 4, 4] },
  '478': { name: '4-7-8', segments: [4, 7, 8] },
  triangle: { name: 'triangle', segments: [4, 4, 4] },
} as const satisfies Record<string, Pattern>;

export type PatternId = keyof typeof PATTERNS;

export interface BreathAt {
  index: number;
  kind: 'in' | 'hold' | 'out' | 'hold2';
  /** Seconds left in the phase. */
  remains: number;
}

const KINDS: BreathAt['kind'][] = ['in', 'hold', 'out', 'hold2'];

/** Where a second count lands in a breath cycle, cycling exactly. */
export function phaseAt(pattern: Pattern, t: number): BreathAt {
  const cycle = pattern.segments.reduce((a, s) => a + s, 0);
  let into = ((t % cycle) + cycle) % cycle;
  for (let index = 0; index < pattern.segments.length; index++) {
    const span = pattern.segments[index]!;
    if (into < span) {
      return {
        index,
        kind: KINDS[index] ?? 'in',
        remains: Math.max(0, span - into),
      };
    }
    into -= span;
  }
  // unreachable — modulo keeps `into` under the cycle sum
  return { index: 0, kind: 'in', remains: 0 };
}
