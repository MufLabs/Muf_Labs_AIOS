/**
 * Temporary vault fixture for T-Bit tests
 * Creates isolated vault directories for testing without a test database
 */
import { TBitStorageService } from '@muf/tbit-core';
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
export declare function createTestVault(spaceId?: string): Promise<TestVault>;
/**
 * Creates multiple test vaults for multi-vault testing
 */
export declare function createTestVaults(count: number): Promise<TestVault[]>;
/**
 * Cleanup multiple vaults
 */
export declare function cleanupTestVaults(vaults: TestVault[]): Promise<void>;
/**
 * Writes a test file to the vault
 */
export declare function writeTestFile(vault: TestVault, relativePath: string, content: string): Promise<string>;
/**
 * Reads a test file from the vault
 */
export declare function readTestFile(vault: TestVault, relativePath: string): Promise<string>;
/**
 * Creates a test vault with pre-populated data
 */
export declare function createSeededTestVault(seedData: Map<string, any>): Promise<TestVault>;
/**
 * Test vault with encryption key rotation simulation
 */
export declare function createTestVaultWithRotation(): Promise<TestVault & {
    rotateKey: () => Promise<void>;
}>;
/**
 * Creates a large test vault for performance testing
 */
export declare function createLargeTestVault(recordCount?: number): Promise<TestVault>;
//# sourceMappingURL=test-vault.d.ts.map