import { lazy, Suspense, useEffect, useState } from 'react';
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
import { useSettings } from './state/settings';
import { useDailyTick } from './state/useDailyTick';
import { getSoundEngine } from './audio/bridge';

/** The film is summoned, never in the initial paint — its chunk stays asleep. */
const Story = lazy(() => import('./story/Story').then((m) => ({ default: m.Story })));

export default function App() {
  const settings = useSettings();
  useDailyTick(); // flips every widget's "today" over at local midnight

  const [filmOpen, setFilmOpen] = useState(false);
  const typing = () =>
    document.activeElement instanceof HTMLElement &&
    (document.activeElement.matches('input, textarea') || document.activeElement.isContentEditable);

  // Shift+S summons the film, Esc is the instant cut, at any hour
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFilmOpen(false);
      else if ((e.key === 's' || e.key === 'S') && e.shiftKey && !typing()) {
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

  return (
    <div className="stage" data-accent={settings.accent}>
      <div className="grain" aria-hidden="true" />
      {/* the film takes the screen; the surface goes dark-behind and silent to keys */}
      <main className="surface" inert={filmOpen}>
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
      {filmOpen ? (
        <Suspense fallback={null}>
          <Story soundEnabled={settings.sound.enabled} onExit={() => setFilmOpen(false)} />
        </Suspense>
      ) : null}
    </div>
  );
}
