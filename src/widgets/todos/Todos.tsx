import { useState } from 'react';
import { todosItem, addTodo, toggleTodo, removeTodo } from './item';
import { decayTodos, type TodoItem } from './store';
import { todayKey } from '../../state/day';
import { useStorageValue, updateItem } from '../../state/useStorageValue';

/** The plan's promise: five visible rows, then one honest count. */
const VISIBLE_CAP = 5;

/** Decay by design: a handful of rows, yesterday folds into one count. */
export function Todos() {
  const todos = useStorageValue(todosItem) as TodoItem[];
  const today = todayKey(new Date());
  const { active, carriedCount } = decayTodos(todos, today);
  const visible = active.slice(0, VISIBLE_CAP);
  const overflow = active.length - visible.length;
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    void updateItem(todosItem, (prev) => addTodo(prev, draft, todayKey(new Date())));
    setDraft('');
  };

  return (
    <section className="widget" aria-label="Todos">
      <p className="widget-label">Todos</p>
      <ul className="todo-list">
        {visible.map((t) => (
          <li key={t.id} className={`todo-row${t.done ? ' todo-done' : ''}`}>
            <button
              type="button"
              className="todo-ring"
              aria-label={t.done ? 'Mark not done' : 'Mark done'}
              aria-pressed={t.done}
              onClick={() =>
                void updateItem(todosItem, (prev) =>
                  toggleTodo(prev, t.id, todayKey(new Date())),
                )
              }
            >
              {t.done && <span className="todo-tick" aria-hidden="true">✕</span>}
            </button>
            <input
              className="widget-input todo-text"
              type="text"
              autoComplete="off"
              value={t.text}
              onChange={(e) => {
                const text = e.target.value;
                void updateItem(todosItem, (prev) =>
                  prev.map((x) => (x.id === t.id ? { ...x, text } : x)),
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
            />
            <button
              type="button"
              className="row-remove"
              aria-label="Remove todo"
              onClick={() => void updateItem(todosItem, (prev) => removeTodo(prev, t.id))}
            >
              ✕
            </button>
          </li>
        ))}
        <li className="todo-row todo-add">
          <span className="todo-ring todo-ring-ghost" aria-hidden="true">+</span>
          <input
            className="widget-input todo-text"
            type="text"
            autoComplete="off"
            placeholder="Add a todo"
            aria-label="Add a todo"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
            }}
          />
        </li>
      </ul>
      {overflow > 0 && (
        <p className="todo-carried tnum">+{overflow} waiting</p>
      )}
      {carriedCount > 0 && (
        <p className="todo-carried tnum" aria-label={`${carriedCount} carried over from earlier days`}>
          carried over ({carriedCount})
        </p>
      )}
    </section>
  );
}
