/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tell Vitest we’re testing a backend (Node) app
    environment: 'node',

    // Where to look for test files
    include: ['__tests__/**/*.test.ts'],

    // Optional: clear mocks between tests
    clearMocks: true,

    // Show detailed output
    reporters: ['verbose'],

    // Optional: enable coverage if you want
    coverage: {
      provider: 'v8',
      thresholds: { lines: 85, statements: 85, branches: 90, functions: 95 },
      // Include all executable backend production files, including untested ones.
      include: ['app.ts', 'controllers/**/*.ts', 'middlewares/**/*.ts', 'routes/**/*.ts', 'utils/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**', '**/*.d.ts', 'types/**', 'dist/**', 'coverage/**', 'index.ts'],
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
