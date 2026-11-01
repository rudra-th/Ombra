# Ombra — Master Plan

*A quieter new tab. Everything local. Motion that plays like film.*

## Identity

- **Name:** Ombra (Italian: shadow) — verified clean in the new-tab category.
- **One-liner:** a zen, deeply dark new tab that plays like a film, sounds like a
  study, and works without an account.
- **The gap:** Momentum = calm but static · Sapiare = art but useless · Tab
  Widgets = deep but disposable. Nobody combines calm motion + sound + utility.
- **Anti-goals:** account walls, paywall drip, remote assets, interruptions.

## Stacked decisions

1. Chromium-only v1 (Chrome/Edge/Brave ≥ 116). Firefox later.
2. Local-first privacy: `storage` ships at install; `topSites`, `favicon`,
   `bookmarks` are **optional_permissions** granted on click, in context.
3. Dashboard on load; the story mode is summoned (Shift+S / palette).
4. Sound **off** by default; page "wakes" on first gesture (Chrome autoplay
   reality turned into identity).
5. Weather/Open-Meteo works without `host_permissions` only because the
   endpoints answer `Access-Control-Allow-Origin: *` — keep it keyless and
   CORS-only; never widen permissions for it.

## Design system (Shadow Study)

- Surfaces: `#08090A` → `#0F1011` → `#191A1B`. Never `#000`.
- Ink: `#F7F8F8` primary, `#D0D6E0` secondary, `#8A8F98` muted floor (4.5:1).
- One accent (`#D2A96F` ember; sage `#A9BFA0` / fog `#9FB4C7` presets) driven by
  `[data-accent]`; components reference `--pulse`.
- Film grain anti-banding: inline SVG fractalNoise, 5% opacity, soft-light.
- Type: Fraunces (display) + Inter (UI, `tnum` numerals) — bundled woff2, no
  remote fonts (MV3 CSP + "no remote code" store declaration).
- Elevation via surface steps; 2px radius; no gradients-as-decoration.

## Stack

WXT 0.21 (entrypoints auto-manifest) · React 19 · TS strict · native CSS
scroll-driven timelines + sticky tracks (~15KB controller) · Lenis 1.3 (~6KB gz,
official GSAP integration, `lagSmoothing(0)`) · GSAP triggered by choreography
needs · Paper Shaders / ogl for WebGL scenes (never three.js) · Web Audio
(limiter, lookahead scheduler) · driver.js 1.10 onboarding.

## Architecture

```
src/entrypoints/newtab/    override page (index.html + main.tsx)
src/state/                 settings schema (sync), widget stores (local/IDB)
src/styles/                tokens + base
src/widgets/               clock · search · links · intention · todos · focus
                           stats · notes · quotes · weather · ambience
src/layers/                background · dashboard · story · audio · guide
                           (story/audio/guide lazy-loaded after first use)
```

Storage: `sync:settings` (one debounced JSON ≤ 8KB, writes ≥ 2s apart),
todos/notes/stats/wallpapers in IndexedDB (10MB `local` floor). Versioned
schema migration. Auto-backup of settings to IndexedDB daily.

## Feature map

Clock+greeting (Fraunces, band-aware up to the minute) · daily intention with
gentle streak · search (omnibox-first, `/` or ⌘K in-page, engines incl. custom
bangs) · dark shell, quick links (manual + opt-in topSites/favicon, ≤9/row, drag
reorder lands in Phase 4) ·
decay todos (≤5 visible, yesterday auto-carries "carried over (n)") · notes ·
bundled quotes (56 shipped; grows toward ~200 — zero network) · tab-stats line + 7-day sparkline ·
weather (opt-in, Open-Meteo keyless, city typed once — no geolocation) ·
ambience mixer (rain/brown/pink/fire/cafe/ocean/forest/wind/birds; all nine
procedural, no samples) · breathing rituals (box/4-7-8/triangle with
phase chimes) · focus timer · presets (Morning/Deep Work/Evening) · settings
drawer with live preview · export/import settings JSON · command palette ·
quick-hide "pure zen" (double-Esc).

## Story engine (scroll as film)

