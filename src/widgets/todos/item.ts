import { storage } from 'wxt/utils/storage';
import { decayTodos, type TodoItem } from './store';

export const todosItem = storage.defineItem<TodoItem[]>('local:todos', {
  fallback: [],
});

const makeId = (today: string): string =>
  `${today}-${Date.now().toString(36)}`;

/** Adding prunes only dissolved items (finished before today); carried stay counted. */
export function addTodo(
  list: TodoItem[],
  text: string,
  today: string,
): TodoItem[] {
  const trimmed = text.trim();
  if (!trimmed) return list;
  const kept = list.filter(
    (it) =>
      it.created === today ||
      (it.done && it.doneAt === today) ||
      !it.done,
  );
  return [
    ...kept,
    {
      id: makeId(today),
      text: trimmed,
      created: today,
      done: false,
      doneAt: null,
    },
  ];
}

export function toggleTodo(
  list: TodoItem[],
  id: string,
  today: string,
): TodoItem[] {
  return list.map((t) =>
    t.id === id
      ? t.done
        ? { ...t, done: false, doneAt: null }
        : { ...t, done: true, doneAt: today }
      : t,
  );
}

export function removeTodo(list: TodoItem[], id: string): TodoItem[] {
  return list.filter((t) => t.id !== id);
}
