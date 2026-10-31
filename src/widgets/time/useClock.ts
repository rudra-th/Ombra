import { useEffect, useState } from 'react';

/** The clock prints HH:MM — a half-minute heartbeat is plenty. */
export function useClock(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
