import { daysBetween } from '../../state/day';

export interface TodoItem {
  id: string;
  text: string;
  /** `YYYY-MM-DD` the todo was written. */
  created: string;
  done: boolean;
  /** `YYYY-MM-DD` it was finished, or null. */
  doneAt: string | null;
}

export interface DayTodos {
  active: TodoItem[];
  /** Yesterday's unfinished work, folded into one quiet "carried over (n)" line. */
  carriedCount: number;
}

/** Unfinished work whispers "carried over" for this many days, then dissolves. */
export const CARRY_DAYS = 3;

/**
 * Night decay. Todos live one day unless they belong to today:
 * written today → stays; finished today → stays as a struck line;
 * unfinished within the carry window → becomes a count;
 * untouched for 3+ days → dissolves without a trace.
 */
export function decayTodos(
  items: TodoItem[],
  today: string,
  carryDays: number = CARRY_DAYS,
): DayTodos {
  const active: TodoItem[] = [];
  let carriedCount = 0;

  for (const item of items) {
    if (item.created === today || (item.done && item.doneAt === today)) {
      active.push(item);
    } else if (!item.done && daysBetween(item.created, today) <= carryDays) {
      carriedCount += 1;
    }
    // older unfinished work: quietly dissolved
  }

  return { active, carriedCount };
}

/** Full decay for storage writes: keeps today's and countable, drops the rest. */
export function pruneTodos(items: TodoItem[], today: string): TodoItem[] {
  return items.filter(
    (item) =>
      item.created === today ||
      (item.done && item.doneAt === today) ||
      (!item.done && daysBetween(item.created, today) <= CARRY_DAYS),
  );
}
