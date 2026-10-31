/**
 * Procedural noise beds — the hearth of local-first audio. No samples, no
 * network: brown and pink are classical filters over random draws, rendered
 * once and looped as buffers.
 */
export type Random = () => number;

export const TARGET_RMS = 0.25;

/** Plain white noise, ±1. */
export function whiteNoise(n: number, rng: Random = Math.random): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = rng() * 2 - 1;
  }
  return out;
}

const scaleTo = (buf: Float32Array, target: number): Float32Array => {
  let sum = 0;
  for (const v of buf) sum += v * v;
  const current = Math.sqrt(sum / buf.length);
  if (current === 0) return buf;
  const gain = target / current;
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.min(1, Math.max(-1, buf[i]! * gain));
  }
  return buf;
};

/** Leaky integrator over white — the low, heavy rumble of brown noise. */
export function brownNoise(n: number, rng: Random = Math.random): Float32Array {
  const out = new Float32Array(n);
  let x = 0;
  for (let i = 0; i < n; i++) {
    // leak of 0.003 keeps DC mean-reverting (unclamped integration pins at ±1)
    x = 0.997 * x + 0.1 * (rng() * 2 - 1);
    out[i] = Math.min(1, Math.max(-1, x));
  }
  return scaleTo(out, TARGET_RMS);
}

/** Paul Kellet's economic pink filter — between brown and white. */
export function pinkNoise(n: number, rng: Random = Math.random): Float32Array {
  const out = new Float32Array(n);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < n; i++) {
    const white = rng() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0760749;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329007;
    b5 = -0.7616 * b5 - white * 0.016898;
    out[i] = Math.min(
      1,
      Math.max(-1, (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11),
    );
    b6 = white * 0.115926;
  }
  return scaleTo(out, TARGET_RMS);
}
