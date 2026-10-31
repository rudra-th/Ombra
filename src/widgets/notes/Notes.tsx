import { useEffect, useRef, useState } from 'react';
import { notesItem } from './item';
import { useStorageValue, updateItem } from '../../state/useStorageValue';

/** A slip of paper. Writes itself quiet: 500ms after you stop — and instantly
 * when the page goes away, so closing the tab costs at most nothing. */
export function Notes() {
  const saved = useStorageValue(notesItem);
  const [text, setText] = useState<string>(saved);
  const lastSaved = useRef<string>(saved);
  const draft = useRef<string>(saved);

  // Adopt external edits, but never echo our own write back over fresh typing.
  useEffect(() => {
    if (saved !== lastSaved.current) {
      setText(saved);
      lastSaved.current = saved;
      draft.current = saved;
    }
  }, [saved]);

  const flush = () => {
    if (draft.current !== lastSaved.current) {
      lastSaved.current = draft.current;
      const value = draft.current;
      void updateItem(notesItem, () => value);
    }
  };

  useEffect(() => {
    const id = window.setTimeout(flush, 500);
    return () => window.clearTimeout(id);
    // text in deps → every keystroke re-arms the debounce
  }, [text]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

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
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          draft.current = next;
        }}
      />
    </section>
  );
}
