import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/app/**'],
      reporter: ['text', 'lcov', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/domain': path.resolve(__dirname, 'src/domain'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/ui': path.resolve(__dirname, 'src/ui'),
    },
  },
})
