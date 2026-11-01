import { storage } from 'wxt/utils/storage';
import { useStorageValue } from '../../state/useStorageValue';

/** Whether the first shadow has already walked this user through the stage. */
export interface TourState {
  guided: boolean;
}

export const DEFAULT_TOUR: TourState = { guided: false };

/**
 * Stored locally on purpose — seeing the shadow is per device, never synced,
 * so a fresh machine is met with the quiet tour once again.
 */
export const tourItem = storage.defineItem<TourState>('local:guided', {
  fallback: DEFAULT_TOUR,
});

export type TourSeam = {
  getValue(): Promise<unknown>;
  setValue(value: unknown): Promise<void>;
};

/** Raw bytes pass through the shadow's guard before React ever hears of them. */
export function readTour(raw: unknown): TourState {
  if (typeof raw === 'object' && raw !== null && (raw as Record<string, unknown>).guided === true) {
    return { guided: true };
  }
  return DEFAULT_TOUR;
}

/** Read-modify-write against guarded bytes, the settings seam's twin. */
export async function updateTour(
  item: TourSeam,
  update: (prev: TourState) => TourState,
): Promise<void> {
  const prev = readTour(await item.getValue());
  await item.setValue(update(prev));
}

/**
 * The one write the tour performs: finished or skipped alike, the shadow
 * never nags the same device twice.
 */
export function markGuided(item: TourSeam = tourItem): Promise<void> {
  return updateTour(item, () => ({ guided: true }));
}

/** Stored bytes pass through the guard before React ever sees them. */
export const useTourSeen = (item: typeof tourItem = tourItem): boolean =>
  readTour(useStorageValue(item)).guided;
