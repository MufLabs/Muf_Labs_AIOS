import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/**/*.test.ts',
      'apps/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/vitest.config.ts',
        '**/tests/**',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@muf/tbit-core': resolve(__dirname, 'packages/tbit-core/src'),
      '@aios/shared': resolve(__dirname, 'packages/shared/src'),
      '@aios/kernel': resolve(__dirname, 'packages/kernel/src'),
      '@aios/api': resolve(__dirname, 'apps/api/src'),
      '@aios/web': resolve(__dirname, 'apps/web/src'),
      '@aios/agents': resolve(__dirname, 'packages/agents/src'),
      '@aios/workflow': resolve(__dirname, 'packages/workflow/src'),
      '@aios/llm': resolve(__dirname, 'packages/llm/src'),
      '@aios/database': resolve(__dirname, 'packages/database/src'),
      '@aios/ui': resolve(__dirname, 'packages/ui/src'),
    },
  },
});
