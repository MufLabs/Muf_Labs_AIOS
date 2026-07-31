/**
 * Kernel test harness for integration testing
 * Provides controlled kernel lifecycle for testing
 */

import { vi, beforeEach, afterEach } from 'vitest';
import type { Kernel, KernelConfig, KernelServices } from '@aios/kernel';

/**
 * Mock kernel services for isolated testing
 */
export interface TestKernelServices {
  memory: any;
  storage: any;
  encryption: any;
  permissions: any;
  events: any;
  sessions: any;
}

/**
 * Creates a mock kernel for testing
 */
export function createTestKernel(config?: Partial<KernelConfig>): Kernel & { services: TestKernelServices; shutdown: () => Promise<void> } {
  const services: TestKernelServices = {
    memory: createMockMemoryService(),
    storage: createMockStorageService(),
    encryption: createMockEncryptionService(),
    permissions: createMockPermissionsService(),
    events: createMockEventBus(),
    sessions: createMockSessionService(),
  };

  const kernel = {
    config: {
      name: 'test-kernel',
      version: '1.0.0-test',
      ...config,
    },
    services,
    state: 'initialized' as 'initialized' | 'running' | 'shutdown',
    async boot() {
      this.state = 'running';
      // Initialize all services
      await Promise.all(
        Object.values(this.services).map((s) => s.initialize?.())
      );
    },
    async shutdown() {
      this.state = 'shutdown';
      await Promise.all(
        Object.values(this.services).map((s) => s.shutdown?.())
      );
    },
    getService<T>(name: keyof TestKernelServices): T {
      return this.services[name] as T;
    },
    // Test helpers
    reset() {
      this.state = 'initialized';
      Object.values(this.services).forEach((s) => s.reset?.());
    },
  } as Kernel & { services: TestKernelServices; shutdown: () => Promise<void> };

  return kernel;
}

function createMockMemoryService() {
  const memories = new Map<string, any>();

  return {
    async initialize() {},
    async shutdown() {},
    reset() {
      memories.clear();
    },
    async remember(key: string, payload: any) {
      const record = { id: key, payload, timestamp: Date.now() };
      memories.set(key, record);
      return record;
    },
    async recall(key: string) {
      return memories.get(key) || null;
    },
    async getContext(query: string, limit = 10) {
      return Array.from(memories.values()).slice(0, limit);
    },
    async getGraph() {
      const nodes = Array.from(memories.entries()).map(([id, data]) => ({ id, ...data }));
      const links: any[] = [];
      return { nodes, links };
    },
  };
}

function createMockStorageService() {
  const data = new Map<string, Uint8Array>();

  return {
    async initialize() {},
    async shutdown() {},
    reset() {
      data.clear();
    },
    async write(key: string, value: Uint8Array | string) {
      const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
      data.set(key, bytes);
      return { key, size: bytes.length };
    },
    async read(key: string) {
      return data.get(key) || null;
    },
    async delete(key: string) {
      return data.delete(key);
    },
    async list(prefix?: string) {
      const keys = Array.from(data.keys());
      return prefix ? keys.filter((k) => k.startsWith(prefix)) : keys;
    },
  };
}

