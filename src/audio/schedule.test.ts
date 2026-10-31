import { describe, expect, it, vi, type Mock } from 'vitest';
import {
  hoverTick,
  scheduleSpecs,
  whoosh,
  type BuffSourceLike,
  type BiquadLike,
  type OscLike,
  type RecipeCtx,
} from './recipes';
import { type AudioParamLike, type BufferLike, type GainLike } from './engine';

class RecordingParam implements AudioParamLike {
  events: Array<{ kind: string; value: number; at: number }> = [];
  value: number;
  constructor(base: number) {
    this.value = base;
  }
  setValueAtTime(v: number, when: number): unknown {
    this.events.push({ kind: 'set', value: v, at: when });
    return undefined;
  }
  linearRampToValueAtTime(v: number, when: number): unknown {
    this.events.push({ kind: 'lin', value: v, at: when });
    return undefined;
  }
  exponentialRampToValueAtTime(v: number, when: number): unknown {
    this.events.push({ kind: 'exp', value: v, at: when });
    return undefined;
  }
  setTargetAtTime(_v: number, _start: number, _tau: number): void {}
}

const flatten = (param: RecordingParam): string =>
  param.events.map((e) => `${e.kind}:${e.value}@${e.at.toFixed(3)}`).join(' ');

/**vi.fn's type hides itself behind the structural node interfaces. */
const asMock = (fn: unknown): Mock => fn as Mock;
const firstArg = (mock: Mock, i = 0): number => mock.mock.calls[i]![0] as number;

class FakeGain implements GainLike {
  gain = new RecordingParam(0);
  connect(_to: unknown): unknown {
    return this;
  }
}

interface FakeGraph {
  oscs: OscLike[];
  filters: BiquadLike[];
  sources: BuffSourceLike[];
  gains: FakeGain[];
}

const makeCtx = (now = 5): RecipeCtx & { created: FakeGraph } => {
  const graph: FakeGraph = { oscs: [], filters: [], sources: [], gains: [] };
  const ctx: RecipeCtx = {
    state: 'running',
    currentTime: now,
    sampleRate: 48000,
    resume: () => Promise.resolve(),
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
    destination: {},
    createOscillator: (): OscLike => {
      const osc = {
        type: 'sine' as OscillatorType,
        frequency: new RecordingParam(440),
        detune: new RecordingParam(0),
        connect: () => undefined,
        start: vi.fn(),
        stop: vi.fn(),
      };
      graph.oscs.push(osc);
      return osc;
    },
    createBiquadFilter: (): BiquadLike => {
      const filter = {
        type: 'lowpass' as BiquadFilterType,
        frequency: new RecordingParam(350),
        Q: new RecordingParam(0.7),
        connect: () => undefined,
      };
      graph.filters.push(filter);
      return filter;
    },
    createBufferSource: (): BuffSourceLike => {
      const src = {
        buffer: null as unknown,
        loop: false,
        connect: () => undefined,
        start: vi.fn(),
        stop: vi.fn(),
      };
      graph.sources.push(src);
      return src;
    },
    createGain: (): FakeGain => {
      const g = new FakeGain();
      graph.gains.push(g);
      return g;
    },
    createDynamicsCompressor: () => ({
      connect: () => undefined,
    }),
    createBuffer: (_channels: number, length: number, _rate: number): BufferLike => ({
      getChannelData: (_ch: number) => new Float32Array(length),
    }),
  };
  return { ...ctx, created: graph };
};

const busLike = () => ({
  gain: new RecordingParam(0),
  connect: () => undefined,
});

describe('scheduleSpecs', () => {
  it('schedules a tone on the context clock with a no-click envelope', () => {
    const ctx = makeCtx(5);
    scheduleSpecs(ctx, busLike(), [
      {
        kind: 'tone',
        freq: 3200,
        type: 'sine',
        startAt: 0,
        duration: 0.032,
        gain: 0.045,
        attack: 0.002,
      },
    ]);
    const osc = ctx.created.oscs[0]!;
    expect(osc.type).toBe('sine');
    expect(osc.frequency.value).toBe(3200);
    // timeline dead-centers: env 0 → peak at attack → ring → 0 at stop
    const env = flatten(ctx.created.gains[0]!.gain as RecordingParam);
    expect(env).toBe(
      'set:0@5.000 lin:0.045@5.002 lin:0.027@5.017 lin:0@5.032',
    );
    expect(firstArg(asMock(osc.start))).toBeCloseTo(5, 5);
    expect(firstArg(asMock(osc.stop))).toBeCloseTo(5.032, 5);
  });

  it('routes the whoosh through a sweeping filter with noise', () => {
    const ctx = makeCtx(0);
    const noise: BufferLike = {
      getChannelData: () => new Float32Array(8),
    };
    scheduleSpecs(ctx, busLike(), whoosh(), { noiseBuffer: noise, now: 0 });
    const src = ctx.created.sources[0]!;
    expect(src.buffer).toBe(noise);
    expect(src.loop).toBe(true);
    expect(firstArg(asMock(src.start))).toBe(0);
    expect(firstArg(asMock(src.stop))).toBeCloseTo(0.3, 5);
    const filter = ctx.created.filters[0]!;
    expect(filter.type).toBe('bandpass');
    const sweep = flatten(filter.frequency as RecordingParam);
    expect(sweep).toBe('set:200@0.000 exp:2000@0.255');
  });

  it('moves explicit nows onto the clock for gates between scenes', () => {
    const ctx = makeCtx(0);
    scheduleSpecs(ctx, busLike(), hoverTick(), { now: 12.5 });
    const osc = ctx.created.oscs[0]!;
    expect(firstArg(asMock(osc.start))).toBeCloseTo(12.5, 5);
    const env = flatten(ctx.created.gains[0]!.gain as RecordingParam);
    expect(env).toContain('@12.500');
  });

  it('schedules nothing for an empty program', () => {
    const ctx = makeCtx(3);
    scheduleSpecs(ctx, busLike(), []);
    expect(ctx.created.oscs).toHaveLength(0);
    expect(ctx.created.gains).toHaveLength(0);
  });
});
