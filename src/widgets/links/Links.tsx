import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { browser } from 'wxt/browser';
import { linksItem } from './item';
import { addLink, removeLink, renameLink, reorderLinks, type LinkItem } from './store';
import { useStorageValue, updateItem } from '../../state/useStorageValue';
import { useSettings } from '../../state/settings';
import { ensureIconsPermission, faviconUrl, type PermissionsSeam } from './icons';

interface Top_site {
  title: string;
  url: string;
}

type PickerState = { kind: 'closed' } | { kind: 'open'; sites: Top_site[]; note?: string };

const safeUrl = (raw: string): URL | null => {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
};

/** One quiet row, nine wide at most, opt-in and hand-built. */
export function Links() {
  const links = useStorageValue(linksItem) as LinkItem[];
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [picker, setPicker] = useState<PickerState>({ kind: 'closed' });
  const [dragUrl, setDragUrl] = useState<string | null>(null);
  const [overUrl, setOverUrl] = useState<string | null>(null);
  const [iconsReady, setIconsReady] = useState(false);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [editUrl, setEditUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  // Tiles may carry their favicon: checked once per toggle-on, through the
  // optional permission's door. The page's route answers only when granted.
  useEffect(() => {
    if (!settings.linkIcons) {
      setIconsReady(false);
      return;
    }
    let alive = true;
    void ensureIconsPermission(
      browser.permissions as unknown as PermissionsSeam,
    ).then((ok) => {
      if (alive) setIconsReady(ok);
    });
    return () => {
      alive = false;
    };
  }, [settings.linkIcons]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void updateItem(linksItem, (prev) => addLink(prev, label, url));
    setLabel('');
    setUrl('');
    setOpen(false);
  };

  const openTopSites = async () => {
    try {
      const granted =
        (await browser.permissions.contains({ permissions: ['topSites'] })) ||
        (await browser.permissions.request({ permissions: ['topSites'] }));
      if (!granted) return;
      const top = (await browser.topSites.get()) as Top_site[];
      const sites = top.slice(0, 12);
      setPicker(links.length >= 9
        ? { kind: 'open', sites, note: 'The row is full — remove one first.' }
        : { kind: 'open', sites });
    } catch {
      setPicker({ kind: 'open', sites: [], note: 'Top sites unavailable here.' });
    }
  };

  const commitRename = (target: string) => {
    void updateItem(linksItem, (prev) => renameLink(prev, target, draft));
    setEditUrl(null);
  };

  /** The favicon inked gray; a missing one falls back to a letter tile. */
  const tileIcon = (l: LinkItem) => {
    if (!iconsReady) return null;
    const route = faviconUrl(l.url);
    if (route === null || broken.has(l.url)) {
      return (
        <span className="link-glyph" aria-hidden="true">
          {l.label.charAt(0).toUpperCase()}
        </span>
      );
    }
    return (
      <img
        className="link-icon"
        src={route}
        alt=""
        onError={() => setBroken((cur) => new Set(cur).add(l.url))}
      />
    );
  };

  useEffect(() => {
    if (picker.kind !== 'open') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPicker({ kind: 'closed' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picker]);

  const pick = (site: Top_site) => {
    const host = safeUrl(site.url)?.hostname ?? site.url;
    void updateItem(linksItem, (prev) => addLink(prev, site.title || host, site.url));
    setPicker({ kind: 'closed' });
  };

  if (picker.kind === 'open') {
    const candidates = picker.sites.filter(
      (s) => !links.some((l) => l.url === s.url),
    );
    return (
      <div className="links-picker" role="dialog" aria-label="Top sites">
        <p className="widget-label">Top sites — add quietly</p>
        {candidates.length === 0 ? (
          <p className="links-note">{picker.note ?? 'Nothing more to add.'}</p>
        ) : (
          <ul>
            {candidates.map((s) => (
              <li key={s.url}>
                <button
                  type="button"
                  className="links-pick"
                  onClick={() => pick(s)}
                  title={s.url}
                >
                  {s.title || s.url}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="widget-trigger"
          onClick={() => setPicker({ kind: 'closed' })}
        >
          ✕ close
        </button>
      </div>
    );
  }

  return (
    <nav className="links" aria-label="Quick links">
      <ul className="links-row">
        {links.map((l) => {
          const editing = editUrl === l.url;
          return (
            <li
              key={l.id}
              className={`link-item${overUrl === l.url ? ' link-over' : ''}${editing ? ' link-editing' : ''}`}
              draggable={!editing}
              onDragStart={(e) => {
                setDragUrl(l.url);
                e.dataTransfer.effectAllowed = 'move';
                try {
                  e.dataTransfer.setData('text/plain', l.url);
                } catch {
                  /* some embedders refuse setData — the local state carries it */
                }
              }}
              onDragOver={(e) => {
                if (dragUrl === null) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setOverUrl(l.url);
              }}
              onDragLeave={() => setOverUrl((cur) => (cur === l.url ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragUrl && dragUrl !== l.url) {
                  void updateItem(linksItem, (prev) => reorderLinks(prev, dragUrl, l.url));
                }
                setDragUrl(null);
                setOverUrl(null);
              }}
              onDragEnd={() => {
                setDragUrl(null);
                setOverUrl(null);
              }}
            >
              {editing ? (
                <input
                  className="widget-input link-edit"
                  type="text"
                  aria-label={`Rename ${l.label}`}
                  autoComplete="off"
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(l.url);
                    else if (e.key === 'Escape') setEditUrl(null);
                  }}
                  onBlur={() => setEditUrl(null)}
                />
              ) : (
                <>
                  <a href={l.url} target="_blank" rel="noreferrer" draggable={false}>
                    {tileIcon(l)}
                    <span className="link-label">{l.label}</span>
                  </a>
                  <button
                    type="button"
                    className="row-rename"
                    aria-label={`Rename ${l.label}`}
                    onClick={() => {
                      setDraft(l.label);
                      setEditUrl(l.url);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="row-remove"
                    aria-label={`Remove ${l.label}`}
                    onClick={() =>
                      void updateItem(linksItem, (prev) => removeLink(prev, l.url))
                    }
                  >
                    ✕
                  </button>
                </>
              )}
            </li>
          );
        })}
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
            <span className="links-actions">
              <button
                type="button"
                className="links-plus"
                aria-label="Add a link"
                onClick={() => setOpen(true)}
              >
                ＋ add
              </button>
              <button
                type="button"
                className="links-plus"
                onClick={() => void openTopSites()}
              >
                top sites
              </button>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
