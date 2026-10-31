import { storage } from 'wxt/utils/storage';
import { useStorageValue } from '../state/useStorageValue';

/** How the film moves: the real thing, or stacked stills. */
export type FilmMode = 'cinema' | 'static';

export interface FilmState {
  motion: FilmMode;
}

export const DEFAULT_FILM: FilmState = { motion: 'cinema' };

/** Stored locally on purpose — the film's shape is per device, never synced. */
export const filmItem = storage.defineItem<FilmState>('local:film', {
  fallback: DEFAULT_FILM,
});

export type FilmSeam = {
  getValue(): Promise<unknown>;
  setValue(value: unknown): Promise<void>;
};

/** Raw bytes pass through the film guard before React ever hears of them. */
export function readFilm(raw: unknown): FilmState {
  if (typeof raw === 'object' && raw !== null && (raw as Record<string, unknown>).motion === 'static') {
    return { motion: 'static' };
  }
  return DEFAULT_FILM;
}

/** Read-modify-write against guarded bytes, the settings seam's twin. */
export async function updateFilm(
  item: FilmSeam,
  update: (prev: FilmState) => FilmState,
): Promise<void> {
  const prev = readFilm(await item.getValue());
  await item.setValue(update(prev));
}

/** The one settings write the film performs. */
export function setFilmMotion(item: FilmSeam, motion: FilmMode): Promise<void> {
  return updateFilm(item, () => ({ motion }));
}

/** Stored bytes pass through the guard before React ever sees them. */
export const useFilm = (): FilmState => readFilm(useStorageValue(filmItem));
