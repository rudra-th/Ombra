import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Ombra — a quieter new tab',
    description:
      'A zen, deeply dark new tab that plays like a film: bundled scenes, cinematic scroll stories, offline ambience. Local-first.',
    permissions: ['storage'],
    optional_permissions: ['topSites', 'favicon', 'bookmarks'],
    minimum_chrome_version: '116',
  },
});
