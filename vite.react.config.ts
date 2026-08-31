// Self-contained Vite config for the React parallel-run entry (plan C16).
//
// The shared `ViteConfigGenerator` lives outside this checkout, so the Vue build
// can fail off-host; the React entry deliberately does NOT depend on it. This
// config builds ONE fixed-name bundle — `public/assets/js/ichava-react.js` +
// `public/assets/css/ichava-react.css` — matching the Blade `asset()` path, and
// never empties `public/` so the Vue `ichava.js`/`ichava.css` output is untouched.
//
//   npx vite build --config vite.react.config.ts
//
// The UI comes from the sibling component library `@ichava/react-browser`, aliased
// to its source so it bundles without a publish step (add it as a `file:` dep too:
//   npm i react@19 react-dom@19 file:../react-browser ).

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const lib = (p: string) => fileURLToPath(new URL(`../react-browser/${p}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ichava/react-browser/styles.css': lib('src/styles/theme.css'),
      '@ichava/react-browser': lib('src/index.ts'),
    },
  },
  build: {
    outDir: 'public',
    emptyOutDir: false, // NEVER wipe the Vue ichava.js/ichava.css output
    cssCodeSplit: false, // single CSS file, like the Vue build
    manifest: false, // Blade loads a fixed path, not a manifest
    rollupOptions: {
      input: 'resources/assets/scripts/react/main.tsx',
      output: {
        entryFileNames: 'assets/js/ichava-react.js',
        chunkFileNames: 'assets/js/ichava-react-[name].js',
        assetFileNames: (info) =>
          info.names?.some((n) => n.endsWith('.css')) ? 'assets/css/ichava-react.css' : 'assets/[name][extname]',
      },
    },
  },
});