- 3 pinned beats over ~3.5 viewports on a sticky track: **Void → Drift →
  Focus**; the film resolves into the live dashboard.
- Native CSS `scroll()`/`view()` timelines drive crossfades/parallax/
  letterbox/grain; tiny JS controller adds: 24fps-quantized **timecode HUD**
  (`MM:SS:FF`), scene dots via `::scroll-marker`, velocity-coupled cinema
  chrome (bars/vignette breathe with scroll speed, settle at rest), Lenis lerp
  + snap (~900ms, weak magnet), adaptive quality (EMA fps < 45 → halve
  particles/blur/step DPR down).
- Rules: ≤5 beats, never stop scroll transit, entrances tween on scene-enter
  (300–600ms), blur is a transition (≤300ms) not a state, quantize only film
  layers (grain/canvas), compositor-only props, `contain: strict` per scene,
  `content-visibility: hidden` ±1 scene, DPR ≤ 1.5.
- Reduced motion (OS or in-page toggle) → static stacked sections; Esc =
  instant off; toggle persisted per device.

## Sound engine

One shared AudioContext resumed on first `pointerdown`/`keydown` (wheel doesn't
count). Master Gain + DynamicsCompressor; defaults volume 0.3, **silent by
default**. Recipes: hover tick (≥3kHz, ≤40ms, ≤−24dBFS), soft click (<80ms),
story whoosh (200Hz→2kHz noise sweep, ~300ms), boundary chime (523+784Hz
detuned, 1.5–2s), phase chime for breathing. Sample-accurate scheduler
(clock-placed, never setTimeout). Ambience beds fully procedural (rendered
loops + LFO-shaped filters + clocked sparks/chirps) — no bundled samples.

## Start guide (First Shadow)

driver.js spotlight tour, skippable everywhere, Esc = done forever, replayable
from settings: arrival ring · "Keep it" defusal for Chrome's revert bar · name
(true name → greeting; never email) · scene choice with live preview · sound
calibration (sets default OFF/ON deliberately) · widget spotlights in context ·
story invitation ending at the dashboard. Progressive hints (one per pro
widget, first use).

## Budgets & integrity

First paint < 200ms (bundled CSS/fonts, cached settings render instantly, no
cold-start network). JS ~120KB gz initial; story/audio/guide lazy. rAF paused
and audio suspended when hidden. Incognito keeps stock tab (documented). Store:
single-purpose quote-cited policy, honest data declarations, "no remote code"
true by construction, screenshots 1280×800 incl. story GIF, review buffer 1
week. mv3: alarms ≥ 0.5min (Chrome 120), ≤ 500 total.

## Phases (each ends tagged)

0. **Foundation** ✅ scaffold · tokens · grain · fonts · settings schema ·
   dark shell boots (<200ms).
1. **Daily surface** ✅ widgets above (except sound/stats/presets), editorial
   layout, quality pass (inspect + design review loop).
2. **Sound & ambience** ✅ engine (lazy ctx, first-gesture wake, hidden-tab
   suspend), clocked recipes + scheduler, nine procedural beds with ring-out
   handoffs, mixer deck on the surface (switch · bed chips · level + master
   sliders), breathing rituals with phase chimes, focus timer with +5
   extension and boundary chime. Deferrals → honesty notes below.
3. **Story engine** ✅ the summoned three-beat film (`local:film` motion,
   Shift+S summon, Esc instant cut, lazy chunk), native `scroll()` timelines
   over a sticky reel (Void → Drift → Focus, resolve into the dashboard),
   24fps timecode HUD, velocity-coupled letterbox/vignette, wheel-lerp
   transport with idle weak-magnet snap, scene dots, frame-quantized dust,
   EMA adaptive quality, auto-exit on resolve. Deferrals → honesty notes
   below.
4. **Depth** ✅ stats strip, presets, settings drawer, export/import,
   command palette, pure-zen quick hide, deck touch sounds. Deferrals →
   honesty notes below.
4b. **Shortcut tiles** ✅ stats and favicon tiles shipped hidden (schema
   defaults, migrated blobs inherit the default), inline tile rename, inked
   B&W favicons behind an opt-in permission ask, drawer Surface section,
   palette commands, threaded write queue. Deferrals → honesty notes below.
