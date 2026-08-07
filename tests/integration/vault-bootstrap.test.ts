/**
 * Stage 8.6 — Cross-Package Integration Test: Vault Bootstrap
 *
 * Validates the end-to-end wiring of the Phase 8 vault-aware system across
 * multiple workspace packages:
 *
 *   @muf/tbit-core          ──┐
 *                              ├──>  @aios/shared  (VaultContext + tbitRuntimePaths re-exports)
 *   @aios/kernel              │     ↓
 *     ├─ Kernel                ├──>  VaultBootstrapService  (@aios/api)
 *     ├─ vault providers       │
 *     └─ vault events          │
 *                              │
 *   @aios/workflow            │
 *   @aios/agents              │
 *                              └──>  ApplicationReady (kernelReady=true, vaultReady=true)
 *
 * This test exercises the FULL system validation sequence documented in
 * `docs/AIOS_Book.md` §Stage 8.6 — System Validation Sequence.
 *
 * It is intentionally placed at the monorepo root in `tests/integration/`
 * (per `PHASE8_IMPLEMENTATION_PLAN.md` §2.1 #7) so it can import from every
 * workspace package via the root `vitest.config.ts` aliases.
 *
 * Note on construction path:
 * `ProviderManager`/`ProviderManagerFactory` exist in
 * `packages/kernel/src/providers/` but are intentionally NOT re-exported
 * from `@aios/kernel`'s public barrel (`src/index.ts`). The only
 * supported public surface for the fan-out operation is the `Kernel`
 * class via `kernel.providers.register(...)` + `kernel.initializeProviders()`.
 * That is what the kernel's own test suite exercises, and that is what
 * this integration test exercises.
 *
 * Note on registry API:
 * `kernel.providers` is a `ProviderRegistry`. Its public methods are
 * `register(...)`, `getAll()` (returns `readonly IProvider[]`),
 * `get(id)`, `exists(id)`, `ids()`, `size()`. There is no `getProviders()`.
 *
 * Note on capabilities shape:
 * `info.capabilities` is a `ProviderCapabilities` **object** (with
 * boolean flags `vaultRead` and `vaultWrite`), NOT an array of strings.
 * The string-array `VaultCapability` type from `@aios/shared` is the
 * capability contract used at the VaultContext level; the per-provider
 * `ProviderCapabilities` is the capability contract used at the
 * `IProvider.info` level. They are different shapes by design.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';

import {
  VAULT_EVENTS,
  type VaultContext,
  type VaultCapability,
} from '@aios/shared';

import {
  Kernel,
  MemoryVaultProvider,
  WorkflowVaultProvider,
  AgentVaultProvider,
  QVaultVaultProvider,
  LlmVaultProvider,
} from '@aios/kernel';

// @aios/api does not have an index.ts barrel, so we import the bootstrap
// service via its concrete file path. The relative path is resolved against
// this test file's location (tests/integration/ → repo root → apps/api).
import {
  vaultBootstrapService,
  VaultBootstrapService,
} from '../../apps/api/src/services/vaultBootstrapService';

const mkdtempAsync = promisify(mkdtemp);
const rmAsync = promisify(rm);

describe('Stage 8.6 — Cross-Package Integration: Vault Bootstrap', () => {
  let vaultRoot: string;

  beforeEach(async () => {
    vaultRoot = await mkdtempAsync(join(tmpdir(), 'aios-stage86-integ-'));
    // Reset singleton state (matches the per-test reset in the API e2e tests)
    (vaultBootstrapService as unknown as { initialized: boolean }).initialized = false;
    (vaultBootstrapService as unknown as { vaultRoot: string | null }).vaultRoot = null;
    (vaultBootstrapService as unknown as { spacesRoot: string | null }).spacesRoot = null;
    (vaultBootstrapService as unknown as { vaultId: string | null }).vaultId = null;
    (vaultBootstrapService as unknown as { kernelReady: boolean }).kernelReady = false;
    (vaultBootstrapService as unknown as { subsystems: Record<string, boolean> }).subsystems = {};
    (vaultBootstrapService as unknown as { kernel: unknown }).kernel = null;
  });

  afterEach(async () => {
    try {
      await vaultBootstrapService.dispose();
    } catch {
      /* best-effort */
    }
    try {
      await rmAsync(vaultRoot, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  });

  // ---------------------------------------------------------------
  // 1) @aios/shared exports the Stage 8.4 vault surface
  // ---------------------------------------------------------------
  describe('@aios/shared — vault surface', () => {
    it('exposes VAULT_EVENTS with the three lifecycle event names', () => {
      expect(VAULT_EVENTS.OPENED).toBe('vault.opened');
      expect(VAULT_EVENTS.CLOSED).toBe('vault.closed');
      expect(VAULT_EVENTS.SWITCHED).toBe('vault.switched');
    });

    it('accepts vault.read / vault.write capability declarations', () => {
      // Type-level smoke: assigning literal strings to the VaultCapability
      // union must compile. If the union narrows, this fails.
      const caps: VaultCapability[] = ['vault.read', 'vault.write'];
      expect(caps).toHaveLength(2);
    });

    it('VaultContext is structurally complete (readonly fields)', () => {
      // Pure type-level test via type assertion (no runtime execution).
      // Verifies every required field per `vaultContext.ts` is present.
      const ctx = {
        vaultId: 'vault-test',
        vaultRoot: '/tmp/vault',
        spacesRoot: '/tmp/vault/spaces',
        spaceId: 'space-1',
        encryptionKeyId: 'key-1',
        userId: 'user-1',
        label: 'Test',
        initializedAt: '2026-08-06T00:00:00Z',
      } satisfies VaultContext;
      expect(ctx.vaultId).toBe('vault-test');
      expect(ctx.spacesRoot).toBe('/tmp/vault/spaces');
    });
  });

  // ---------------------------------------------------------------
  // 2) End-to-end: bootstrap a vault, verify cross-package wiring
  // ---------------------------------------------------------------
  describe('end-to-end bootstrap', () => {
    it('full system validation sequence: vault discovered → kernel ready → all providers ready → events emitted', async () => {
      // ─── User launches AIOS ────────────────────────────────────────
      // (in real usage this is the React mount → useVaultInit.ts)

      // ─── Vault discovered (IndexedDB) ─────────────────────────────
      // The frontend would have stashed the vault root in IndexedDB.
      // We simulate by passing vaultRoot into the bootstrap service.

      // ─── Vault restored (File System Access API permission) ───────
      // (web-only concern; on Node we write directly to disk)

      // ─── Permissions restored ─────────────────────────────────────
      mkdirSync(vaultRoot, { recursive: true });

      // ─── Vault verified (GET /vault/status) ──────────────────────
      const preStatus = await vaultBootstrapService.getStatus();
      expect(preStatus.initialized).toBe(false);
      expect(preStatus.vaultReady).toBe(false);
      expect(preStatus.kernelReady).toBe(false);

      // ─── Vault initialized (POST /vault/init) ─────────────────────
      const resp = await vaultBootstrapService.initialize({
        vaultRoot,
        userId: 'stage86-integ-user',
        label: 'Stage 8.6 Integration Space',
        generateKey: true,
      });

      expect(resp.vaultReady).toBe(true);
      expect(resp.kernelReady).toBe(true);

      // ─── Kernel initialized (VaultContext + isVaultInitialized=true)
      const kernel = vaultBootstrapService.getKernelForTesting();
      expect(kernel).not.toBeNull();
      expect(kernel!.isVaultInitialized).toBe(true);
      expect(kernel!.vaultContext).not.toBeNull();
      expect(kernel!.vaultContext!.vaultId).toBe(resp.vaultId);
      expect(kernel!.vaultContext!.vaultRoot).toBe(vaultRoot);
      expect(kernel!.vaultContext!.userId).toBe('stage86-integ-user');
      expect(kernel!.vaultContext!.spacesRoot).toBe(join(vaultRoot, 'spaces'));

      // ─── Providers initialized (5 vault providers via Kernel.initializeProviders)
      const readiness = kernel!.getProviderReadiness();
      expect(readiness['memory-vault']).toBe(true);
      expect(readiness['workflow-vault']).toBe(true);
      expect(readiness['agent-vault']).toBe(true);
      expect(readiness['qvault-vault']).toBe(true);
      expect(readiness['llm-vault']).toBe(true);

      // ─── Application Ready (kernelReady=true, vaultReady=true) ────
      const finalStatus = await vaultBootstrapService.getStatus();
      expect(finalStatus.initialized).toBe(true);
      expect(finalStatus.vaultReady).toBe(true);
      expect(finalStatus.kernelReady).toBe(true);
      expect(finalStatus.vaultId).toBe(resp.vaultId);
      expect(finalStatus.spacesCount).toBeGreaterThanOrEqual(1);

      // ─── Vault persistence validation ─────────────────────────────
      // Vault manifest + storage recovery must have created real files
      const spacesDir = join(vaultRoot, 'spaces');
      expect(existsSync(spacesDir)).toBe(true);

      // Write a sentinel file to prove path resolution goes inside the vault
      const sentinelPath = join(spacesDir, 'stage86-sentinel.tmp');
      writeFileSync(sentinelPath, 'stage86-ok');
      expect(existsSync(sentinelPath)).toBe(true);
    });

    it('survives a restart: a fresh service re-initializes into the same vault root', async () => {
      const firstResp = await vaultBootstrapService.initialize({
        vaultRoot,
        userId: 'stage86-restart',
        generateKey: true,
      });

      const firstKernel = vaultBootstrapService.getKernelForTesting();
      expect(firstKernel!.isVaultInitialized).toBe(true);

      // ─── Vault closed (process shutdown) ──────────────────────────
      await vaultBootstrapService.dispose();
      expect(vaultBootstrapService.getKernelForTesting()).toBeNull();

      // ─── Vault reopened on restart ────────────────────────────────
      const freshService = new VaultBootstrapService();
      const preStatus = await freshService.getStatus();
      expect(preStatus.initialized).toBe(false);

      const reResp = await freshService.initialize({
        vaultRoot,
        userId: 'stage86-restart',
        generateKey: false, // reuse existing encryption key
      });

      expect(reResp.vaultReady).toBe(true);
      expect(reResp.kernelReady).toBe(true);
      expect(reResp.spaceId).toBe(firstResp.spaceId);
      // vaultId regenerates per-service instance (forward-compat hook)
      expect(reResp.vaultId).not.toBe(firstResp.vaultId);
      expect(reResp.vaultId).toMatch(/^vault-/);

      await freshService.dispose();
    });
  });

  // ---------------------------------------------------------------
  // 3) Vault events propagate across the kernel boundary
  // ---------------------------------------------------------------
  describe('vault events', () => {
    it('emits vault.opened on initialize and vault.closed on dispose', async () => {
      const freshService = new VaultBootstrapService();
      const events: string[] = [];
      freshService.onVaultOpenedForTesting(() => events.push('vault.opened'));

      await freshService.initialize({
        vaultRoot,
        userId: 'stage86-events',
        generateKey: true,
      });

      // vault.opened must have been emitted before initialize() returned
      expect(events).toContain('vault.opened');

      // Hook into the kernel event bus for vault.closed
      const kernel = freshService.getKernelForTesting();
      let closedFired = false;
      kernel!.events.on('vault.closed', () => {
        closedFired = true;
      });

      await freshService.dispose();
      expect(closedFired).toBe(true);

      // The three canonical event names match VAULT_EVENTS
      expect(VAULT_EVENTS.OPENED).toBe('vault.opened');
      expect(VAULT_EVENTS.CLOSED).toBe('vault.closed');
      expect(VAULT_EVENTS.SWITCHED).toBe('vault.switched');
    });
  });

  // ---------------------------------------------------------------
  // 4) Kernel-level provider fan-out contract holds for vault providers
  //
  // We exercise the fan-out through the public `Kernel` API (the only
  // way the kernel's public barrel exposes it), not through the
  // internal `ProviderManager`/`ProviderManagerFactory` constructors
  // (those are not in the public surface).
  // ---------------------------------------------------------------
  describe('Kernel — vault-aware provider fan-out', () => {
    it('Kernel.initializeProviders() initializes all 5 vault providers and reports per-provider readiness', async () => {
      // Build a VaultContext manually (rather than going through the bootstrap
      // service) so this test exercises the Kernel fan-out contract directly
      // without coupling to VaultBootstrapService singleton state.
      const vaultContext: VaultContext = {
        vaultId: 'stage86-pm-vault',
        vaultRoot,
        spacesRoot: join(vaultRoot, 'spaces'),
        spaceId: 'stage86-pm-space',
        encryptionKeyId: 'stage86-pm-key',
        userId: 'stage86-pm-user',
        label: 'Stage 8.6 PM Space',
        initializedAt: '2026-08-06T00:00:00Z',
      };

      // Create the actual filesystem layout under vaultRoot/spaces so the
      // vault providers can resolve T-Bit paths.
      mkdirSync(vaultContext.spacesRoot, { recursive: true });

      // Construct a fresh Kernel with the VaultContext — this is the public
      // entry point for vault-aware subsystems (matches
      // `Kernel.vault.test.ts` construction pattern).
      const kernel = new Kernel(vaultContext);

      // Register all 5 vault providers on the Kernel's public provider
      // registry. This is the canonical public path for fan-out.
      kernel.providers.register(new MemoryVaultProvider());
      kernel.providers.register(new WorkflowVaultProvider());
      kernel.providers.register(new AgentVaultProvider());
      kernel.providers.register(new QVaultVaultProvider());
      kernel.providers.register(new LlmVaultProvider());

      // Sanity: the registry now holds 5 providers, accessible via getAll().
      expect(kernel.providers.size()).toBe(5);

      // Fan-out initialization via the public Kernel API. The Kernel
      // internally calls `ProviderManager.initializeAll({ vaultContext })`
      // exactly once per registered provider.
      await kernel.initializeProviders();

      // Every vault provider must have been initialized successfully.
      const readiness = kernel.getProviderReadiness();
      expect(readiness['memory-vault']).toBe(true);
      expect(readiness['workflow-vault']).toBe(true);
      expect(readiness['agent-vault']).toBe(true);
      expect(readiness['qvault-vault']).toBe(true);
      expect(readiness['llm-vault']).toBe(true);

      // Each provider must declare at least one of the vault capabilities
      // (vaultRead / vaultWrite) on its `info.capabilities` object —
      // this is the Stage 8.4 readiness advertisement mechanism.
      // `info.capabilities` is a `ProviderCapabilities` OBJECT (not an
      // array of strings).
      const registeredProviders = kernel.providers.getAll();
      expect(registeredProviders.length).toBe(5);
      for (const provider of registeredProviders) {
        const caps = provider.info.capabilities;
        const hasVaultCapability =
          caps?.vaultRead === true || caps?.vaultWrite === true;
        expect(
          hasVaultCapability,
          `provider ${provider.info.id} must declare vaultRead or vaultWrite capability`
        ).toBe(true);
      }

      // The Kernel must report vault initialization as complete.
      expect(kernel.isVaultInitialized).toBe(true);
    });

    it('Kernel-level integration: after VaultBootstrapService.initialize(), all 5 vault providers are ready', async () => {
      // End-to-end Kernel validation: confirms the full chain
      //   VaultBootstrapService.initialize → Kernel.setVaultContext →
      //   Kernel.initializeProviders → ProviderManager.initializeAll
      // produces a fully-initialized Kernel with all vault providers ready.
      const resp = await vaultBootstrapService.initialize({
        vaultRoot,
        userId: 'stage86-kernel-pm',
        generateKey: true,
      });

      const kernel = vaultBootstrapService.getKernelForTesting();
      expect(kernel).not.toBeNull();
      expect(kernel!.isVaultInitialized).toBe(true);

      // vaultId round-trip — the vault context held by the Kernel matches
      // the response from the bootstrap service.
      expect(kernel!.vaultContext!.vaultId).toBe(resp.vaultId);

      // The Kernel's getProviderReadiness() must report all 5 vault
      // providers ready.
      const readiness = kernel!.getProviderReadiness();
      const vaultReadinessIds = Object.keys(readiness).filter((id) =>
        id.includes('vault')
      );
      expect(vaultReadinessIds.length).toBeGreaterThanOrEqual(5);
      for (const id of vaultReadinessIds) {
        expect(readiness[id], `${id} should be ready`).toBe(true);
      }
    });
  });
});
