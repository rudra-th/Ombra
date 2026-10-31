import { describe, expect, it, vi, type Mock } from 'vitest';
import { createAmbiencePlayer, type AmbienceAudio } from './player';
import { type RecipeCtx, type OscLike, type BiquadLike } from './recipes';
import type { GainLike, AudioParamLike, BufferLike, CtxLike } from './engine';

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
  setTargetAtTime(v: number, _start: number, _tau: number): void {
    this.events.push({ kind: 'target', value: v, at: Number.NaN });
  }
}

const target = (p: RecordingParam): number | undefined =>
  p.events.filter((e) => e.kind === 'target').at(-1)?.value;

class Node implements GainLike {
  kind: string;
  constructor(kind: string = 'node') {
    this.kind = kind;
  }
  gain = new RecordingParam(0);
  Q = new RecordingParam(0.7);
  detune = new RecordingParam(0);
  frequency = new RecordingParam(350);
  buffer: unknown = null;
  loop = false;
  type: OscillatorType | BiquadFilterType = 'sine';
  connect(_to: unknown): unknown {
    return this;
  }
  start = vi.fn();
  stop = vi.fn();
  disconnect = vi.fn();
}

interface Harness {
  audio: AmbienceAudio;
  graph: Node[];
}

const makeAudio = (now = 2): Harness => {
  const graph: Node[] = [];
  const bus = new Node();
  const noise: BufferLike = { getChannelData: () => new Float32Array(4) };
  const ctx: RecipeCtx = {
    state: 'running',
    currentTime: now,
    sampleRate: 48000,
    resume: () => Promise.resolve(),
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
    destination: {},
    createGain: () => {
      const n = new Node('gain');
      graph.push(n);
      return n;
    },
    createOscillator: (): OscLike => {
      const n = new Node('osc');
      graph.push(n);
      return n as unknown as OscLike;
    },
    createBiquadFilter: (): BiquadLike => {
      const n = new Node('filter');
      graph.push(n);
      return n as unknown as BiquadLike;
    },
    createBufferSource: () => {
      const n = new Node('source');
      graph.push(n);
      return n;
    },
    createDynamicsCompressor: () => new Node('comp'),
    createBuffer: (_c: number, length: number, _r: number): BufferLike => ({
      getChannelData: () => new Float32Array(length),
    }),
  };
  const audio: AmbienceAudio = { ctx, bus, noise };
  return { audio, graph };
};

const asMock = (fn: unknown): Mock => fn as Mock;
const kind = (graph: Node[], n: string): Node[] =>
  graph.filter((node) => node.kind === n);

describe('createAmbiencePlayer', () => {
  it('loops a procedural buffer when brown is asked for', () => {
    const { audio, graph } = makeAudio();
    const player = createAmbiencePlayer(() => audio);
    player.play('brown', 0.5);
    const src = kind(graph, 'source')[0] as Node;
    expect(src.loop).toBe(true);
    expect(src.buffer).not.toBeNull();
  });

  it('stops the previous voice on a bed switch', () => {
    const { audio, graph } = makeAudio();
    const player = createAmbiencePlayer(() => audio);
    player.play('pink', 0.5);
    const first = kind(graph, 'source')[0] as Node;
    player.play('ocean', 0.5);
    expect(kind(graph, 'source')).toHaveLength(2);
    expect(asMock(first.stop).mock.calls.length).toBeGreaterThan(0);
  });

  it('stops with a clean hand when the mixer closes', () => {
    const { audio, graph } = makeAudio();
    const player = createAmbiencePlayer(() => audio);
    player.play('rain', 0.5);
    player.stop();
    const stops = asMock(kind(graph, 'source')[0]!.stop).mock.calls.length;
    expect(stops).toBeGreaterThan(0);
  });

  it('no-ops on a change when no audio exists yet', () => {
    const player = createAmbiencePlayer(() => null);
    expect(() => player.play('wind', 0.5)).not.toThrow();
    expect(() => player.stop()).not.toThrow();
  });

  it('rides the bed level with setTargetAtTime, not jumps', () => {
    const { audio, graph } = makeAudio();
    const player = createAmbiencePlayer(() => audio);
    player.play('forest', 0.4);
    const voiceGain = kind(graph, 'gain')[0] as Node;
    expect(target(voiceGain.gain)).toBeCloseTo(0.4 * 0.28);
    player.setLevel(0.8);
    expect(target(voiceGain.gain)).toBeCloseTo(0.8 * 0.28);
  });
});

