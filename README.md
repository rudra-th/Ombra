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
```

Load the production build manually: `chrome://extensions` → Developer mode →
**Load unpacked** → select `.output/chrome-mv3`.

> Chrome allows only one extension to hold the new tab. When the
> "Change back to Google?" bar appears, choose **Keep it**.

## Stack

| Layer | Choice |
|---|---|
| Framework | [WXT](https://wxt.dev) + React 19 + TypeScript |
| Motion | Lenis + native CSS scroll-driven timelines (+ GSAP when choreography demands) |
| Type | Fraunces (display) · Inter (UI, `tnum`) — bundled woff2, zero remote fonts |
| Audio | Web Audio, armed on first gesture, silent by default |
| Storage | `chrome.storage.sync` (settings) + IndexedDB (widgets) — local-first |

Roadmap: see `docs/PLAN.md`.