5. **First Shadow** ✅ a hand-rolled spotlight tour: first-run once, six
   stops (clock, search, quote, side tools, links row, the three summoned
   darks), Esc/arrow keys, film-and-palette pause-resume, palette replay,
   per-device remembering. Deferrals → honesty notes below.
6. **Launch** — icon/logo, screenshots + story GIF, listing copy, privacy
   disclosures, v1.0.0, store submission.

## Phase 4 honesty notes (v0.5-depth)

- **"Directories" was resolved in Phase 1 clothing.** The token sat in this
  phase's outline without ever growing a spec: the quick-links row with the
  opt-in topSites picker (shipped Phase 1, ≤9/row) is this dashboard's
  directory. A collections/folders page would fight the one-calm-row rule,
  so it is dropped deliberately, not silently.
- **Drag reorder is drag-only.** Links reorder with native HTML5 drag from
  the label (anchors stay click-only; the dragged link takes its target's
  exact slot). No keyboard reordering or move-menu exists yet — an honest
  accessibility gap queued for later polish.
- **Deck sounds wired; rest of the surface stays silent.** `hoverTick` and
  `softClick` — spec'd, tested, and library-only since Phase 2 — now play on
  the sound deck (hover tick on bed chips, soft click on the bed press and
  master switch), through a seam that schedules only on a *running* context:
  hover is never a gesture, so before the page's first real activation the
  ticks never fire. The drawer's chips and inputs remain touch-silent; the
  whole surface volubly sounding off is left to taste testing later.
