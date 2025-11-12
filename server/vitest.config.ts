/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tell Vitest we’re testing a backend (Node) app
    environment: 'node',

    // Where to look for test files
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts', '__tests__/**/*.test.ts'],

    // Optional: clear mocks between tests
    clearMocks: true,

    // Show detailed output
    reporters: ['verbose'],

    // Optional: enable coverage if you want
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
    },
  },
});
