/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Vite Configuration - Ichava Package
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Uses shared ViteConfigGenerator with Tailwind CSS v4:
 * - ✅ Separate CSS entry point (no CSS imports in JS)
 * - ✅ enableCssCodeSplit: false for single CSS output
 * - ✅ Standalone postcss.config.js for Tailwind v4
 * - ✅ Predictable asset naming
 * - ✅ Automatic build directory cleanup
 * - ✅ No unwanted chunk generation (fixed at source)
 * - ✅ Vue 3 support with custom element detection
 *
 * Build Commands:
 * - npm run build      → Development build with source maps
 * - npm run build:prod → Production build (minified, optimized)
 * - npm run watch      → Watch mode with HMR
 * - npm run dev        → Development server on port 5174
 *
 * @version 5.1.0
 * @see https://vitejs.dev/config/
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

/*
 * The shared generator lives outside every repository, at the workspace root:
 *
 *     <workspace>/.scripts/vite/vite-configurator.js
 *
 * Four levels up from `packages/browser` -- browser, packages, ichava,
 * opensource -- which lands on the workspace root. It was three before the
 * 2026-09-21 restructure moved this repo a level deeper.
 *
 * A bare `import` of a path that is not there fails with an ERR_MODULE_NOT_FOUND
 * naming a resolved absolute path, which reads like a broken install rather than
 * a workspace this package was never checked out into. Since the file is outside
 * every repo by design, its absence is the normal case for anyone who cloned
 * this package on its own -- a contributor, CI, a consumer building assets --
 * and it deserves an error that says so.
 *
 * Deliberately not falling back to a locally-reconstructed config. The generator
 * owns asset naming and the CSS-only-entry stub, and a fallback that produced
 * subtly different output than the committed assets would be worse than one that
 * refuses: the build would succeed and ship the wrong files.
 */
const GENERATOR_URL = new URL('../../../../.scripts/vite/vite-configurator.js', import.meta.url);

if (! existsSync(fileURLToPath(GENERATOR_URL))) {
    throw new Error(
        [
            'Cannot build: the shared Vite generator was not found.',
            '',
            `  expected: ${fileURLToPath(GENERATOR_URL)}`,
            '',
            'It lives at <workspace>/.scripts/vite/vite-configurator.js, outside every',
            'repository, so it is present only in the host workspace this package is',
            'developed in. Building assets from a standalone clone is not supported.',
            '',
            'Prebuilt assets are committed under public/assets, so no build is needed to',
            'use this package -- only to change its frontend.',
        ].join('\n'),
    );
}

const { ViteConfigGenerator } = await import(GENERATOR_URL.href);

const generator = new ViteConfigGenerator('ichava', 'package', import.meta.url);

// Generate STRONGER version hash for cache busting - using both timestamp and random
const versionHash = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

const config = generator
    .configure({
        // Entry points - explicit naming with version for cache busting
        entries: {
            scripts: 'scripts',  // → ichava.js
            styles: 'styles',    // → ichava.css
        },

        // Source paths
        sourcePaths: {
            scripts: {
                scripts: 'resources/assets/scripts/ichava.js',
            },
            styles: {
                styles: 'resources/assets/styles/ichava.scss',
            },
        },

        // Aliases for easy imports (ORDER MATTERS - more specific paths first)
        aliases: {
            // shadcn-vue components (MUST be before @)
            '@/components/ui': 'resources/assets/scripts/components/shadcn',
            // v4 TypeScript ichava module
            '@/ichava-ts': 'resources/assets/scripts/ichava-ts',
            // General aliases
            '@': 'resources/assets/scripts',
            '@components': 'resources/assets/scripts/components',
            '@composables': 'resources/assets/scripts/composables',
            '@stores': 'resources/assets/scripts/stores',
            '@lib': 'resources/assets/scripts/lib',
            '@styles': 'resources/assets/styles',
            // Use Vue build with runtime compiler for dynamic templates
            // Required for components with runtime template compilation
            'vue': 'vue/dist/vue.esm-bundler.js',
        },

        // CSS best practices
        enableCssCodeSplit: false, // ✅ CRITICAL: Single CSS file output

        // Vue 3 plugin with custom element support
        customPlugins: [
            vue({
                template: {
                    compilerOptions: {
                        isCustomElement: (tag) => tag.startsWith('x-'),
                    },
                },
            }),
        ],

        // Development server + PostCSS configuration
        viteConfig: {
            // Cache busting
            define: {
                __APP_VERSION__: JSON.stringify(versionHash),
            },
            css: {
                // Use standalone postcss.config.js for Tailwind v4
                postcss: './postcss.config.js',
            },
            server: {
                port: 5174,
                strictPort: false,
                host: '0.0.0.0',
                origin: 'http://localhost:5174', // Direct port access
                cors: {
                    origin: '*', // Allow all origins for development
                    credentials: true,
                },
            },
            optimizeDeps: {
                include: ['vue', 'pinia', 'radix-vue', 'lucide-vue-next'],
            },
        },
    })
    .generate();

export default config;
