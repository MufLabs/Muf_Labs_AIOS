/**
 * Global test setup for AIOS monorepo
 * Runs before all test files
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Global test timeout
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress specific console logs during tests
  console.log = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  // Keep error for debugging
  console.error = originalConsole.error;
});

afterAll(() => {
  // Restore console
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Global test utilities
declare global {
  namespace Vi {
    interface Jest {
      // Custom matchers can be added here
    }
  }
}

// Extend expect with custom matchers
import { expect } from 'vitest';

expect.extend({
  // Custom matcher for T-Bit record structure
  toBeValidTBitRecord(received: any) {
    const pass =
      received &&
      typeof received.id === 'string' &&
      typeof received.payload === 'string' &&
      typeof received.vit === 'string' &&
      typeof received.antiVit === 'string' &&
      typeof received.timestamp === 'number';

    return {
      pass,
      message: () =>
        pass
          ? 'Expected value not to be a valid T-Bit record'
          : 'Expected value to be a valid T-Bit record with id, payload, vit, antiVit, timestamp',
    };
  },

  // Custom matcher for API response structure
  toBeValidApiResponse(received: any) {
    const pass =
      received &&
      typeof received.success === 'boolean' &&
      (received.success ? received.data !== undefined : received.error !== undefined);

    return {
      pass,
      message: () =>
        pass
          ? 'Expected value not to be a valid API response'
          : 'Expected value to be a valid API response with success, data/error',
    };
  },
});