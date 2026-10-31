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
3. **Story engine** — the 3-beat film, timecode, velocity chrome, static
   reduced-motion mode, adaptive quality.
4. **Depth** — stats strip, presets, settings drawer, export/import,
   directories, command palette.
5. **First Shadow** — driver.js guide, hints, replay.
6. **Launch** — icon/logo, screenshots + story GIF, listing copy, privacy
   disclosures, v1.0.0, store submission.

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
  the deck stays touch-silent beyond its bed. Wiring lands with the Phase 3
  story chrome (whoosh gates) or a Phase 4 flourish.
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

## Deliberately NOT in v1

Firefox · accounts/cloud sync · AI features · RSS/calendar/Spotify vendor
widgets · gamified streaks beyond the intention stone · mobile.
