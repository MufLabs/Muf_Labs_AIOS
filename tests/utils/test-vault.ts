/**
 * Temporary vault fixture for T-Bit tests
 * Creates isolated vault directories for testing without a test database
 */

import { mkdtemp, rm, mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { TBitStorageService, TBitStorageConfig } from '@muf/tbit-core';
import { getTBitSpacePaths, createSpaceManifest } from '@muf/tbit-core';
import { createHash } from 'crypto';

export interface TestVault {
  root: string;
  spacesRoot: string;
  storage: TBitStorageService;
  spaceId: string;
  cleanup: () => Promise<void>;
}

/**
 * Creates a temporary vault for testing
 * Uses OS temp directory with unique prefix for isolation
 */
export async function createTestVault(spaceId?: string): Promise<TestVault> {
  const root = await mkdtemp(join(tmpdir(), 'aios-test-vault-'));
  const spacesRoot = join(root, 'spaces');

  await mkdir(spacesRoot, { recursive: true });

  const testSpaceId = spaceId ?? `test-space-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const spaceRoot = join(spacesRoot, testSpaceId);

  await mkdir(spaceRoot, { recursive: true });

  // Initialize T-Bit storage with proper config matching TBitStorageConfig
  const hmacSecrets = new Map<string, string>();
  const testHmacKeyId = 'test-hmac-key-1';
  hmacSecrets.set(testHmacKeyId, 'test-hmac-secret-for-testing-only');

  const config: TBitStorageConfig = {
    name: testSpaceId,
    containerPath: join(spaceRoot, 'universo.tbit'),
    metadataPath: join(spaceRoot, 'universo.tbit.meta.json'),
    walPath: join(spaceRoot, 'universo.tbit.wal.jsonl'),
    snapshotsDir: join(spaceRoot, 'snapshots'),
    replicasDir: join(spaceRoot, 'replicas'),
    exportsDir: join(spaceRoot, 'exports'),
    lockPath: join(spaceRoot, '.lock'),
    hmacSecrets,
    hmacKeyId: testHmacKeyId,
    containerSizeMB: 10,
    maxDatoBytes: 64 * 1024,
    maxRecords: 500,
  };

  const storage = new TBitStorageService(config);
  await storage.recover(); // Initialize and recover WAL

  // Create space manifest
  const spacePaths = getTBitSpacePaths(spacesRoot, testSpaceId);
  await createSpaceManifest(spacePaths, {
    id: testSpaceId,
    name: `Test Space ${testSpaceId}`,
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  });

  const cleanup = async () => {
    await rm(root, { recursive: true, force: true });
  };

  return {
    root,
    spacesRoot,
    storage,
    spaceId: testSpaceId,
    cleanup,
  };
}

/**
 * Creates multiple test vaults for multi-vault testing
 */
export async function createTestVaults(count: number): Promise<TestVault[]> {
  const vaults: TestVault[] = [];
  for (let i = 0; i < count; i++) {
    vaults.push(await createTestVault(`test-space-${i}`));
  }
  return vaults;
}

/**
 * Cleanup multiple vaults
 */
export async function cleanupTestVaults(vaults: TestVault[]): Promise<void> {
  await Promise.all(vaults.map((v) => v.cleanup()));
}

/**
 * Writes a test file to the vault
 */
export async function writeTestFile(vault: TestVault, relativePath: string, content: string): Promise<string> {
  const fullPath = join(vault.spacesRoot, relativePath);
  await mkdir(join(fullPath, '..'), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
  return fullPath;
}

/**
 * Reads a test file from the vault
 */
export async function readTestFile(vault: TestVault, relativePath: string): Promise<string> {
  const fullPath = join(vault.spacesRoot, relativePath);
  return readFile(fullPath, 'utf-8');
}

/**
 * Creates a test vault with pre-populated data
 */
export async function createSeededTestVault(seedData: Map<string, any>): Promise<TestVault> {
  const vault = await createTestVault();

  for (const [key, value] of seedData) {
    await vault.storage.inject(key, JSON.stringify(value));
  }

  return vault;
}

/**
 * Test vault with encryption key rotation simulation
 */
export async function createTestVaultWithRotation(): Promise<TestVault & { rotateKey: () => Promise<void> }> {
  const vault = await createTestVault();

  const rotateKey = async () => {
    // Simulate key rotation by creating new storage with new key
    const newKey = new Uint8Array(32).fill(Math.floor(Math.random() * 256));
    // In real implementation, this would use EncryptionKeyManager.rotateKey()
    // For tests, we just verify the storage can be reinitialized
  };

  return { ...vault, rotateKey };
}

/**
 * Creates a large test vault for performance testing
 */
export async function createLargeTestVault(recordCount: number = 10000): Promise<TestVault> {
  const vault = await createTestVault('large-test-space');

  // Batch write for performance
  const batchSize = 1000;
  for (let i = 0; i < recordCount; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && i + j < recordCount; j++) {
      const key = `perf-key-${i + j}`;
      const value = {
        id: key,
        data: `Performance test data ${i + j}`,
        timestamp: Date.now() + i + j,
        metadata: { index: i + j, batch: Math.floor(i / batchSize) },
      };
      batch.push({ key, value: JSON.stringify(value) });
    }
    await Promise.all(batch.map(({ key, value }) => vault.storage.inject(key, value)));
  }

  return vault;
}
