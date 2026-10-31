import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ENGINE_LIST, buildSearchUrl, toDirectUrl } from './engines';

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable);

/** The omnibox stays omnibox-first: urls go direct, words go to the engine. */
export function Search() {
  const ref = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current?.focus();
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        ref.current?.focus();
      } else if (e.key === 'Escape' && typing) {
        (document.activeElement as HTMLElement).blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const planes = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      e.currentTarget.blur();
      e.preventDefault();
    }
  };

  const go = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const direct = toDirectUrl(q);
    window.location.assign(direct ?? buildSearchUrl(ENGINE_LIST[0]!.id, q));
  };

  return (
    <form className="search" role="search" onSubmit={go}>
      <svg
        className="search-glyph"
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
      >
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        ref={ref}
        className="search-input"
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search, or type a url"
        aria-label="Search or type a url"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={planes}
      />
      <kbd className="search-hint" aria-hidden="true">/</kbd>
    </form>
  );
}
