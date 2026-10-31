import { defineConfig } from 'vite';

/**
 * Dev-only preview build — lives OUTSIDE the WXT extension pipeline so the
 * harness (storage shim, demo data) never ships in the extension zip.
 * Output is gitignored `.preview/`, served by `npm run serve:preview`.
 */
export default defineConfig({
  root: 'preview',
  base: './',
  build: {
    outDir: '../.preview',
    emptyOutDir: true,
  },
});
