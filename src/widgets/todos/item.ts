import { storage } from 'wxt/utils/storage';
import { decayTodos, type TodoItem } from './store';

export const todosItem = storage.defineItem<TodoItem[]>('local:todos', {
  fallback: [],
});

const makeId = (today: string): string =>
  `${today}-${Date.now().toString(36)}`;

/** Adding prunes yesterday's decay first, so storage never bloats. */
export function addTodo(
  list: TodoItem[],
  text: string,
  today: string,
): TodoItem[] {
  const trimmed = text.trim();
  if (!trimmed) return list;
  const kept = decayTodos(list, today).active;
  return [
    ...kept,
    { id: makeId(today), text: trimmed, created: today, done: false, doneAt: null },
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
