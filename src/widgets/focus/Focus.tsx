import { useEffect, useState } from 'react';
import {
  PRESETS,
  fmtClock,
  remaining,
  sessionEnd,
} from './store';
import { useSettings } from '../../state/settings';
import { boundaryChime, scheduleSpecs } from '../../audio/recipes';
import { getSoundEngine } from '../../audio/bridge';
import type { RecipeCtx } from '../../audio/recipes';

/** an unhurried block: two lengths, +5 nudge, one finishing chime. */
export function Focus() {
  const settings = useSettings();
  const [minutes, setMinutes] = useState<number>(25);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [left, setLeft] = useState<number>(25 * 60);

  // one interval against the wall clock; visibility pauses never lie
  useEffect(() => {
    if (endAt === null) return;
    setLeft(remaining(endAt, Date.now()));
    const id = window.setInterval(() => {
      const leftNow = remaining(endAt, Date.now());
      setLeft(leftNow);
      if (leftNow === 0) {
        setEndAt(null);
        if (settings.sound.enabled) {
          const engine = getSoundEngine();
          const ctx = engine.context() as unknown as RecipeCtx | null;
          const master = engine.bus();
          if (ctx && master) {
            scheduleSpecs(ctx, master.masterGain, boundaryChime());
          }
        }
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [endAt, settings.sound.enabled]);

  const begin = (m: number) => {
    setMinutes(m);
    setEndAt(sessionEnd(m, Date.now()));
    setLeft(m * 60);
  };
  const nudge = () => {
    const next = Math.min(120, minutes + 5);
    setMinutes(next);
    if (endAt !== null) {
      // extend a live session rather than restart it
      setEndAt((e) => (e ?? 0) + 5 * 60_000);
      setLeft(next * 60);
    }
  };
  const stop = () => setEndAt(null);

  const running = endAt !== null;

  return (
    <section className="widget" aria-label="Focus">
      <p className="widget-label">Focus</p>
      {running ? (
        <>
          <p className="focus-clock tnum" aria-live="off">
            {fmtClock(left)}
          </p>
          <button type="button" className="widget-trigger" onClick={stop}>
            ✕ stop
          </button>
          <button type="button" className="widget-trigger" onClick={nudge}>
            +5 min
          </button>
        </>
      ) : (
        <>
          <div className="breath-patterns" role="group" aria-label="Length">
            {PRESETS.map((m) => (
              <button
                type="button"
                key={m}
                className={`sound-bed${minutes === m ? ' sound-bed-active' : ''}`}
                onClick={() => setMinutes(m)}
              >
                {m}m
              </button>
            ))}
          </div>
          <button type="button" className="widget-trigger" onClick={() => begin(minutes)}>
            begin
          </button>
        </>
      )}
    </section>
  );
}
