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

  it('dissolves unfinished items beyond the carry window', () => {
    const today = '2026-10-31';
    const fresh = item('a', 'recent', '2026-10-30');
    const fossil = item('b', 'long gone', '2026-10-20');

    const res = decayTodos([fresh, fossil], today);
    expect(res.active).toEqual([]);
    expect(res.carriedCount).toBe(1);
  });

  it('respects a custom carry window', () => {
    const today = '2026-10-31';
    const old = item('a', 'old', '2026-10-25');
    expect(decayTodos([old], today, 10).carriedCount).toBe(1);
    expect(decayTodos([old], today, 1).carriedCount).toBe(0);
  });
});
