import { whiteNoise } from './noise';

/** Structural slices of Web Audio so fakes and node types share one contract. */
export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, when: number): unknown;
  linearRampToValueAtTime(value: number, when: number): unknown;
  exponentialRampToValueAtTime(value: number, when: number): unknown;
  setTargetAtTime(value: number, startTime: number, timeConstant: number): void;
}

export interface GainLike {
  gain: AudioParamLike;
  connect(to: unknown): unknown;
}

export interface CompLike {
  connect(to: unknown): unknown;
}

export interface CtxLike {
  state: string;
  currentTime: number;
  sampleRate: number;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
  createGain(): GainLike;
  createDynamicsCompressor(): CompLike;
  createBuffer(channels: number, length: number, sampleRate: number): BufferLike;
  destination: unknown;
}

export interface BufferLike {
  getChannelData(ch: number): Float32Array;
}

export interface MasterBus {
  masterGain: GainLike;
  destination: unknown;
}

export interface EngineDeps {
  /** Real impl: `() => new AudioContext()`. Never called before a gesture. */
  makeContext: () => CtxLike;
  /**
   * Register the one-shot wake hook. Real impl listens on `window` for
   * `pointerdown`/`keydown`; wheel deliberately does not count (Chrome's
   * autoplay policy treats wheel as ambient scrolling, not intent).
   */
  gesture: (cb: (kind: 'pointerdown' | 'keydown') => void) => () => void;
  /** Real impl: `document.addEventListener('visibilitychange', ...)`. */
  visibility: (cb: (state: 'visible' | 'hidden') => void) => () => void;
}

export const VOLUME_TAU = 0.12;
const LOOKAHEAD_SECONDS = 0.15;

const createMaster = (ctx: CtxLike): MasterBus => {
  const masterGain = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  masterGain.connect(comp);
  comp.connect(ctx.destination);
  return { masterGain, destination: ctx.destination };
};

/**
 * The sound engine: lazy context, gestured wake, hidden-tab suspension, one
 * master gain the settings feed. Everything else in `src/audio` hangs off
 * the bus (`bus()`). Silent by design until power and a gesture both exist.
 */
export function createSoundEngine(deps: EngineDeps) {
  let ctx: CtxLike | null = null;
  let bus: MasterBus | null = null;
  let noise: BufferLike | null = null;
  let powered = false;
  let volume = 0.3;
  let armDetach: (() => void) | null = null;
  let visibilityDetach: (() => void) | null = null;
  let suspendedByHide = false;

  const applyVolume = () => {
    if (!bus || !ctx) return;
    const target = powered ? volume : 0;
    bus.masterGain.gain.setTargetAtTime(target, ctx.currentTime, VOLUME_TAU);
  };

  const wake = () => {
    if (ctx) return;
    ctx = deps.makeContext();
    bus = createMaster(ctx);
    applyVolume();

    const onVisibility = (state: 'visible' | 'hidden') => {
      if (!ctx) return;
      if (state === 'hidden') {
        suspendedByHide = ctx.state === 'running';
        if (suspendedByHide) void ctx.suspend();
      } else if (suspendedByHide) {
        suspendedByHide = false;
        void ctx.resume();
      }
    };
    visibilityDetach = deps.visibility(onVisibility);

    // A context made inside a gesture usually starts running, but Chrome has
    // moods; ask for running either way and re-apply the gain on arrival.
    if (ctx.state !== 'running') {
      void ctx.resume().then(() => applyVolume());
    }
  };

  const engine = {
    /** Install the gesture hook. Call once on mount, dispose on unmount. */
    arm() {
      if (armDetach) return;
      armDetach = deps.gesture(wake);
    },

    dispose() {
      armDetach?.();
      armDetach = null;
      visibilityDetach?.();
      visibilityDetach = null;
      if (ctx) {
        suspendedByHide = false;
        void ctx.close();
        ctx = null;
        bus = null;
      }
    },

    /** Settings sync. Power is a promise of sound; volume stays 0..1. */
    setPower(enabled: boolean, nextVolume: number) {
      const wasPowered = powered;
      powered = enabled;
      if (Number.isFinite(nextVolume)) {
        volume = Math.min(1, Math.max(0, nextVolume));
      }
      if (!powered && wasPowered && ctx) {
        if (suspendedByHide) void ctx.resume();
        suspendedByHide = false;
      }
      applyVolume();
    },

    bus(): MasterBus | null {
      return bus;
    },

    /**
     * The engine's single shared white-noise bed (2s, looped everywhere),
     * rendered once. Unless filters make it something else, noise is noise.
     */
    noiseBuffer(seconds = 2): BufferLike | null {
      if (noise || !ctx) return noise;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
      buf.getChannelData(0).set(whiteNoise(Math.floor(ctx.sampleRate * seconds)));
      noise = buf;
      return buf;
    },

    context(): CtxLike | null {
      return ctx;
    },

    state(): 'running' | 'suspended' | 'none' {
      if (!ctx) return 'none';
      return ctx.state === 'running' ? 'running' : 'suspended';
    },

    /** Clock slice recipes may use — look ahead this far, never later. */
    lookahead(): number {
      return LOOKAHEAD_SECONDS;
    },
  };

  return engine;
}

export type SoundEngine = ReturnType<typeof createSoundEngine>;
