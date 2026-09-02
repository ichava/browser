import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vitest configuration for the browser package frontend.
 *
 * Run with: npm run test:js
 *
 * Tests live alongside their source under `resources/assets/scripts/`
 * with a `.test.ts` or `.spec.ts` suffix (or under any `__tests__/` dir).
 * jsdom is the DOM environment. It is not interchangeable with happy-dom here:
 * under happy-dom (tested at both 15 and 20) DOMPurify strips *every* element --
 * `sanitize('<b>hi</b>')` returns `hi` -- so the sanitiser suite passed by
 * returning nothing, and every "strips X" assertion was true for the wrong
 * reason. `V50` in .claude/audits/AUDIT.md. If you change this line, run the
 * positive assertions in sanitizeSvg.test.ts and check they still pass.
 */
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/assets/scripts', import.meta.url)),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: [
            'resources/assets/scripts/**/*.{test,spec}.{ts,vue}',
            'resources/assets/scripts/**/__tests__/**/*.{ts,vue}',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['resources/assets/scripts/**/*.{ts,vue}'],
            exclude: ['resources/assets/scripts/**/*.{test,spec}.{ts,vue}'],
        },
    },
})
