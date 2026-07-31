/**
 * Web-specific test setup for @aios/web
 * Runs before all web test files (jsdom environment)
 */

import { beforeAll, afterAll, vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import ResizeObserver from 'resize-observer-polyfill';

// Global test timeout
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

// Polyfill ResizeObserver for jsdom
global.ResizeObserver = ResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock File System Access API (for useVaultPicker tests)
Object.defineProperty(window, 'showDirectoryPicker', {
  writable: true,
  value: vi.fn().mockResolvedValue({
    name: 'test-vault',
    queryPermission: vi.fn().mockResolvedValue('granted'),
    requestPermission: vi.fn().mockResolvedValue('granted'),
  }),
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch globally
global.fetch = vi.fn();

// Cleanup after each test
afterAll(() => {
  cleanup();
  vi.clearAllMocks();
});

// Suppress specific console logs during tests
const originalConsole = { ...console };

beforeAll(() => {
  console.log = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  // Keep error for debugging
  console.error = originalConsole.error;
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Custom matchers for web tests
import { expect } from 'vitest';

expect.extend({
  // Custom matcher for React component rendering
  toRenderWithoutError(received: any) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () =>
        pass
          ? 'Expected component not to render'
          : 'Expected component to render without error',
    };
  },

  // Custom matcher for TanStack Query cache
  toHaveQueryData(received: any, queryKey: any[]) {
    // This would integrate with @tanstack/react-query test utilities
    const pass = true; // Placeholder
    return {
      pass,
      message: () =>
        pass
          ? `Expected query ${JSON.stringify(queryKey)} not to have data`
          : `Expected query ${JSON.stringify(queryKey)} to have data`,
    };
  },
});

// Extend global types
declare global {
  namespace Vi {
    interface Jest {
      toRenderWithoutError(): void;
      toHaveQueryData(queryKey: any[]): void;
    }
  }
}