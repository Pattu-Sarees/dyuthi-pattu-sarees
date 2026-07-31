import { defineConfig, devices } from '@playwright/experimental-ct-react';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vite/rollup prefer forward-slash paths even on Windows.
const posix = (p: string) => p.split('\\').join('/');

/**
 * Component-testing config for the InfiniteProductsGrid paging logic.
 * Runs ONLY the tests in ./tests-ct — completely separate from the E2E suite.
 * No database and no app-code changes: ProductCard is stubbed via a Vite alias
 * so we test the grid's slice + IntersectionObserver reveal in isolation.
 *
 * Run:  npx playwright test -c playwright-ct.config.ts
 */
export default defineConfig({
  testDir: './tests-ct',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
    launchOptions: { slowMo: 600 },
    ctViteConfig: {
      plugins: [react()],
      resolve: {
        alias: [
          // Swap the heavy ProductCard (next/image, stores, sonner) for a light stub.
          // Regex must match the WHOLE specifier "./ProductCard" (and the @/ form),
          // otherwise only "/ProductCard" is replaced and a stray "." breaks the path.
          { find: /^(?:\.\/|.*\/)ProductCard$/, replacement: posix(resolve(__dirname, 'tests-ct/ProductCardStub.tsx')) },
          // Map the app's "@/..." imports to src (matches tsconfig paths). Keep AFTER
          // the ProductCard rule so the more specific alias wins first.
          { find: '@', replacement: posix(resolve(__dirname, 'src')) },
        ],
      },
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
