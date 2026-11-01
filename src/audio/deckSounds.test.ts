import { describe, expect, it, vi } from 'vitest';
import { hoverTick, softClick, type BuffSourceLike, type BiquadLike, type OscLike, type RecipeCtx } from './recipes';
import { type GainLike } from './engine';
import { playDeck, type DeckArm } from './deckSounds';

/** Only the slice deck sounds need: oscillator starts on the clock. */
const armWith = (
  state: 'running' | 'suspended' | 'closed',
  now = 12,
): DeckArm & { starts: unknown } => {
  const starts: Array<number | undefined> = [];
  const ctx: RecipeCtx = {
    state,
    currentTime: now,
    sampleRate: 48000,
    resume: () => Promise.resolve(),
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
    destination: {},
    createGain: () => ({ gain: param(), connect: () => undefined }),
    createOscillator: (): OscLike => {
      const osc: OscLike = {
        type: 'sine',
        frequency: param(),
        detune: param(),
        connect: () => undefined,
        start: (w?: number) => {
          starts.push(w);
          return undefined;
        },
        stop: () => undefined,
      };
      return osc;
    },
    createBiquadFilter: (): BiquadLike => ({
      type: 'lowpass',
      frequency: param(),
      Q: param(),
      connect: () => undefined,
    }),
    createBufferSource: (): BuffSourceLike => ({
      buffer: null,
      loop: false,
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
    }),
    createDynamicsCompressor: () => ({ connect: () => undefined }),
    createBuffer: (_c: number, n: number, _r: number) => ({
      getChannelData: () => new Float32Array(n),
    }),
  };
  const bus: GainLike = { gain: param(), connect: () => undefined };
  return { ctx, bus, starts: starts };
};

const param = () => ({
  value: 0,
  setValueAtTime: () => undefined,
  linearRampToValueAtTime: () => undefined,
  exponentialRampToValueAtTime: () => undefined,
  setTargetAtTime: () => undefined,
});

describe('the deck sounds', () => {
  it('speaks the recipe on a running clock', () => {
    const arm = armWith('running');
    playDeck(arm, hoverTick);
    expect((arm.starts as Array<number | undefined>).length).toBe(1);
  });

  it('waits politely on a suspended context — hover is not a gesture', () => {
    const arm = armWith('suspended');
    playDeck(arm, hoverTick);
    expect((arm.starts as Array<number | undefined>).length).toBe(0);
  });

  it('stays silent when the page has no engine to ride', () => {
    const arm = armWith('running');
    expect(() => {
      playDeck(null, softClick);
      playDeck({ ...arm, ctx: { ...arm.ctx, state: 'closed' } }, softClick);
    }).not.toThrow();
    expect((arm.starts as Array<number | undefined>).length).toBe(0);
  });
});
