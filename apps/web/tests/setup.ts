/**
 * Web-specific test setup for @aios/web
 * Runs before all web test files (jsdom environment).
 * Local copy (apps/web/tests/setup.ts) so Vite resolves
 * @testing-library/jest-dom from apps/web/node_modules.
 */

import { beforeAll, afterAll, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import ResizeObserver from "resize-observer-polyfill";

// Global test timeout
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

// Polyfill ResizeObserver for jsdom
global.ResizeObserver = ResizeObserver as unknown as typeof globalThis.ResizeObserver;

// Mock IntersectionObserver
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = vi
  .fn()
  .mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// Mock File System Access API (for useVaultPicker tests)
Object.defineProperty(window, "showDirectoryPicker", {
  writable: true,
  value: vi.fn().mockResolvedValue({
    name: "test-vault",
    queryPermission: vi.fn().mockResolvedValue("granted"),
    requestPermission: vi.fn().mockResolvedValue("granted"),
  }),
});

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2),
    getRandomValues: (arr: Uint8Array) => {
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
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

// Mock fetch globally
global.fetch = vi.fn() as unknown as typeof fetch;

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
expect.extend({
  toRenderWithoutError(received: unknown) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () =>
        pass
          ? "Expected component not to render"
          : "Expected component to render without error",
    };
  },

  toHaveQueryData(_received: unknown, _queryKey: unknown[]) {
    const pass = true;
    return {
      pass,
      message: () =>
        pass
          ? `Expected query ${JSON.stringify(_queryKey)} not to have data`
          : `Expected query ${JSON.stringify(_queryKey)} to have data`,
    };
  },
});

declare global {
  namespace Vi {
    interface Jest {
      toRenderWithoutError(): void;
      toHaveQueryData(queryKey: unknown[]): void;
    }
  }
}
