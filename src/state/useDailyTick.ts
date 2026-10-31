import { useEffect, useState } from 'react';

/**
 * Re-renders its caller once per local midnight, so widgets that compute
 * "today" from `new Date()` flip over with the day — no more tabs that sleep
 * on yesterday.
 */
export function useDailyTick(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let timer: number;
    const arm = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      timer = window.setTimeout(() => {
        setTick((t) => t + 1);
        arm();
      }, next.getTime() - now.getTime());
    };
    arm();
    return () => window.clearTimeout(timer);
  }, []);

  return tick;
}
