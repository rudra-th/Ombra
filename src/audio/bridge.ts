import { createSoundEngine, type SoundEngine } from './engine';
import { createAmbiencePlayer } from './player';
import type { AmbienceAudio } from './player';
import type { RecipeCtx } from './recipes';
import type { AudioParamLike, BufferLike, GainLike } from './engine';

let engine: SoundEngine | null = null;
let player: ReturnType<typeof createAmbiencePlayer> | null = null;

/** The tab's one engine, fed by real listeners and a real context. */
export function getSoundEngine(): SoundEngine {
  engine ??= createSoundEngine({
    makeContext: makeContext,
    gesture: (cb) => {
      const on = (evt: Event) => {
        if (evt.type === 'pointerdown' || evt.type === 'keydown') cb(evt.type);
      };
      window.addEventListener('pointerdown', on);
      window.addEventListener('keydown', on);
      return () => {
        window.removeEventListener('pointerdown', on);
        window.removeEventListener('keydown', on);
      };
    },
    visibility: (cb) => {
      const on = () => cb(document.visibilityState);
      document.addEventListener('visibilitychange', on);
      return () => document.removeEventListener('visibilitychange', on);
    },
  });
  return engine;
}

/** The tab's one mixer, fed by the engine's own context and bus. */
export function getSoundPlayer(): ReturnType<typeof createAmbiencePlayer> {
  player ??= createAmbiencePlayer(() => ambienceAudio());
  return player;
}

function ambienceAudio(): AmbienceAudio | null {
  const live = getSoundEngine();
  // the page's context is the real thing: full Web Audio beneath CtxLike
  const ctx = live.context() as unknown as RecipeCtx | null;
  const master = live.bus();
  const noise = live.noiseBuffer();
  // beds voice into the master gain directly; the deck rides the same bus
  return ctx && master && noise
    ? { ctx, bus: master.masterGain, noise }
    : null;
}

/**
 * Chrome names it one way, Safari another; harness windows may have none.
 * A context that cannot exist stays a silent stub so the surface never
 * breaks for missing audio.
 */
function makeContext(): RecipeCtx {
  const holder = window as unknown as {
    AudioContext?: new () => AudioContext;
    webkitAudioContext?: new () => AudioContext;
  };
  const Ctx = holder.AudioContext ?? holder.webkitAudioContext;
  return Ctx ? (new Ctx() as unknown as RecipeCtx) : deadContext();
}

/** Shapes only — nothing it powers can ever make a sound. */
function deadContext(): RecipeCtx {
  const param = (): AudioParamLike => ({
    value: 0,
    setValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
    setTargetAtTime: () => undefined,
  });
  const gain = (): GainLike => ({ gain: param(), connect: () => undefined });
  return {
    state: 'closed',
    currentTime: 0,
    sampleRate: 48000,
    resume: () => Promise.resolve(),
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
    destination: {},
    createGain: gain,
    createOscillator: () => ({
      type: 'sine',
      frequency: param(),
      detune: param(),
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
    }),
    createBiquadFilter: () => ({
      type: 'lowpass',
      frequency: param(),
      Q: param(),
      connect: () => undefined,
    }),
    createBufferSource: () => ({
      buffer: null,
      loop: false,
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
    }),
    createBuffer: (_c: number, n: number, _r: number): BufferLike => ({
      getChannelData: () => new Float32Array(n),
    }),
    createDynamicsCompressor: () => ({ connect: () => undefined }),
  };
}
