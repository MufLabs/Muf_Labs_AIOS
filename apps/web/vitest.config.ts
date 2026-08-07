import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    env: {
      NODE_ENV: 'test',
    },
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.turbo/**', '**/*.stories.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/vitest.config.ts',
        '**/main.tsx',
        '**/vite-env.d.ts',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    deps: {
      inline: ['@aios/shared', '@muf/tbit-core'],
    },
  },
  resolve: {
    alias: {
      '@aios/web': resolve(__dirname, 'src'),
      '@aios/shared': resolve(__dirname, '../../packages/shared/src'),
      '@muf/tbit-core': resolve(__dirname, '../../packages/tbit-core/src'),
      '@aios/ui': resolve(__dirname, '../../packages/ui/src'),
    },
  },
});