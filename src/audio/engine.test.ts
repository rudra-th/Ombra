import { describe, expect, it, vi } from 'vitest';
import { createSoundEngine, type EngineDeps, type GainLike } from './engine';

class FakeGain implements GainLike {
  values: number[] = [];
  gain = {
    setTargetAtTime: (value: number, _start?: number, _tau?: number): void => {
      this.values.push(value);
    },
  };
  connect(_to: unknown): unknown {
    return this;
  }
}

class FakeCtx {
  state: 'running' | 'suspended' | 'closed' = 'suspended';
  currentTime = 1.25;
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  destination = {};
  createGain = vi.fn((): FakeGain => new FakeGain());
  createDynamicsCompressor = vi.fn(() => ({
    connect: (_to: unknown) => {},
  }));
  gains(): FakeGain[] {
    return this.createGain.mock.results.map((r) => r.value as FakeGain);
  }
}

type Hook = (arg: unknown) => void;
const makeDeps = () => {
  const ctx = new FakeCtx();
  let gestureHook: Hook | null = null;
  let visibilityHook: Hook | null = null;
  const deps: EngineDeps = {
    makeContext: () => ctx,
    gesture: (cb) => {
      gestureHook = cb as Hook;
      return () => {
        gestureHook = null;
      };
    },
    visibility: (cb) => {
      visibilityHook = cb as Hook;
      return () => {
        visibilityHook = null;
      };
    },
  };
  const fire = {
    gesture: (kind: string) => gestureHook?.(kind),
    visibility: (v: string) => visibilityHook?.(v),
  };
  return { ctx, deps, fire };
};

describe('createSoundEngine', () => {
  it('creates no context until the first user gesture', () => {
    const { ctx, deps } = makeDeps();
    const makeContext = vi.fn(deps.makeContext);
    const engine = createSoundEngine({ ...deps, makeContext });
    engine.setPower(true, 0.3);
    engine.arm();
    expect(makeContext).not.toHaveBeenCalled();
    expect(engine.context()).toBeNull();
    expect(ctx.state).toBe('suspended');
  });

  it('wakes on keydown: context built and resumed for real', async () => {
    const { ctx, deps, fire } = makeDeps();
    const engine = createSoundEngine(deps);
    engine.setPower(true, 0.3);
    engine.arm();
    fire.gesture('keydown');
    const live = engine.context();
    expect(live).toBe(ctx);
    await vi.waitFor(() => expect(ctx.resume).toHaveBeenCalled());
    expect(live ?? ctx).not.toBeNull();
    expect(engine.state()).toBe('running');
  });

  it('wakes on pointerdown as well, exactly once', () => {
    const { deps, fire } = makeDeps();
    const makeContext = vi.fn(() => new FakeCtx());
    const engine = createSoundEngine({ ...deps, makeContext });
    engine.arm();
    fire.gesture('pointerdown');
    fire.gesture('pointerdown');
    fire.gesture('keydown');
    expect(makeContext).toHaveBeenCalledTimes(1);
  });

  it('applies volume to the master gain when power is on', async () => {
    const { deps, fire } = makeDeps();
    const engine = createSoundEngine(deps);
    engine.setPower(true, 0.3);
    engine.arm();
    fire.gesture('keydown');
    await vi.waitFor(() => expect(engine.state()).toBe('running'));
    engine.setPower(true, 0.6);
    const last = (engine.context() as FakeCtx).gains()[0]?.values.at(-1);
    expect(last ?? Number.NaN).toBeCloseTo(0.6);
  });

  it('mute target is zero when power is off', async () => {
    const { deps, fire } = makeDeps();
    const engine = createSoundEngine(deps);
    engine.setPower(false, 0.3);
    engine.arm();
    fire.gesture('keydown');
    await vi.waitFor(() => expect(engine.state()).toBe('running'));
    const last = (engine.context() as FakeCtx).gains()[0]?.values.at(-1);
    expect(last ?? Number.NaN).toBe(0);
  });

  it('suspending on hide preserves nothing about power choice', () => {
    const { ctx, deps, fire } = makeDeps();
    const engine = createSoundEngine(deps);
    engine.setPower(false, 0.3);
    engine.arm();
    fire.gesture('keydown');
    fire.visibility('hidden');
    expect(ctx.suspend).toHaveBeenCalled();
    fire.visibility('visible');
    expect(ctx.resume).toHaveBeenCalled();
  });

  it('does nothing on visibility changes until a context exists', () => {
    const { deps, fire } = makeDeps();
    const engine = createSoundEngine(deps);
    engine.arm();
    expect(() => fire.visibility('hidden')).not.toThrow();
    expect(engine.context()).toBeNull();
  });
});
