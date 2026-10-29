import { defineConfig } from 'vitest/config'

/* Tests unitaires uniquement : les scénarios Playwright (tests/e2e) se lancent avec `npm run test:e2e`
   et demandent un PocketBase local, ils ne doivent pas être ramassés par Vitest. */
export default defineConfig({
    test: {
        include: ['*.test.js'],
        exclude: ['node_modules/**', 'tests/**']
    }
})
