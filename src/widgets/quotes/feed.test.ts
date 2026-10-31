import { describe, expect, it } from 'vitest';
import { QUOTES, pickQuote } from './feed';

describe('pickQuote', () => {
  it('is deterministic for a day', () => {
    expect(pickQuote('2026-10-31')).toEqual(pickQuote('2026-10-31'));
  });

  it('rotates across days', () => {
    const a = QUOTES.indexOf(pickQuote('2026-10-30'));
    const b = QUOTES.indexOf(pickQuote('2026-10-31'));
    expect(a).not.toBe(b);
  });

  it('always lands inside the feed', () => {
    const q = pickQuote('2026-12-25');
    expect(QUOTES).toContain(q);
  });
});
