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
 * happy-dom is used as the DOM environment so DOMPurify, Vue Test Utils,
 * and any code that touches `window`/`document` works without launching a
 * real browser.
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
        environment: 'happy-dom',
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
