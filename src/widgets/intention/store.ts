export interface StreakState {
  streak: number;
  /** `YYYY-MM-DD` (local) of the last intention, or null before the first. */
  lastKey: string | null;
}

import { daysBetween } from '../../state/day';

/**
 * The streak the next intention should leave behind.
 * `_today` is the day the surface is being viewed; `setFor` is the day the
 * intention is being written for (they disagree across midnight).
 */
export function nextStreak(
  prev: StreakState,
  _today: string,
  setFor: string,
): number {
  if (prev.lastKey === setFor) {
    return prev.streak; // same day, already counted
  }
  if (prev.lastKey === null) {
    return 1; // the very first intention
  }
  return daysBetween(prev.lastKey, setFor) === 1 ? prev.streak + 1 : 1;
}
