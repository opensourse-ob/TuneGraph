import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  root: './client',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
})
