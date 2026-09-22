// Self-contained Vite config for the Inertia.js + React 19 entry.
//
// Deliberately does NOT depend on the shared `ViteConfigGenerator` (lives
// outside this checkout, can fail off-host) and does NOT use the Vue plugin.
// Builds ONE fixed-name bundle — `public/assets/js/inertia-app.js` +
// `public/assets/css/inertia-app.css` — matching the `ichava::app` Blade root
// template, and never empties `public/` so the Vue `ichava.js`/`ichava.css`
// and React parallel-run `ichava-react.js` outputs are untouched.
//
//   npx vite build --config vite.inertia.config.ts            (development)
//   npx vite build --config vite.inertia.config.ts --mode production
//   npx vite --config vite.inertia.config.ts                  (dev server, :5174)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // The migrated React tree imports itself as `@js/...`; the legacy
            // Vue tree (separate config) keeps `@` → scripts. Shared `@` would
            // collide on `components/`, `lib/` and `styles/`.
            '@js': fileURLToPath(new URL('./resources/js', import.meta.url)),
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    css: {
        postcss: './postcss.config.js',
    },
    server: {
        port: 5174,
        strictPort: false,
        host: '0.0.0.0',
        cors: {
            origin: '*',
            credentials: true,
        },
    },
    build: {
        outDir: 'public',
        emptyOutDir: false, // NEVER wipe the Vue / React parallel-run output
        cssCodeSplit: false, // single CSS file, like the other builds
        manifest: false, // Blade loads a fixed path, not a manifest
        rollupOptions: {
            input: 'resources/js/app.tsx',
            output: {
                entryFileNames: 'assets/js/inertia-app.js',
                chunkFileNames: 'assets/js/inertia-app-[name].js',
                assetFileNames: (info) =>
                    info.names?.some((n) => n.endsWith('.css')) ? 'assets/css/inertia-app.css' : 'assets/[name][extname]',
            },
        },
    },
});
