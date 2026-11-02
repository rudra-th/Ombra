# Ombra privacy statement

Ombra is local-first. There are no accounts, no analytics, no servers of
ours, and nothing to log in to. This page says exactly where data lives
and the one request that leaves the device.

## What stays in your browser

Everything you make on the surface is stored by your browser, in
`chrome.storage`:

- **On your device only** (`local`): notes, todos, intentions and its
  streak, your shortcut links, the story film's motion, the ambience
  bed choices, tab statistics, and whether Ombra has walked you through
  its quiet tour. Delete them by removing the extension, or clear each
  in place — Ombra never uploads them, and has no way to.
- **Riding Chrome Sync** (`sync`): your settings only — your name, the
  accent, sound choices, switch states. This travels through your own
  Chrome Sync account, encrypted by Chrome, exactly where your
  bookmarks live. Turning Chrome Sync off keeps them on the device.
  Ombra's export (`copy settings JSON`) hands you a plain file you own.

## What leaves the device

Two things, both user-initiated, neither going to us:

1. **Weather** — one request to open-meteo.com: your typed city for
   geocoding, then coordinates for a forecast. No account, no API key,
   no identifiers, no cookies of ours. Ombra never sends your data;
   it asks the weather with coordinates you chose to type.
2. **Your own navigations** — the search bar is a door you walk
   through: your query goes to the engine you picked for that moment
   (DuckDuckGo by default), exactly as if you had visited that site.
   Ombra the extension hears nothing of the reply.

## Optional permissions

Three abilities stay optional and refused until you say yes from the
drawer:

- `topSites` — pouring the "top sites" suggestion row. Read once,
  locally.
- `favicon` — inking shortcut tiles in black and white via Chrome's
  own favicon service.
- `bookmarks` — picking an existing bookmark for a new shortcut.

Asking does not look at history, and each is used only to draw the
surface. Decline any; the surface adapts quietly.

## Never, ever

- no analytics or telemetry of any kind
- no third-party scripts, fonts, or images loaded at runtime
- no reading or changing of other pages (Ombra touches `newtab` only)
- no data selling, no sharing, nothing "anonymized and then shared"

## Changes

Any change to this statement ships with the release that makes it, and
the release notes say so plainly. The last change: v1.0.0, the first.
