import { Clock } from './widgets/time/Clock';
import { Search } from './widgets/search/Search';
import { Intention } from './widgets/intention/Intention';
import { Todos } from './widgets/todos/Todos';
import { Notes } from './widgets/notes/Notes';
import { Weather } from './widgets/weather/Weather';
import { Links } from './widgets/links/Links';
import { Quote } from './widgets/quotes/Quote';
import { useSettings } from './state/settings';

export default function App() {
  const settings = useSettings();

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
          <div className="arrive a2">
            <Intention />
          </div>
          <div className="arrive a2">
            <Todos />
          </div>
          <div className="arrive a2">
            <Notes />
          </div>
          <div className="arrive a2">
            <Weather />
          </div>
        </aside>
        <div className="arrive a4 surface-links">
          <Links />
        </div>
      </main>
    </div>
  );
}
