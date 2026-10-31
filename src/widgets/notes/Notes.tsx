import { useEffect, useRef, useState } from 'react';
import { notesItem } from './item';
import { useStorageValue } from '../../state/useStorageValue';

/** A slip of paper. Writes itself quiet: 500ms after you stop. */
export function Notes() {
  const saved = useStorageValue(notesItem);
  const [text, setText] = useState<string>(saved);
  const lastSaved = useRef<string>(saved);

  // Adopt external edits, but never echo our own write back over fresh typing.
  useEffect(() => {
    if (saved !== lastSaved.current) {
      setText(saved);
      lastSaved.current = saved;
    }
  }, [saved]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (text !== lastSaved.current) {
        lastSaved.current = text;
        void notesItem.setValue(text);
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [text]);

  return (
    <section className="widget" aria-label="Notes">
      <p className="widget-label">Notes</p>
      <textarea
        className="widget-input notes-box"
        rows={3}
        spellCheck={false}
        placeholder="Scribble here"
        aria-label="Notes"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </section>
  );
}
