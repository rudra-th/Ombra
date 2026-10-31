import { describe, expect, it } from 'vitest';
import { decayTodos, type TodoItem } from './store';

const item = (
  id: string,
  text: string,
  created: string,
  done = false,
  doneAt?: string,
): TodoItem => ({
  id,
  text,
  created,
  done,
  doneAt: doneAt ?? null,
});

describe('decayTodos', () => {
  it('moves unfinished items from older days into "carried over"', () => {
    const today = '2026-10-31';
    const active = item('a', 'write', '2026-10-31');
    const stale = item('b', 'never done', '2026-10-29');

    const res = decayTodos([active, stale], today);
    expect(res.active.map((t) => t.id)).toEqual(['a']);
    expect(res.carriedCount).toBe(1);
  });

  it('vanishes done items finished before today', () => {
    const today = '2026-10-31';
    const freshDone = item('a', 'did now', '2026-10-31', true, '2026-10-31');
    const oldDone = item('b', 'did before', '2026-10-30', true, '2026-10-30');

    const res = decayTodos([freshDone, oldDone], today);
    expect(res.active.map((t) => t.id)).toEqual(['a']);
    expect(res.carriedCount).toBe(0);
  });

  it('keeps every item that belongs to today', () => {
    const today = '2026-10-31';
    const keep = [
      item('a', 'one', '2026-10-31'),
      item('b', 'two', '2026-10-31', true, '2026-10-31'),
    ];
    const res = decayTodos(keep, today);
    expect(res.active).toHaveLength(2);
    expect(res.carriedCount).toBe(0);
  });

  it('returns an empty carry row on a first run with nothing older', () => {
    const res = decayTodos([], '2026-10-31');
    expect(res.active).toEqual([]);
    expect(res.carriedCount).toBe(0);
  });
});
