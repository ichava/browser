import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vitest configuration for the browser package frontend.
 *
 * Run with: npm run test:js
 *
 * Vue tests live alongside their source under `resources/assets/scripts/`;
 * migrated React tests live under `resources/js/` and import via the `@js`
 * alias (a shared `@` would collide on `components/`, `lib/` and `styles/`).
 * jsdom is the DOM environment. It is not interchangeable with happy-dom here:
 * under happy-dom (tested at both 15 and 20) DOMPurify strips *every* element --
 * `sanitize('<b>hi</b>')` returns `hi` -- so the sanitiser suite passed by
 * returning nothing, and every "strips X" assertion was true for the wrong
 * reason. `V50` in .claude/audits/AUDIT.md. If you change this line, run the
 * positive assertions in sanitizeSvg.test.ts and check they still pass.
 */
export default defineConfig({
    plugins: [vue(), react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/assets/scripts', import.meta.url)),
            '@js': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./resources/js/test/setup.ts'],
        include: [
            'resources/assets/scripts/**/*.{test,spec}.{ts,vue}',
            'resources/assets/scripts/**/__tests__/**/*.{ts,vue}',
            'resources/js/**/*.{test,spec}.{ts,tsx}',
            'resources/js/**/__tests__/**/*.{ts,tsx}',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['resources/assets/scripts/**/*.{ts,vue}', 'resources/js/**/*.{ts,tsx}'],
            exclude: ['resources/assets/scripts/**/*.{test,spec}.{ts,vue}', 'resources/js/**/*.{test,spec}.{ts,tsx}'],
        },
    },
})
