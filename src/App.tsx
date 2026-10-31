import { Clock } from './widgets/time/Clock';
import { Search } from './widgets/search/Search';
import { Intention } from './widgets/intention/Intention';
import { Todos } from './widgets/todos/Todos';
import { Notes } from './widgets/notes/Notes';
import { Weather } from './widgets/weather/Weather';
import { Sound } from './widgets/sound/Sound';
import { Links } from './widgets/links/Links';
import { Quote } from './widgets/quotes/Quote';
import { useSettings } from './state/settings';
import { useDailyTick } from './state/useDailyTick';
import { getSoundEngine } from './audio/bridge';
import { useEffect } from 'react';

export default function App() {
  const settings = useSettings();
  useDailyTick(); // flips every widget's "today" over at local midnight

  // The engine arms once per page; settings drive power and volume after.
  useEffect(() => {
    const engine = getSoundEngine();
    engine.arm();
    engine.setPower(settings.sound.enabled, settings.sound.volume);
  }, [settings.sound.enabled, settings.sound.volume]);

  return (
    <div className="stage" data-accent={settings.accent}>
      <div className="grain" aria-hidden="true" />
      <main className="surface">
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
        </aside>
        <div className="arrive a4 surface-links">
          <Links />
        </div>
      </main>
    </div>
  );
}
