import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import type { TourStep } from './steps';

/**
 * The first shadow: an ink backdrop with one spotlighted thing, a fixed
 * quiet card, and three keys. Esc ends it (seen, never nagged twice),
 * arrows walk, and everything the film is busy with pauses it politely.
 */
export function Tour({
  steps,
  paused,
  onDone,
}: {
  steps: TourStep[];
  paused: boolean;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // a stop whose target is off the surface (stats hidden, an empty zone)
  // is passed over silently — the tour adapts to the surface, not back
  useEffect(() => {
    if (paused) return;
    const step = steps[index];
    if (!step) return;
    if (step.target === null) return;
    if (!document.querySelector(step.target)) {
      setIndex((cur) => cur + 1);
    }
  }, [index, paused, steps]);

  // the spotlight follows the target's rects, live with the window
  useLayoutEffect(() => {
    if (paused) return;
    const step = steps[index];
    if (!step || step.target === null) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [index, paused, steps]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDone();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIndex((cur) => Math.min(cur + 1, steps.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((cur) => Math.max(cur - 1, 0));
      }
    },
    [onDone, steps.length],
  );

  useEffect(() => {
    if (paused) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paused, onKeyDown]);

  const last = index >= steps.length - 1;
  const step = steps[index];

  return (
    <div className={`tour${paused ? ' tour-paused' : ''}`}>
      {rect ? (
        <div
          className="tour-hole"
          role="presentation"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      ) : (
        <div className="tour-veil" role="presentation" />
      )}
      <div
        className="tour-card"
        role="group"
        aria-label={`The first shadow — step ${index + 1} of ${steps.length}`}
      >
        <p className="tour-title">{step?.title}</p>
        <p className="tour-line">{step?.line}</p>
        <div className="tour-foot">
          <span className="tour-dots" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={`tour-dot${i === index ? ' tour-dot-on' : ''}`} />
            ))}
          </span>
          <span className="tour-clock">Steps {index + 1} of {steps.length}</span>
        </div>
        <div className="tour-actions">
          <button
            type="button"
            className="widget-trigger tour-skip"
            onClick={onDone}
          >
            skip the shadow
          </button>
          <button
            type="button"
            className="widget-trigger tour-next"
            autoFocus
            onClick={() =>
              last ? onDone() : setIndex((cur) => Math.min(cur + 1, steps.length - 1))
            }
          >
            {last ? 'walk into the dark' : 'next'}
          </button>
        </div>
      </div>
    </div>
  );
}