function createMockEncryptionService() {
  const keyRing = new Map<string, Uint8Array>();
  let activeKeyId = 'test-key-1';

  keyRing.set(activeKeyId, new Uint8Array(32).fill(1));

  return {
    async initialize() {},
    async shutdown() {},
    reset() {
      keyRing.clear();
      keyRing.set('test-key-1', new Uint8Array(32).fill(1));
      activeKeyId = 'test-key-1';
    },
    async generateKey(id?: string) {
      const keyId = id || `key-${Date.now()}`;
      const key = new Uint8Array(32).fill(Math.floor(Math.random() * 256));
      keyRing.set(keyId, key);
      return { keyId, key };
    },
    async activateKey(keyId: string) {
      if (!keyRing.has(keyId)) throw new Error(`Key ${keyId} not found`);
      activeKeyId = keyId;
      return { keyId };
    },
    async getActiveKey() {
      return { keyId: activeKeyId, key: keyRing.get(activeKeyId)! };
    },
    async encrypt(data: Uint8Array, keyId?: string) {
      const key = keyRing.get(keyId || activeKeyId)!;
      // Simple XOR for testing (NOT secure)
      const encrypted = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        encrypted[i] = data[i] ^ key[i % key.length];
      }
      return { encrypted, keyId: keyId || activeKeyId };
    },
    async decrypt(encrypted: Uint8Array, keyId: string) {
      const key = keyRing.get(keyId)!;
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ key[i % key.length];
      }
      return decrypted;
    },
  };
}

function createMockPermissionsService() {
  const policies = new Map<string, any>();

  return {
    async initialize() {},
    async shutdown() {},
    reset() {
      policies.clear();
    },
    async getPolicy(agentId: string) {
      return policies.get(agentId) || { permissions: [] };
    },
    async setPolicy(agentId: string, policy: any) {
      policies.set(agentId, policy);
      return policy;
    },
    async checkPermission(agentId: string, action: string, resource: string) {
      const policy = policies.get(agentId);
      if (!policy) return { allowed: false, reason: 'No policy' };
      const perm = policy.permissions?.find((p: any) => p.action === action && p.resource === resource);
      return { allowed: !!perm?.allowed, reason: perm?.reason };
    },
  };
}

function createMockEventBus() {
  const subscribers = new Map<string, Set<Function>>();
  const eventLog: any[] = [];

  return {
    async initialize() {},
    async shutdown() {},
    reset() {
      subscribers.clear();
      eventLog.length = 0;
    },
    subscribe(event: string, handler: Function) {
      if (!subscribers.has(event)) subscribers.set(event, new Set());
      subscribers.get(event)!.add(handler);
      return () => subscribers.get(event)?.delete(handler);
    },
    async publish(event: string, data: any) {
      eventLog.push({ event, data, timestamp: Date.now() });
      const handlers = subscribers.get(event);
      if (handlers) {
        await Promise.all(Array.from(handlers).map((h) => h(data)));
      }
    },
    getEventLog() {
      return [...eventLog];
    },
  };
}

function createMockSessionService() {
  const sessions = new Map<string, any>();

  return {
    async initialize() {},
    async shutdown() {},
    reset() {
      sessions.clear();
    },
    async createSession(context: any) {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const session = { id: sessionId, context, createdAt: Date.now(), state: 'active' };
      sessions.set(sessionId, session);
      return session;
    },
    async getSession(sessionId: string) {
      return sessions.get(sessionId) || null;
    },
    async updateSession(sessionId: string, updates: any) {
      const session = sessions.get(sessionId);
      if (!session) return null;
      Object.assign(session, updates);
      return session;
    },
    async closeSession(sessionId: string) {
      const session = sessions.get(sessionId);
      if (!session) return false;
      session.state = 'closed';
      return true;
    },
  };
}

/**
 * Kernel test fixture with lifecycle management
 */
export class KernelTestHarness {
  private kernel: ReturnType<typeof createTestKernel> | null = null;

  async setup(config?: Partial<KernelConfig>) {
    this.kernel = createTestKernel(config);
    await this.kernel.boot();
    return this.kernel;
  }

  async teardown() {
    if (this.kernel) {
      await this.kernel.shutdown();
      this.kernel = null;
    }
  }

  getKernel() {
    if (!this.kernel) throw new Error('Kernel not initialized. Call setup() first.');
    return this.kernel;
  }

  getServices(): TestKernelServices {
    return this.getKernel().services;
  }
}

/**
 * Vitest fixture for kernel tests
 */
export function kernelTestFixture() {
  const harness = new KernelTestHarness();

  beforeEach(async () => {
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  return harness;
}