import { brownNoise, pinkNoise } from './noise';
import { scheduleSpecs, type RecipeCtx, type ToneSpec, type NoiseSpec } from './recipes';
import type { GainLike } from './engine';
import type { BedId } from './beds';

/** What the engine hands the player once it is awake and armed. */
export interface AmbienceAudio {
  ctx: RecipeCtx;
  bus: GainLike;
  /** The engine's shared looping white-noise buffer. */
  noise: unknown;
}

type AmbienceAudioProvider = () => AmbienceAudio | null;

interface Voice {
  setLevel(level: number): void;
  stop(): void;
}

interface StoppableLike {
  stop(when?: number): unknown;
}
interface DisconnectableLike {
  disconnect?: () => void;
}

/**
 * One bed voice at a time, all procedural, all local. The engine's shared
 * white buffer is reshaped per bed through filters; brown and pink are
 * rendered once per context and looped; fire sparks and bird chirps come
 * from small interval feeds that schedule strictly on the audio clock.
 */
export function createAmbiencePlayer(getAudio: AmbienceAudioProvider) {
  let voice: Voice | null = null;
  let current: BedId | null = null;
  let level = 0.5;
  let brownBuffer: unknown = null;
  let pinkBuffer: unknown = null;

  const OUT = 0.28; // bed output before the master's own say
  const TAU = 0.4; // seconds — level changes glide, never jump

  const renderBuffer = (ctx: RecipeCtx, fill: (n: number) => Float32Array): unknown => {
    const n = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    buf.getChannelData(0).set(fill(n));
    return buf;
  };

  const materialize = (audio: AmbienceAudio, bed: BedId): Voice => {
    const { ctx, bus } = audio;
    const stoppable: StoppableLike[] = [];
    const nodes: DisconnectableLike[] = [];
    const feeds: number[] = [];

    const track = <N>(node: N): N => {
      nodes.push(node as DisconnectableLike);
      return node;
    };
    const chain = (head: { connect(to: unknown): unknown }, ...mid: Array<unknown>): void => {
      let from: { connect(to: unknown): unknown } = head;
      for (const node of mid) {
        from.connect(node);
        from = node as { connect(to: unknown): unknown };
      }
      from.connect(bus);
    };
    const filterOf = (type: BiquadFilterType, freq: number, q = 0.7) => {
      const filter = track(ctx.createBiquadFilter());
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      return filter;
    };
    const srcOf = (buffer: unknown) => {
      const src = track(ctx.createBufferSource());
      src.buffer = buffer;
      src.loop = true;
      src.start();
      stoppable.push(src);
      return src;
    };

    const voiceGain = track(ctx.createGain());
    const setVoice = (next: number): void => {
      voiceGain.gain.setTargetAtTime(next * OUT, ctx.currentTime, TAU);
    };

    const brownLoop = (): unknown => {
      brownBuffer ??= renderBuffer(ctx, brownNoise);
      return brownBuffer;
    };
    const pinkLoop = (): unknown => {
      pinkBuffer ??= renderBuffer(ctx, pinkNoise);
      return pinkBuffer;
    };

    const rand = (min: number, max: number): number => min + Math.random() * (max - min);

    switch (bed) {
      case 'brown':
        chain(srcOf(brownLoop()), voiceGain);
        break;
      case 'pink':
        chain(srcOf(pinkLoop()), voiceGain);
        break;
      case 'rain':
        chain(srcOf(audio.noise), filterOf('lowpass', 3800), voiceGain);
        break;
      case 'forest':
        chain(srcOf(pinkLoop()), filterOf('highpass', 1400, 0.5), voiceGain);
        break;
      case 'ocean': {
        lfo(ctx, 0.08, 0.55 * level, voiceGain.gain, track, stoppable);
        chain(srcOf(pinkLoop()), filterOf('lowpass', 650), voiceGain);
        break;
      }
      case 'wind': {
        const filter = filterOf('bandpass', 500, 1.1);
        lfo(ctx, 0.07, 260, filter.frequency, track, stoppable);
        chain(srcOf(pinkLoop()), filter, voiceGain);
        break;
      }
      case 'cafe': {
        chain(srcOf(brownLoop()), filterOf('lowpass', 480), voiceGain);
        break;
      }
      case 'fire': {
        chain(srcOf(brownLoop()), filterOf('lowpass', 800), voiceGain);
        feed(feeds, 120, () => {
          const spark: NoiseSpec = {
            kind: 'noise',
            startAt: rand(0, 0.25),
            duration: 0.045,
            gain: rand(0.1, 0.22),
            attack: 0.004,
            filter: { type: 'bandpass', freq: rand(2600, 5000), q: 1.5 },
          };
          scheduleSpecs(ctx, voiceGain, [spark], { noiseBuffer: audio.noise });
        });
        break;
      }
      case 'birds': {
        chain(srcOf(pinkLoop()), filterOf('lowpass', 900), voiceGain);
        feed(feeds, 700, () => {
          if (Math.random() > 0.35) return;
          const chirps: ToneSpec[] = [];
          const count = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < count; i++) {
            chirps.push({
              kind: 'tone',
              freq: rand(2400, 4000),
              type: 'sine',
              startAt: i * rand(0.07, 0.16),
              duration: rand(0.07, 0.13),
              gain: rand(0.08, 0.16),
              attack: 0.004,
              detuneCents: rand(-30, 30),
            });
          }
          scheduleSpecs(ctx, voiceGain, chirps);
        });
        break;
      }
    }

    return {
      setLevel: setVoice,
      stop(): void {
        for (const id of feeds) clearInterval(id);
        feeds.length = 0;
        const now = ctx.currentTime;
        // ring out: gain falls first, sources die on the next beat
        voiceGain.gain.setTargetAtTime(0, now, 0.12);
        for (const s of stoppable) {
          try {
            s.stop(now + 0.3);
          } catch {
            /* a stopped voice stays stopped */
          }
        }
        // long enough for the master to fall quiet, short enough to forget
        setTimeout(() => {
          for (const n of nodes) {
            try {
              n.disconnect?.();
            } catch {
              /* already gone */
            }
          }
        }, 450);
      },
    };
  };

  const player = {
    play(bed: BedId, nextLevel?: number): void {
      if (nextLevel !== undefined) level = nextLevel;
      if (current === bed && voice) {
        voice.setLevel(level);
        return;
      }
      player.stop();
      const audio = getAudio();
      if (!audio) return;
      current = bed;
      voice = materialize(audio, bed);
      voice.setLevel(level);
    },
    setLevel(next: number): void {
      level = next;
      voice?.setLevel(next);
    },
    stop(): void {
      voice?.stop();
      voice = null;
      current = null;
    },
  };

  return player;
}

function feed(into: number[], everyMs: number, fn: () => void): void {
  into.push(setInterval(fn, everyMs));
}

function lfo(
  ctx: RecipeCtx,
  hz: number,
  depth: number,
  target: { value: number },
  track: <N>(node: N) => N,
  stoppable: StoppableLike[],
): void {
  const osc = track(ctx.createOscillator());
  osc.type = 'sine';
  osc.frequency.value = hz;
  const depthGain = track(ctx.createGain());
  depthGain.gain.value = depth;
  osc.connect(depthGain);
  depthGain.connect(target);
  osc.start();
  stoppable.push(osc);
}
