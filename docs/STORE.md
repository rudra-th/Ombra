# Ombra — Chrome Web Store listing

Everything the listing needs, in the store's own checkboxes, so submission
is a paste-and-navigate affair. The voice follows the surface: quiet, honest,
lowercase where the store permits.

## Item

- **Name** (max 45 chars): `Ombra — a quieter new tab`
- **Category**: Productivity
- **Language**: English (United States)
- **Version**: from `package.json` (`1.0.0`) — the zip is `npm run zip`
- **Manifest version**: MV3; replaces `chrome://newtab` (declared below)

## Summary (max 132 chars)

> A zen, deeply dark new tab: a clock that knows your name, procedural
> ambience, a summoned story film. Local-first, offline.

(129 characters, one line, honest about all three acts.)

## Detailed description

```
The dark tab you actually wanted.

Ombra turns a new tab into a pause: an editorial clock and greeting that wear
your name, a single quiet search bar, a line of thought that turns each day.
No feed, no accounts, no cloud — everything you write stays in the browser.

· A greeting that knows the hour (and your name — the unnamed greeting
  simply leaves a blank for you to fill)
· One search bar, six engines, and it reads a typed URL from a query
· Your own doors: a hand-built row of shortcuts, or your top sites —
  always opt-in, never visited loops
· The day, kept quietly: one thing today, todos, notes, weather, sound,
  breath, focus — each waiting to be invited, none demanding attention
· Procedural ambience — nine sound beds composed live in the Web Audio
  API: rain, café, stream, night, wind. Nothing is downloaded; there are
  no audio files to leak, whole playlists ring out into each other
· The story film — press Shift+S and the tab becomes a slow cinematic
  scroll story (Void, Drift, Focus) that resolves back into your dashboard
· A command palette over everything — Ctrl+Shift+P, or memory: fragments
  find commands by what they sound like
· Breathing rituals with phase chimes, and a focus session that ends on
  a chime, not an alarm
· Respects the system: honors reduced motion and prefers-color-scheme,
  keyboard-first, and a quiet guided first-run you can skip in one key

The three darks are always a keypress away — Shift+S calls the film,
Ctrl+Shift+P asks the palette, double Esc is pure zen.

Local-first, no accounts, no analytics. Your settings ride Chrome Sync
(the name, the accent, the sound choices) so a new machine wakes the same;
your words stay on your device. Weather needs one request to open-meteo.com
— no account, no tracking. Everything else never leaves the browser.
```

## Single purpose (store field)

> Ombra replaces the browser's new tab page with one quiet, personal,
> deeply dark new tab — clock, search, notes, and ambience on a single
> surface.

## Permissions disclosed on listing

| Permission | Why it exists | Behavior if declined |
| --- | --- | --- |
| `storage` (required) | Saves your notes, todos, links, stats locally; your preferences on `chrome.storage.sync` so a new machine wakes the same | The extension cannot remember anything without it |
| `topSites` (optional) | Fills the "top sites" row with the doors you already use | The row stays empty; hand-built shortcuts keep working |
| `favicon` (optional) | Inks your shortcut tiles with the site icon, black & white | Tiles fall back to letter glyphs you can rename |
| `bookmarks` (optional) | Lets you add a shortcut from existing bookmarks without retyping | The +ask simply does not appear |

No `host_permissions`. Nothing fetched automatically. No background
network traffic of any kind — the new tab page wakes when opened and
sleeps when closed.

## Screenshots (1280×800)

Shot of the shipped surface (`docs/assets/`), in store order:

1. `main.png` — the whole dashboard, named greeting, no hover
2. `palette.png` — the command palette summoned
3. `film.png` — the story film's first beat ("a quiet, before")
4. `tour.png` — the first shadow, spotlight on the clock
5. `blank.png` — the unnamed greeting asking (the blank you fill)

No story GIF shipped with v1.0.0 — the five stills carry the listing; a
cut film GIF is a note in PLAN.md, not a launch blocker (see honesty
notes).

## Privacy policy URL

Point the field at the repository page: `docs/PRIVACY.md` rendered
(`https://github.com/rudra-th/Ombra/blob/main/docs/PRIVACY.md`). The store
field wants a URL — a rendered GitHub doc is acceptable for a free,
data-minimal extension and is versioned here rather than elsewhere.

## Justify uses (store review notes)

- New tab replacement: `chrome_url_overrides.newtab` is the product.
- No remote code. All code bundled in the zip; fonts bundled from
  fontsource packages; the only runtime requests are user-initiated
  (search navigations) and the weather fetch, disclosed above.
