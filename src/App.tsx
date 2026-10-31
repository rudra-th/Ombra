import { Clock } from './widgets/time/Clock';
import { useSettings } from './state/settings';

export default function App() {
  const settings = useSettings();

  return (
    <div className="stage" data-accent={settings.accent}>
      <div className="grain" aria-hidden="true" />
      <main className="surface">
        <Clock name={settings.name} />
      </main>
    </div>
  );
}