- **Pure zen hides, it does not clear.** Double-Esc is one toggle pair:
  quote, stats spark, side column, and links fade to hidden while clock,
  search, and grain keep the stage. A room-empty ("everything but the
  clock") mode remains an un-sketched alternative.
- **`.arrive` fill-mode change is load-bearing.** The arrival animation
  moved from fill `both` to `backwards` so blocks hand ownership back to
  the cascade at the end of their landing; with `both`, the animation
  pinned `opacity` forever and silently out-ranked the zen fade's
  transition. `prefers-reduced-motion` switches arrivals off already.
- **Preview storage is memory.** The design-pass shim serves
  `chrome.storage` from a RAM map — every navigation resets the demo data,
  and counts like "1 today" only accumulate within one visit. Write-path
  persistence is what the tests prove; only the extension build persists.
- **The visual pass ran where the windows allowed it.** The first pass kept
  failing because the harness's desktop window sat occluded — Chrome freezes
  the animation clock of covered windows, so screenshots were impossible and
  every computed style of an animated element read its frozen delay state
  (this is what made zen probes show `search` at `opacity: 0`; there was no
  zen bug). With the window finally visible, the surface, drawer, palette
  (list and empty state), and pure zen were verified as designed, and the
  pass caught three blemishes, all fixed: the master-volume switch redrawn
  as a rounded pill with real knob travel (the old 30px track left the knob
  mathematically flush), the "Your data" block given a grid (full-width
  import textarea, stacked quiet actions instead of scattered boxes), and
  pure zen extended to hide the settings gear — a pure stage now holds only
  greeting, clock, and search.

## Phase 5 honesty notes (v0.7-shadow)

- **Not driver.js.** The outline said "driver.js guide": the shipped answer is
  a hand-rolled spotlight (~200 lines). driver.js's machinery is mostly
  scroll-into-view and edge flipping — dead weight on a fixed dashboard stage
  that never scrolls the page, and its steps-of-flow shapes don't want our
  ink. Steps are a small data file; skip rule, spotlight rect, and keyboard
  walk are ours.
- **No hint dots — rejected, not deferred.** driver.js-style persistent
  pulsing dots are exactly the ambient aggression the surface refuses; the
  widget labels are already self-describing, so the tour exists to name the
  invisible (summons, the gear) and the grammar. Nothing pulses after.
- **Targetless stops don't fake a spotlight.** The finale has no target; the
  first attempt floated a synthetic hole over nothing — it read as a bug, so
  a targetless stop drowns the whole stage evenly and lets the card speak
  (the pause-vs-spotlight contrast is the point).
- **The remembering is per device.** `local:guided`, not `sync:` — a synced
  settings account still gets offered the shadow once on a fresh machine,
  which is the intended "fresh install" behavior, and the export/import file
  stays pure preferences (tour state never pollutes the JSON).
- **The shadow yields.** It arms 2.4s after first paint (arrivals landed)
  but abandons silently if film/palette/drawer are already open at that
  moment — unseen, unguided, re-offered next tab. While walking, it pauses
  fully behind the film (Shift+S scares even the shadow) and behind the
  palette; its keys sleep while paused; Esc in the film cuts the film first.
  Ctrl+Shift+P during a walk buries the shadow instead of stacking under it
  (its z-index would otherwise swallow the palette).
- **Skip and finish are the same write.** Esc, "skip the shadow", and
  "walk into the dark" all mark guided — the tour narrates once per device,
  then only the palette remembers how to reopen it.

## Phase 4b honesty notes (v0.6-tiles)

- **Both new surfaces ship hidden.** `statsVisible: false` and
  `linkIcons: false` sit in `DEFAULT_SETTINGS`, and the schema door hands any
  legacy blob the defaults (`raw.field === true` — absent means off). Fresh
  installs and migrated saves see the same calm surface until a switch is
  flipped in the drawer's **Surface** section or run from the palette
  (`tab stats: show/hide`, `shortcut icons: on/off`).
- **Favicons are opt-in, not ambient.** The `favicon` permission stays
  optional in the manifest; the ask fires only when the icons toggle is
  flipped on. The seam checks `contains` first (a prior grant never re-prompts),
  a denial leaves the switch off with no write, and revoked grants fall back
  to letter tiles rather than broken images. Chrome serves the `_favicon/`
  route from its local cache — no network of ours, staying local-first.
- **Inked, not recolored.** The B&W look is CSS (`grayscale(1)
  brightness(1.08)`) on a `--canvas` chip so white marks stay legible; a tile
  with no favicon (or the preview, which has no `_favicon/` route) shows a
  letter glyph — the label's first initial on the same chip.
- **Rename is hover, not double-click.** Native `dblclick` would navigate
  first (the tile is a real anchor), so the pencil is a second hover-revealed
  button beside ✕. Enter commits, **Esc and blur abort**; the drag machinery
  suspends while editing. Blank labels and strangers are refused by
  `renameLink` (the map returns the old array, never a new one — pointer
  stability is asserted).
- **Keyboard-open of tiles deliberately excluded.** `1`–`9` bindings to open
  the first nine links read efficient but are exactly the ambient aggression
  a zen surface avoids; the palette remains the summon path.
- **The visibility write race.** The live pass caught two toggles clicked in
  one batch clobbering each other (both read-modify-writes read the same
  snapshot; the second's merge undid the first's field). Both write seams now
  join a per-item queue (`enqueueWrite`) — each write starts only after the
  previous has fully landed, and a failed write never deadheads the chain
  (tests: the three-bump counter lands at 3, not 1).
- **The knob read a deck-only class.** The switch pill's knob traveled only
  under an ancestor `.sound-on` class — the deck supplied it, so the drawer's
  three `role="switch"` buttons declared `aria-checked` truthfully while
  their knobs sat frozen left (the visual pass caught the Surface switches
  contradicting the armed state behind them). The knob now travels on
  `[aria-checked='true']`, one source of truth for pointer and screen reader;
  the deck's redundant class composition is gone.
- **Preview letter-tiles become the real demo trail.** The shim's
  `permissions` reports granted while `runtime.getURL` is absent, so the
  preview exercises exactly "granted, always glyph" — the true-favicon path
  (B&W imgs) is real-extension territory and only visually verifiable after a
  manual load there. Unit tests cover the permission and route seams.

## Phase 2 honesty notes (v0.3-sound)

- **No sample batteries.** The plan allowed either bundled CC0 loops or
  synthesis; the shipped answer is synthesis for all nine beds. Brown/pink
  render as looping buffers; ocean/wind shape the same pink bed with slow
  LFOs; rain/cafe/forest ride filters on shared white/pink; fire sparks and
  bird chirps come from small interval feeds that schedule strictly on the
  audio clock. If quality demands in later polish, CC0 batteries may be
  reevaluated.
- **Recipes not fully wired.** `hoverTick` and `softClick` specs exist,
  tested, and sit in the library, but the surface does not yet play them —
  the deck stays touch-silent beyond its bed. Wiring landed partially with
  the Phase 3 story chrome (see Phase 3 notes).
- **No lazy split for audio.** Engine + recipes + player ship statically
  with the app (~10 kB raw). The worker/render-thread split and dynamic
  import of the player are Phase 3+ polish, noted for the budget audit.
- **Write seam now migrates.** `updateItem` passed raw stored bytes, so a
  legacy `soundEnabled` blob crashed the first deck toggle. Settings writes
  now migrate-on-write (`setSoundPower`/`setSoundVolume`); legacy bytes are
  upgraded before the callback sees them, and the flat flag leaves storage.
- **Surface scroll reworked.** With seven sections, the side column grew
  taller than many windows: it now scrolls quietly inside its own box on
  desktop (hidden scrollbar, overscroll contained); stacked single-column
  windows (≤860px) page-scroll with a hidden scrollbar either way.

## Phase 3 honesty notes (v0.4-story)

- **No Lenis, no GSAP.** The stack column listed Lenis 1.3 + GSAP; the shipped
  transport is a ~55-line controller — the wheel steers a target and a lerp
  (`k = 1 − e^(−dt·9)`) rides it, and a resting hand (400ms idle) gets a
  900ms ease-out glide to the nearest beat center the magnet reaches (0.2
  viewport). A single rAF runs it. At three beats this beat both libraries on
  realism; revisit only if the reel ever grows past five beats.
- **No `::scroll-marker`.** Scene dots are plain buttons that read the
  controller's `data-scene` and jump to a beat center on click; the
  `::scroll-marker` pseudo-element isn't in stable Chromium yet.
- **Reel geometry lesson.** The first layout attached the sticky screen and
  HUD as siblings of the track, silently doubling the scroll range (mx 2574
  instead of 1430). Both now live inside `.film-track`, with the screen
  carrying `margin-bottom: -100dvh`, so the scroll range is exactly the
  reel: 3.5 viewports. Each beat's layer wrapper is positioned at its
  cut-over progress and its sticky child pins for the beat's span.
- **Recipes: partially wired.** The story plays `whoosh` on every scene
  handoff and `boundaryChime` as the reel resolves — both only when the
  sound engine is armed. `hoverTick` and `softClick` remain library-only;
  they land with the Phase 4 deck polish or are dropped honestly.
- **Story is now a lazy chunk** (~6.7 kB JS + CSS split on first summon),
  which resolves Phase 2's "no lazy split" note for the story half. Audio
  still ships statically — unchanged.
- **Adaptive quality implemented with hysteresis.** Frame time smooths ExMA
  style (k 0.2); fps < 45 drops to `data-quality="low"` (dust halved,
  vignette halved), fps > 56 climbs back. DPR capped at 1.5, grain steps
  only on 24fps frame boundaries. Shipped beats use no blur, so the
  "blur as ≤300ms transition" rule currently has nothing to govern.
- **Native timelines where they shine, one controller concession.**
  Crossfades, per-beat lifts, the resolve fade, and letterbox retraction
  are anonymous `scroll()` timeline keyframes; the controller only writes
  CSS custom properties (bars/vignette), the timecode stamp, and scene
  attributes — no per-frame style writes to animated elements.
- **Stills needed its own paint + unpark pass.** The first stills
  stylesheet used an invalid `.film[data-static] .film` selector, so the
  root stayed transparent and the (inert) dashboard leaked through the
  stacked sections. Fixed three ways: the stills root paints `--canvas`
  itself, the projection room pins `fixed` during stills so the stamp,
  chips, and dots stay reachable at the first screen, and the controller
  clears layer parking (`data-away`) whenever the reel collapses to
  stills — parked sections no longer vanish from the stack.

## Deliberately NOT in v1

Firefox · accounts/cloud sync · AI features · RSS/calendar/Spotify vendor
widgets · gamified streaks beyond the intention stone · mobile.
