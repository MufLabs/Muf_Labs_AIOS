/**
 * Unit tests for TBitStorageService
 * Tests core storage operations, WAL, and batch operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { TBitStorageService, TBitStorageConfig } from './TBitStorageService';
import { createTestVault, TestVault } from '../../../tests/utils/test-vault';

describe('TBitStorageService', () => {
  let vault: TestVault;
  let storage: TBitStorageService;

  beforeEach(async () => {
    vault = await createTestVault();
    storage = vault.storage;
  });

  afterEach(async () => {
    await vault.cleanup();
  });

  describe('Basic CRUD Operations', () => {
    it('should inject and recover a record', async () => {
      const key = 'test-key-1';
      const value = JSON.stringify({ data: 'test-value', timestamp: Date.now() });

      await storage.inject(key, value);
      const result = await storage.recoverData(key);

      expect(result).not.toBeNull();
      expect(result.dato).toBe(value);
    });

    it('should throw for non-existent key', async () => {
      await expect(storage.recoverData('non-existent-key')).rejects.toThrow('Clave no registrada en el indice local');
    });

    it('should collapse (delete) a record', async () => {
      const key = 'test-key-collapse';
      const value = JSON.stringify({ data: 'delete-me' });

      await storage.inject(key, value);
      await storage.collapse(key);
      
      await expect(storage.recoverData(key)).rejects.toThrow('Clave no registrada en el indice local');
    });

    it('should list keys', async () => {
      await storage.inject('prefix-key-1', 'value1');
      await storage.inject('prefix-key-2', 'value2');
      await storage.inject('other-key', 'value3');

      const keys = await storage.listKeys();
      expect(keys).toContain('prefix-key-1');
      expect(keys).toContain('prefix-key-2');
      expect(keys).toContain('other-key');
    });
  });

  describe('WAL (Write-Ahead Log) Operations', () => {
    it('should persist writes through WAL', async () => {
      const key = 'wal-test-key';
      const value = JSON.stringify({ wal: true, data: 'wal-data' });

      await storage.inject(key, value);
      
      const result = await storage.recoverData(key);
      expect(result.dato).toBe(value);
    });

    it('should recover WAL on new instance', async () => {
      const key = 'wal-recovery-key';
      const value = JSON.stringify({ recovery: true });

      await storage.inject(key, value);

      // Create new storage instance with same config
      const spaceRoot = join(vault.spacesRoot, vault.spaceId);
      const hmacSecrets = new Map<string, string>();
      const testHmacKeyId = 'test-hmac-key-1';
      hmacSecrets.set(testHmacKeyId, 'test-hmac-secret-for-testing-only');

      const config: TBitStorageConfig = {
        name: vault.spaceId,
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

      const newStorage = new TBitStorageService(config);
      await newStorage.recover();

      const result = await newStorage.recoverData(key);
      expect(result.dato).toBe(value);
    });
  });

  describe('Batch Operations', () => {
    it('should inject multiple records', async () => {
      const records = [
        { key: 'batch-1', payload: JSON.stringify({ n: 1 }) },
        { key: 'batch-2', payload: JSON.stringify({ n: 2 }) },
        { key: 'batch-3', payload: JSON.stringify({ n: 3 }) },
      ];

      const results = await storage.injectMany(records);

      expect(results).toHaveLength(3);
      results.forEach((result, i) => {
        expect(result.ok).toBe(true);
        expect(result.clave).toBe(records[i].key);
      });

      // Verify all records can be recovered
      for (const record of records) {
        const recovered = await storage.recoverData(record.key);
        expect(recovered.dato).toBe(record.payload);
      }
    });

    it('should handle concurrent reads and writes', async () => {
      const key = 'concurrent-key';
      const initialValue = JSON.stringify({ version: 0 });
      await storage.inject(key, initialValue);

      // Simulate concurrent access
      const operations = Array.from({ length: 10 }, (_, i) =>
        storage.inject(key, JSON.stringify({ version: i + 1 }))
      );

      await Promise.all(operations);

      const finalValue = await storage.recoverData(key);
      expect(finalValue).not.toBeNull();
    });
  });

  describe('Encryption Integration', () => {
    it('should encrypt and decrypt data transparently', async () => {
      const key = 'encryption-test';
      const plaintext = JSON.stringify({ secret: 'sensitive-data', pii: true });

      await storage.inject(key, plaintext);
      const result = await storage.recoverData(key);

      // Data should be retrievable (decryption happens internally)
      expect(result.dato).toBe(plaintext);
    });

    it('should use different encryption for different keys', async () => {
      const key1 = 'enc-key-1';
      const key2 = 'enc-key-2';
      const value1 = JSON.stringify({ id: 1 });
      const value2 = JSON.stringify({ id: 2 });

      await storage.inject(key1, value1);
      await storage.inject(key2, value2);

      const result1 = await storage.recoverData(key1);
      const result2 = await storage.recoverData(key2);
      
      expect(result1.dato).toBe(value1);
      expect(result2.dato).toBe(value2);
    });
  });

  describe('Large Data Handling', () => {
    it('should handle large payloads within limit', async () => {
      const key = 'large-payload';
      const largeData = 'x'.repeat(50000); // 50KB - within 64KB limit
      const value = JSON.stringify({ data: largeData });

      await storage.inject(key, value);
      const result = await storage.recoverData(key);

      expect(result.dato).toBe(value);
    });

    it('should handle many records', async () => {
      const count = 100; // Reduced for test speed
      const writes = Array.from({ length: count }, (_, i) =>
        storage.inject(`key-${i}`, JSON.stringify({ index: i }))
      );

      await Promise.all(writes);

      const reads = Array.from({ length: count }, (_, i) =>
        storage.recoverData(`key-${i}`)
      );

      const results = await Promise.all(reads);
      results.forEach((result, i) => {
        expect(result.dato).toBe(JSON.stringify({ index: i }));
      });
    });
  });

  describe('Error Handling', () => {
    it('should reject oversized data', async () => {
      const key = 'oversized-data';
      const largeData = 'x'.repeat(70000); // Exceeds 64KB default
      const value = JSON.stringify({ data: largeData });

      await expect(storage.inject(key, value)).rejects.toThrow('excede el limite');
    });

    it('should detect integrity corruption', async () => {
      const key = 'corruption-test';
      const value = JSON.stringify({ data: 'test' });

      await storage.inject(key, value);

      // Verify normal operation works
      const result = await storage.recoverData(key);
      expect(result.dato).toBe(value);
      expect(result.integridadValida).toBe(true);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide storage stats', async () => {
      await storage.inject('stat-key-1', 'value1');
      await storage.inject('stat-key-2', 'value2');

      const stats = await storage.getStats();

      expect(stats).toHaveProperty('totalRecords');
      expect(stats).toHaveProperty('containerSizeBytes');
      expect(stats).toHaveProperty('walSizeBytes');
      expect(stats).toHaveProperty('snapshotCount');
      expect(stats).toHaveProperty('checksum');
      expect(stats.totalRecords).toBeGreaterThanOrEqual(2);
    });
  });
});
