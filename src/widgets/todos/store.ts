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

/**
 * Night decay. Todos live one day unless they belong to today:
 * written today → stays; finished today → stays as a struck line;
 * unfinished from before today → becomes a count;
 * finished before today → dissolves without a trace.
 */
export function decayTodos(items: TodoItem[], today: string): DayTodos {
  const active: TodoItem[] = [];
  let carriedCount = 0;

  for (const item of items) {
    if (item.created === today || (item.doneAt === today && item.done)) {
      active.push(item);
    } else if (!item.done) {
      carriedCount += 1;
    }
  }

  return { active, carriedCount };
}
