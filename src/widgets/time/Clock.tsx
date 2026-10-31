import { useClock } from './useClock';
import { formatClock, greeting } from './greeting';

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function Clock({ name }: { name?: string }) {
  const now = useClock();

  return (
    <section className="hero" aria-label="Time and greeting">
      <h1 className="hero-greeting">{greeting(now.getHours(), name)}</h1>
      <p className="hero-clock tnum">{formatClock(now)}</p>
      <p className="hero-date tnum">{dateFmt.format(now)}</p>
    </section>
  );
}
