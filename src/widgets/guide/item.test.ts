import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_TOUR, markGuided, readTour, type TourSeam } from './item';

const fakeItem = (blob: unknown) => {
  let stored: unknown = blob;
  const item: TourSeam = {
    getValue: vi.fn(async () => stored),
    setValue: vi.fn(async (v: unknown) => {
      stored = v;
    }),
  };
  return item;
};

/** Read back with a known shape — the fake stores whatever the write said. */
const readBack = async (item: TourSeam) =>
  (await item.getValue()) as { guided: boolean };

describe('readTour — the guard at the door', () => {
  it('hands junk bytes the unseen default', () => {
    expect(readTour(null)).toEqual(DEFAULT_TOUR);
    expect(readTour(42)).toEqual(DEFAULT_TOUR);
    expect(readTour({ guided: 'yes' })).toEqual(DEFAULT_TOUR);
    expect(readTour({ junk: true })).toEqual(DEFAULT_TOUR);
  });

  it('keeps exactly the seen shape, junk dropped', () => {
    expect(readTour({ guided: true, junk: 'x' })).toEqual({ guided: true });
    expect(readTour({ guided: false })).toEqual({ guided: false });
  });
});

describe('markGuided — the one write the shadow makes', () => {
  it('persists seen against an unseen default', async () => {
    const item = fakeItem(null);
    await markGuided(item);
    expect((await readBack(item)).guided).toBe(true);
  });

  it('stays seen however the flag is hit again', async () => {
    const item = fakeItem({ guided: true });
    await markGuided(item);
    expect((await readBack(item)).guided).toBe(true);
  });

  it('recovers junk storage to a clean seen blob on write', async () => {
    const item = fakeItem({ junk: 'old visit' });
    await markGuided(item);
    const written = JSON.stringify(await item.getValue());
    expect(written).toBe(JSON.stringify({ guided: true }));
  });
});

describe('defaults still guard the fresh path', () => {
  it('a fresh install has never seen the shadow', () => {
    expect(DEFAULT_TOUR.guided).toBe(false);
  });
});
