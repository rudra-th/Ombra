# Ombra

*A quieter new tab.*

A zen, deeply dark new-tab extension that plays like a film: bundled scenes,
cinematic scroll stories, offline ambience. Local-first, Chromium.

## Development

```bash
npm install        # also runs `wxt prepare`
npm run dev        # WXT dev — opens Chrome with the unpacked extension loaded, HMR on
npm run build      # production build → .output/chrome-mv3
npm run compile    # typecheck (wxt prepare + tsc --noEmit)
npm test           # vitest
npm run serve:preview  # serve the built preview page at http://localhost:4173
```

Load the production build manually: `chrome://extensions` → Developer mode →
**Load unpacked** → select `.output/chrome-mv3`.

> Chrome allows only one extension to hold the new tab. When the
> "Change back to Google?" bar appears, choose **Keep it**.

## The preview harness

`.output/chrome-mv3/preview.html` renders the dashboard outside the new-tab
slot — a dev-only page plus `src/entrypoints/preview/shim.ts`, which fakes
`chrome.storage` and static APIs into whatever `chrome` stub the embedder has
(never replacing a real extension context). It pre-fills demo data when it
detects a non-extension environment, so real user data is never touched. Use it
for design passes and screenshots; the real extension page stays
`chrome-extension://…/newtab.html`.

## Stack

| Layer | Choice |
|---|---|
| Framework | [WXT](https://wxt.dev) + React 19 + TypeScript |
| Motion | Lenis + native CSS scroll-driven timelines (+ GSAP when choreography demands) |
| Type | Fraunces (display) · Inter (UI, `tnum`) — bundled woff2, zero remote fonts |
| Audio | Web Audio, armed on first gesture, silent by default |
| Storage | `chrome.storage.sync` (settings) + IndexedDB (widgets) — local-first |

Roadmap: see `docs/PLAN.md`.
