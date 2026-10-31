import { useEffect, useRef, useState, type CSSProperties } from 'react';
import '../styles/story.css';
import {
  BEATS,
  CENTER_PROGRESSES,
  beatAt,
  chromeAt,
  emaMs,
  frameAt,
  qualityOf,
  snapTarget,
  timecode,
  type Quality,
} from './film';
import { DUST_HIGH, DUST_LOW, seedGrains, stepGrains, type Grain } from './dust';
import { useFilm, setFilmMotion, filmItem, type FilmMode } from './item';
import { getSoundEngine } from '../audio/bridge';
import {
  whoosh,
  boundaryChime,
  scheduleSpecs,
  type RecipeCtx,
  type RecipeSpec,
} from '../audio/recipes';

const BEAT_WORDS = ['void', 'drift', 'focus'] as const;

const BEAT_COPY = [
  { kick: 'ombra', line: 'a quiet, before', sub: 'three beats, then your day' },
  { kick: 'drift', line: 'paper and weather, one small stone', sub: 'it drifts — you catch it' },
  { kick: 'focus', line: 'now, your day', sub: '' },
] as const;

const TRACK_VH = 350; // 3.5 viewports of reel

/** The summoned film. App owns the open door; this component owns the reel. */
export function Story({ soundEnabled, onExit }: { soundEnabled: boolean; onExit: () => void }) {
  const film = useFilm();
  const [osReduce, setOsReduce] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setOsReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const motion: FilmMode = osReduce || film.motion === 'static' ? 'static' : 'cinema';

  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stampRef = useRef<HTMLSpanElement | null>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const soundRef = useRef(soundEnabled);
  const exitRef = useRef(onExit);
  soundRef.current = soundEnabled;
  exitRef.current = onExit;

  // keyboard scroll needs a focusable scroll port, without visual scroll
  useEffect(() => {
    scrollRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (motion !== 'cinema') return;
    const sc = scrollRef.current;
    const canvas = canvasRef.current;
    const hud = stampRef.current;
    const root = rootRef.current;
    if (!sc || !canvas || !hud || !root) return;
    const c2d = canvas.getContext('2d');
    if (!c2d) return;

    /** Only the armed engine speaks; everything here degrades to silence. */
    const chime = (specs: RecipeSpec[]) => {
      if (!soundRef.current) return;
      const engine = getSoundEngine();
      const ctx = engine.context() as unknown as RecipeCtx | null;
      const master = engine.bus();
      if (!ctx || !master) return;
      scheduleSpecs(ctx, master.masterGain, specs);
    };

    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const nest = () => {
      const w = sc.clientWidth;
      const h = sc.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    };
    let box = nest();
    let grains: Grain[] = seedGrains(Math.random, box.w, box.h, DUST_HIGH);
    const onResize = () => {
      box = nest();
      grains = seedGrains(Math.random, box.w, box.h, DUST_HIGH);
    };
    window.addEventListener('resize', onResize);

    // The film's own transport: the wheel steers a target, a lerp rides it.
    sc.scrollTop = 0;
    let target = 0;
    let lastWheel = -1e9;
    let glide: { from: number; to: number; t0: number; dur: number } | null = null;
    const maxScroll = () => sc.scrollHeight - sc.clientHeight;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      glide = null;
      target = Math.max(0, Math.min(maxScroll(), target + e.deltaY));
      lastWheel = performance.now();
    };
    sc.addEventListener('wheel', onWheel, { passive: false });

    let raf = 0;
    let prev = performance.now();
    let ema = 16.7;
    let quality: Quality = 'high';
    let frame = -1;
    let scene = -1;
    let resolve = 0;
    let prevP = 0;

    const paintDust = () => {
      c2d.clearRect(0, 0, box.w, box.h);
      c2d.fillStyle = '#f7f8f8';
      for (const g of grains) {
        c2d.globalAlpha = g.a;
        c2d.beginPath();
        c2d.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        c2d.fill();
      }
      c2d.globalAlpha = 1;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(200, now - prev);
      prev = now;
      if (document.hidden) return;

      // transport: glide or lerp toward the wheel's target
      const mx = maxScroll();
      if (glide) {
        const t = Math.min(1, (now - glide.t0) / glide.dur);
        sc.scrollTop = glide.from + (glide.to - glide.from) * (1 - Math.pow(1 - t, 3));
        target = sc.scrollTop;
        if (t >= 1) glide = null;
      } else {
        const k = 1 - Math.exp((-dt / 1000) * 9);
        sc.scrollTop += (target - sc.scrollTop) * k;
        if (Math.abs(target - sc.scrollTop) < 0.5) sc.scrollTop = target;
      }
      const p = mx > 0 ? sc.scrollTop / mx : 0;

      // chrome breathes with speed, settles at rest — compositor vars only
      const speed = dt > 0 ? (p - prevP) / (dt / 1000) : 0;
      prevP = p;
      const chrome = chromeAt(speed);
      root.style.setProperty('--film-bars', String(chrome.bars / 0.15));
      root.style.setProperty('--film-vignette', String(chrome.vignette));

      // the quantized layers: clock stamp, dust, one paint per film frame
      const f = frameAt(p);
      if (f !== frame) {
        frame = f;
        hud.textContent = timecode(f);
        stepGrains(grains, 1 / 24, box.w, box.h);
        paintDust();
      }

      // scene handoff — entrances are CSS tweens that read the attribute
      const idx = beatAt(p);
      if (idx !== scene) {
        scene = idx;
        root.dataset.scene = String(scene);
        chime(whoosh());
        layerRefs.current.forEach((el, i) => {
          if (!el) return;
          el.toggleAttribute('data-away', i < scene - 1 || i > scene + 1);
        });
      }

      // the resolve: shell thinned, the day takes over from beneath
      if (p >= 0.985) {
        resolve += 1;
        if (resolve === 1) chime(boundaryChime());
        if (resolve > 8) {
          exitRef.current();
          return;
        }
      } else {
        resolve = 0;
      }

      // the weak magnet: a resting hand may find a beat center
      if (!glide && now - lastWheel > 400 && Math.abs(target - sc.scrollTop) < 1) {
        const s = snapTarget(sc.scrollTop, mx, sc.clientHeight);
        if (s !== null && Math.abs(s - sc.scrollTop) > 2) {
          glide = { from: sc.scrollTop, to: s, t0: now, dur: 900 };
        }
      }

      // adaptive quality: smoothed fps, austere when the machine starves
      ema = emaMs(ema, dt, 0.2);
      const q = qualityOf(1000 / Math.max(1, ema), quality);
      if (q !== quality) {
        quality = q;
        root.dataset.quality = q;
        grains = seedGrains(Math.random, box.w, box.h, q === 'low' ? DUST_LOW : DUST_HIGH);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      sc.removeEventListener('wheel', onWheel);
    };
  }, [motion]);

  return (
    <div className="film" role="region" aria-label="Story film" data-static={motion === 'static' || undefined} ref={rootRef}>
      <div className="film-scroll" ref={scrollRef} tabIndex={-1}>
        {/* one reel in flow; screen and hud ride its stickies */}
        <div className="film-track" style={{ '--track-vh': TRACK_VH } as CSSProperties}>
          {/* the screen beneath everything: black shell, dust, chrome */}
          <div className="film-screen" aria-hidden="true">
            <canvas className="film-dust" ref={canvasRef} />
            <div className="film-bar film-bar--top" />
            <div className="film-bar film-bar--bottom" />
            <div className="film-vignette" />
          </div>
          {BEAT_COPY.map((copy, i) => (
            <div
              key={BEAT_WORDS[i]!}
              className="film-layer"
              data-beat={i}
              style={{ '--from': BEATS[i]!.from } as CSSProperties}
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
            >
              <div className="film-beat">
                <div className="film-inner">
                  <p className="film-kick">{copy.kick}</p>
                  <p className="film-line">{copy.line}</p>
                  {copy.sub ? <p className="film-sub">{copy.sub}</p> : null}
                </div>
              </div>
            </div>
          ))}
          {/* the projection room: chrome above everything */}
          <div className="film-hud">
            <p className="film-stamp" aria-hidden="true">
              <span ref={stampRef}>{timecode(0)}</span>
            </p>
            <div className="film-tools">
              <button
                type="button"
                className="film-chip film-motion"
                onClick={() => {
                  void setFilmMotion(filmItem, motion === 'cinema' ? 'static' : 'cinema');
                }}
                title={osReduce ? 'Your OS asks for less motion — the film stays quiet' : 'film ↔ stills'}
              >
                {motion === 'static' ? 'stills' : 'cinema'}
              </button>
              <button type="button" className="film-chip film-exit" onClick={onExit}>
                step into the day
              </button>
            </div>
            <div className="film-ruler" role="group" aria-label="Beats">
              {BEAT_WORDS.map((word, i) => (
                <button
                  key={word}
                  type="button"
                  className="film-dot"
                  aria-label={`Beat — ${word}`}
                  onClick={() => {
                    const sc = scrollRef.current;
                    if (!sc) return;
                    const len = sc.scrollHeight - sc.clientHeight;
                    const to = CENTER_PROGRESSES[Math.min(i, CENTER_PROGRESSES.length - 1)!]! * len;
                    sc.scrollTo({ top: to, behavior: motion === 'static' ? 'auto' : 'smooth' });
                  }}
                >
                  <span className="sr-only">{word}</span>
                </button>
              ))}
            </div>
            <p className="film-edge" aria-hidden="true">
              esc exits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Story;
