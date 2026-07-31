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
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/vitest.config.ts',
        'src/apiCompat.ts', // Legacy compat layer
        'src/*Compat.ts', // All compat layers
      ],
    },
    setupFiles: ['../../tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // T-Bit tests need isolation
      },
    },
    env: {
      TBIT_ENCRYPTION_SECRET: 'test-encryption-secret-32-chars-minimum-for-testing',
    },
  },
  resolve: {
    alias: {
      '@muf/tbit-core': resolve(__dirname, 'src'),
      '@aios/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
