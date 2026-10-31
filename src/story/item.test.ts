import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILM, setFilmMotion, type FilmSeam } from './item';

const fakeItem = (blob: unknown) => {
  let stored: unknown = blob;
  const item: FilmSeam = {
    getValue: vi.fn(async () => stored),
    setValue: vi.fn(async (v: unknown) => {
      stored = v;
    }),
  };
  return item;
};

/** Read back with a known shape — the fake stores whatever the write said. */
const readBack = async (item: FilmSeam) =>
  (await item.getValue()) as { motion: string };

describe('setFilmMotion (migrate-on-write seam)', () => {
  it('keeps a valid choice and persists only that shape', async () => {
    const item = fakeItem({ motion: 'cinema', junk: 'x' });
    await setFilmMotion(item, 'static');
    const written = await readBack(item);
    expect(written.motion).toBe('static');
    expect(JSON.stringify(await item.getValue()).includes('junk')).toBe(false);
  });

  it('recovers junk bytes to the cinema default on write', async () => {
    const item = fakeItem('not a film blob');
    await setFilmMotion(item, 'cinema');
    const written = await readBack(item);
    expect(written.motion).toBe('cinema');
  });
});

describe('defaults still guard the fresh path', () => {
  it('the film opens as cinema when nothing was chosen', () => {
    expect(DEFAULT_FILM.motion).toBe('cinema');
  });
});
