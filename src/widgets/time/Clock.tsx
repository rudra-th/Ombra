import { useRef, type KeyboardEvent } from 'react';
import { useClock } from './useClock';
import { formatClock, greeting, greetingParts } from './greeting';

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function Clock({
  name,
  onName,
}: {
  name?: string;
  onName?: (name: string) => void;
}) {
  const now = useClock();
  const inputRef = useRef<HTMLInputElement>(null);

  // enter wears the name; escape only puts the pen down
  const commitName = () => {
    const value = inputRef.current?.value ?? '';
    if (value.trim() && onName) onName(value);
  };

  const unpinPen = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitName();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <section className="hero" aria-label="Time and greeting">
      <h1 className="hero-greeting">
        {name ? (
          greeting(now.getHours(), name)
        ) : (
          <>
            {greetingParts(now.getHours()).before}
            <input
              ref={inputRef}
              className="hero-name"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={24}
              aria-label="your name — the greeting wears it"
              placeholder="your name"
              onKeyDown={unpinPen}
            />
            {greetingParts(now.getHours()).after}
          </>
        )}
      </h1>
      <p className="hero-clock tnum">{formatClock(now)}</p>
      <p className="hero-date tnum">{dateFmt.format(now)}</p>
    </section>
  );
}
