import { useEffect, useRef, useState } from 'react';
import { PATTERNS, phaseAt, type PatternId, type BreathAt } from './store';
import { useSettings } from '../../state/settings';
import { phaseChime, scheduleSpecs } from '../../audio/recipes';
import { getSoundEngine } from '../../audio/bridge';
import type { RecipeCtx } from '../../audio/recipes';

const ORDER: PatternId[] = ['box', '478', 'triangle'];

/** The ritual: three shapes, one ring, chimes only where breath turns. */
export function Breath() {
  const settings = useSettings();
  const [patternId, setPatternId] = useState<PatternId>('box');
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase | null>(null);
  const lastKind = useRef<BreathAt['kind'] | null>(null);

  useEffect(() => {
    if (!running) {
      setPhase(null);
      lastKind.current = null;
      return;
    }
    const pattern = PATTERNS[patternId];
    const cycle = pattern.segments.reduce((a, s) => a + s, 0);
    const t0 = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const t = (now - t0) / 1000;
      const at = phaseAt(pattern, t);
      const nextCycle = Math.floor(t / cycle);
      const prev = lastKind.current;
      setPhase((cur) =>
        cur && cur.index === at.index && cur.cycle === nextCycle
          ? cur
          : {
              cycle: nextCycle,
              index: at.index,
              kind: at.kind,
              span: pattern.segments[at.index] ?? 1,
            },
      );

      if (prev !== at.kind && (at.kind === 'in' || at.kind === 'out')) {
        if (settings.sound.enabled) {
          const engine = getSoundEngine();
          const ctx = engine.context() as unknown as RecipeCtx | null;
          const master = engine.bus();
          if (ctx && master) {
            scheduleSpecs(ctx, master.masterGain, phaseChime(at.kind === 'in' ? 'in' : 'out'));
          }
        }
      }
      lastKind.current = at.kind;

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running, patternId, settings.sound.enabled]);

  const pattern = PATTERNS[patternId];

  return (
    <section className="widget" aria-label="Breath">
      <p className="widget-label">Breath</p>
      <div className="breath-patterns" role="radiogroup" aria-label="Pattern">
        {ORDER.map((id) => (
          <button
            type="button"
            key={id}
            role="radio"
            aria-checked={patternId === id}
            className={`sound-bed${patternId === id ? ' sound-bed-active' : ''}`}
            onClick={() => setPatternId(id)}
          >
            {PATTERNS[id].name}
          </button>
        ))}
      </div>
      <div className={`breath-stage${running ? ' breath-live' : ''}`}>
        <div className="breath-halo" aria-hidden="true" />
        {phase && (
          <div
            key={`${phase.cycle}-${phase.index}`}
            className={`breath-ring breath-${phase.kind}`}
            style={{ animationDuration: `${phase.span}s` }}
            aria-hidden="true"
          />
        )}
        <p className="breath-copy" aria-live="polite">
          {phase
            ? phase.kind === 'in'
              ? 'breathe in'
              : phase.kind === 'out'
                ? 'breathe out'
                : 'stay'
            : 'a minute of stillness'}
        </p>
      </div>
      <button
        type="button"
        className="widget-trigger breath-toggle"
        onClick={() => setRunning((r) => !r)}
        aria-pressed={running}
      >
        {running ? '✕ stop' : `begin ${pattern.name}`}
      </button>
    </section>
  );
}

interface Phase {
  /** which cycle we are in, for animation keys */
  cycle: number;
  index: number;
  kind: BreathAt['kind'];
  /** seconds the phase lasts — the ring animates to exactly this */
  span: number;
}
