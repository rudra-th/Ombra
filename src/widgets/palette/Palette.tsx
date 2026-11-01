import { useEffect, useState } from 'react';
import { filterCommands, type Command } from '../../state/palette';

/** A command with its teeth: an id, a label, and the thing it does. */
export type PaletteCommand = Command & { run: () => void };

/**
 * The command palette: a search field with seven rows behind it. Summoned,
 * typed, chosen — nothing here is scrolled for, nothing memorized.
 */
export function Palette({
  commands,
  onClose,
}: {
  commands: PaletteCommand[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);

  const results = filterCommands(commands, query);
  const chosen = Math.min(sel, Math.max(0, results.length - 1));

  useEffect(() => setSel(0), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (results.length) setSel((s) => (s + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (results.length) setSel((s) => (s - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onClose();
        results[chosen]?.run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, chosen, onClose]);

  return (
    <div className="palette" role="dialog" aria-label="Commands">
      <input
        className="widget-input palette-input"
        type="text"
        autoComplete="off"
        autoFocus
        placeholder="type a command"
        aria-label="Command search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="palette-list">
        {results.length === 0 ? (
          <li className="palette-empty">nothing answers to that</li>
        ) : (
          results.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                type="button"
                className="palette-item"
                data-sel={i === chosen || undefined}
                onMouseEnter={() => setSel(i)}
                onClick={() => {
                  onClose();
                  cmd.run();
                }}
              >
                <span className="palette-label">{cmd.label}</span>
                {cmd.hint ? <span className="palette-hint">{cmd.hint}</span> : null}
              </button>
            </li>
          ))
        )}
      </ul>
      <p className="palette-edge" aria-hidden="true">
        ↑↓ to move · enter to run · esc to go back
      </p>
    </div>
  );
}
