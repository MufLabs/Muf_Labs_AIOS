import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/vitest.config.ts',
      ],
    },
    setupFiles: ['../../tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
  resolve: {
    alias: {
      '@aios/api': resolve(__dirname, 'src'),
      '@aios/shared': resolve(__dirname, '../../packages/shared/src'),
      '@aios/kernel': resolve(__dirname, '../../packages/kernel/src'),
      '@muf/tbit-core': resolve(__dirname, '../../packages/tbit-core/src'),
      '@aios/agents': resolve(__dirname, '../../packages/agents/src'),
      '@aios/workflow': resolve(__dirname, '../../packages/workflow/src'),
    },
  },
});