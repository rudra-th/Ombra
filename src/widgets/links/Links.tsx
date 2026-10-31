import { useState } from 'react';
import type { FormEvent } from 'react';
import { linksItem } from './item';
import { addLink, removeLink, type LinkItem } from './store';
import { useStorageValue } from '../../state/useStorageValue';

/** One quiet row, nine wide at most, opt-in and hand-built. */
export function Links() {
  const links = useStorageValue(linksItem) as LinkItem[];
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void linksItem.setValue(addLink(links, label, url));
    setLabel('');
    setUrl('');
    setOpen(false);
  };

  return (
    <nav className="links" aria-label="Quick links">
      <ul className="links-row">
        {links.map((l) => (
          <li key={l.id} className="link-item">
            <a href={l.url} target="_blank" rel="noreferrer">
              {l.label}
            </a>
            <button
              type="button"
              className="row-remove"
              aria-label={`Remove ${l.label}`}
              onClick={() => void linksItem.setValue(removeLink(links, l.url))}
            >
              ✕
            </button>
          </li>
        ))}
        <li className="links-add">
          {open ? (
            <form className="links-form" onSubmit={submit}>
              <input
                className="widget-input links-input"
                type="text"
                placeholder="Label"
                aria-label="Link label"
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setOpen(false);
                }}
              />
              <input
                className="widget-input links-input"
                type="text"
                placeholder="Url"
                aria-label="Link url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </form>
          ) : (
            <button
              type="button"
              className="links-plus"
              aria-label="Add a link"
              onClick={() => setOpen(true)}
            >
              ＋ add
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
}
