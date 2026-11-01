import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Clock } from './widgets/time/Clock';
import { Search } from './widgets/search/Search';
import { Intention } from './widgets/intention/Intention';
import { Todos } from './widgets/todos/Todos';
import { Notes } from './widgets/notes/Notes';
import { Weather } from './widgets/weather/Weather';
import { Sound } from './widgets/sound/Sound';
import { Breath } from './widgets/breath/Breath';
import { Focus } from './widgets/focus/Focus';
import { Links } from './widgets/links/Links';
import { Quote } from './widgets/quotes/Quote';
import { Stats } from './widgets/stats/Stats';
import { Drawer } from './widgets/settings/Drawer';
import { Palette, type PaletteCommand } from './widgets/palette/Palette';
import { useSettings, setSoundPower, settingsItem, setSettingsAccent } from './state/settings';
import { applyPresetRoom } from './widgets/settings/presetApply';
import { filmItem, setFilmMotion } from './story/item';
import { useDailyTick } from './state/useDailyTick';
import { getSoundEngine } from './audio/bridge';

/** The film is summoned, never in the initial paint — its chunk stays asleep. */
const Story = lazy(() => import('./story/Story').then((m) => ({ default: m.Story })));

const ACCENT_KEYS = ['ember', 'sage', 'fog'] as const;

export default function App() {
  const settings = useSettings();
  useDailyTick(); // flips every widget's "today" over at local midnight

  const [filmOpen, setFilmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [zen, setZen] = useState(false);
  const lastEsc = useRef(0); // double-Esc is pure zen's summon, within a breath
  const overlays = useRef({ film: false, palette: false, drawer: false });
  overlays.current = { film: filmOpen, palette: paletteOpen, drawer: settingsOpen };
  const typing = () =>
    document.activeElement instanceof HTMLElement &&
    (document.activeElement.matches('input, textarea') || document.activeElement.isContentEditable);

  // Summon keys: Esc cuts film, double-Esc hides the day, Ctrl+Shift+P asks,
  // Shift+S negotiates with the film, at any hour
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const o = overlays.current;
      if (e.key === 'Escape') {
        if (o.film) setFilmOpen(false); // the film's exit never feeds a zen pair
        else if (o.palette || o.drawer) lastEsc.current = 0; // those own their Esc
        else {
          const now = Date.now();
          if (now - lastEsc.current < 700) {
            setZen((v) => !v); // a double-esc pair is one toggle
            lastEsc.current = 0;
          } else {
            lastEsc.current = now;
          }
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P') && !typing()) {
        setPaletteOpen((v) => !v);
      } else if ((e.key === 's' || e.key === 'S') && e.shiftKey && !typing()) {
        setFilmOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The engine arms once per page; settings drive power and volume after.
  useEffect(() => {
    const engine = getSoundEngine();
    engine.arm();
    engine.setPower(settings.sound.enabled, settings.sound.volume);
  }, [settings.sound.enabled, settings.sound.volume]);

  // The palette's vocabulary: everything its commands own is already here.
  const commands: PaletteCommand[] = [
    {
      id: 'film',
      label: filmOpen ? 'close the story film' : 'the story film',
      hint: 'Shift+S',
      run: () => setFilmOpen((v) => !v),
    },
    {
      id: 'motion',
      label: 'film as stills',
      hint: 'reduced motion',
      run: () => void setFilmMotion(filmItem, 'static'),
    },
    {
      id: 'motion-cinema',
      label: 'film as cinema',
      run: () => void setFilmMotion(filmItem, 'cinema'),
    },
    { id: 'zen', label: 'pure zen', hint: 'double Esc', run: () => setZen((v) => !v) },
    { id: 'set', label: 'settings drawer', run: () => setSettingsOpen(true) },
    {
      id: 'sound',
      label: settings.sound.enabled ? 'sound off' : 'sound on',
      run: () => void setSoundPower(settingsItem, !settings.sound.enabled),
    },
    ...ACCENT_KEYS.map((accent) => ({
      id: `accent-${accent}`,
      label: `accent: ${accent}`,
      run: () => void setSettingsAccent(settingsItem, accent),
    })),
    {
      id: 'morning',
      label: 'preset: morning',
      run: () => applyPresetRoom('morning'),
    },
    {
      id: 'deep',
      label: 'preset: deep work',
      run: () => applyPresetRoom('deep'),
    },
    {
      id: 'evening',
      label: 'preset: evening',
      run: () => applyPresetRoom('evening'),
    },
  ];

  return (
    <div className="stage" data-accent={settings.accent} data-zen={zen || undefined}>
      <div className="grain" aria-hidden="true" />
      {/* the film takes the screen; the surface goes dark-behind and silent to keys */}
      <main className={`surface${zen ? ' surface--zen' : ''}`} inert={filmOpen}>
        <div className="col-main">
          <div className="arrive a0">
            <Clock name={settings.name} />
          </div>
          <div className="arrive a1 main-search">
            <Search />
          </div>
          <div className="arrive a3 main-quote">
            <Quote />
          </div>
          <div className="arrive a3b main-stats">
            <Stats />
          </div>
        </div>
        <aside className="col-side">
          <div className="arrive a2a">
            <Intention />
          </div>
          <div className="arrive a2b">
            <Todos />
          </div>
          <div className="arrive a2c">
            <Notes />
          </div>
          <div className="arrive a2d">
            <Weather />
          </div>
          <div className="arrive a2e">
            <Sound />
          </div>
          <div className="arrive a2f">
            <Breath />
          </div>
          <div className="arrive a2g">
            <Focus />
          </div>
        </aside>
        <div className="arrive a4 surface-links">
          <Links />
        </div>
      </main>
      <Drawer
        open={settingsOpen}
        onToggle={() => setSettingsOpen((v) => !v)}
        onClose={() => setSettingsOpen(false)}
      />
      {paletteOpen ? (
        <Palette commands={commands} onClose={() => setPaletteOpen(false)} />
      ) : null}
      {filmOpen ? (
        <Suspense fallback={null}>
          <Story soundEnabled={settings.sound.enabled} onExit={() => setFilmOpen(false)} />
        </Suspense>
      ) : null}
    </div>
  );
}
