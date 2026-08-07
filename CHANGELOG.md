# AIOS — Changelog

> **All notable lifecycle events** for the AIOS project are documented here.
> Entries follow [Keep a Changelog](https://keepachangelog.com/) conventions.
> Each entry corresponds to a Formal Acceptance & Freeze event.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/) for the
implementation surface (per the architecture audit).

---

## [Unreleased]

### 🧊 Frozen — Stage 8.3 (2026-08-06)

**Stage 8.3 — Application Startup & Vault Loader (Frontend)** has been formally accepted and frozen.

#### Added
- `apps/web/src/hooks/useVaultInit.ts` — startup state machine (loading/onboarding/ready/error) and init flow: load config → restore permission → get vault status → set state.
- `apps/web/src/hooks/useVaultPicker.ts` — File System Access API integration + IndexedDB persistence (`idb@^8.0.2`).
- `apps/web/src/api/tbit/tbitVaultClient.ts` — HTTP client for `/api/v1/tbit/vault/init` and `/api/v1/tbit/vault/status`.
- `apps/web/src/types/vault.ts` — `VaultConfig`, `VaultInitRequest`, `VaultInitResponse`, `VaultStatusResponse`, `isFileSystemAccessSupported()` type guard.
- `apps/web/src/AppWrapper.tsx` — startup routing component (LoadingSpinner / OnboardingView / ErrorView / App).
- `apps/web/src/index.tsx` — entry point rendering `<AppWrapper />` in StrictMode.
- `apps/web/src/components/OnboardingView.tsx` — added Vault Selection step; uses `useVaultPicker`; calls `tbitRegistrationClient.bootstrapWithVault`.
- `apps/web/src/App.tsx` — now accepts `vaultConfig: VaultConfig | null` and `onReconfigureVault: () => void` props; removes `localStorage` check.
- `apps/web/vitest.config.ts` — React plugin, `NODE_ENV=test`, setup file, resolve aliases.
- `apps/web/tests/setup.ts` — local setup file (mirrors root `tests/setup-web.ts`).

#### Validation
- **47/47** frontend Stage 8.3 tests passing (15 `useVaultInit` + 19 `useVaultPicker` + 13 `AppWrapper`).
- **72 tests** total across the monorepo.
- **11/11** packages build successfully (`pnpm run build`).
- **TypeScript** compilation clean (`tsc --noEmit` on `@aios/web`).
- Backend regression: `@aios/api` Stage 8.2 e2e 3/3 passing.
- Kernel regression: `@aios/kernel` 1/1 passing.

#### Boundary Contract (Preserved)
- Frontend `useVaultInit` gates the `ready` state on `status.initialized && status.vaultReady` (NOT on `kernelReady`), per Stage 8.2 boundary.
- **`vaultReady=true, kernelReady=false`** held until Stage 8.4.

#### Specification Compliance Audit
- **13/13** Stage 8.3 requirements verified implemented.
- Traceability matrix: see `docs/PHASE8_IMPLEMENTATION_PLAN.md` (Stage 8.3 Freeze Notice) and `docs/AIOS_ENGINEERING_AUDIT_v2.md` (Stage 8.3 Freeze Notice).
- Audit verdict: **FULLY IMPLEMENTED**.

#### Locked
Stage 8.3 architecture, startup flow, validation logic, readiness boundaries, and the following files are **LOCKED** unless an approved Engineering Change Request (ECR) authorizes a modification or a verified defect is discovered:

- `apps/web/src/hooks/useVaultInit.ts`
- `apps/web/src/hooks/useVaultPicker.ts`
- `apps/web/src/AppWrapper.tsx`
- `apps/web/src/index.tsx`
- `apps/web/src/api/tbit/tbitVaultClient.ts`
- `apps/web/src/types/vault.ts`
- `apps/web/src/components/OnboardingView.tsx`
- `apps/web/src/App.tsx`
- `apps/api/src/services/vaultBootstrapService.ts`
- `apps/api/src/routes/tbit-vault.routes.ts`

---

## [Unreleased]

### 🧊 Frozen — Stage 8.4 (2026-08-06)

**Stage 8.4 — Kernel & Provider Vault Integration** has been formally accepted and frozen.

#### Added
- `packages/shared/src/vaultContext.ts` — Canonical `VaultContext`, `VaultProviderConfig`, `VaultCapability`, `VaultOpenedPayload`, `VaultClosedPayload`, `VaultSwitchedPayload` types and `VAULT_EVENTS` constants (`vault.opened`, `vault.closed`, `vault.switched`). Single source of truth for vault-aware types across the monorepo.
- `packages/shared/src/index.ts` — Re-exports of `VaultContext`, `VaultProviderConfig`, `VaultCapability`, event payloads, `VAULT_EVENTS`, `setActiveTBitSpacesRoot`, `resolveActiveTBitDataPath`.
- `packages/kernel/src/providers/vault/MemoryVaultProvider.ts` — Concrete vault-aware provider; `id: 'memory-vault'`, `vaultRead:true`, `vaultWrite:true`. Replaces/extends global memory provider when a vault is open.
- `packages/kernel/src/providers/vault/WorkflowVaultProvider.ts` — Vault-aware workflow provider; persistent + temp context, logs, sessions scoped to vault.
- `packages/kernel/src/providers/vault/AgentVaultProvider.ts` — Vault-aware agent provider; prompt library, knowledge base, runtime cache scoped to vault.
- `packages/kernel/src/providers/vault/QVaultVaultProvider.ts` — Vault-aware QVault provider; quantum vault bindings resolve from `VaultContext`.
- `packages/kernel/src/providers/vault/LlmVaultProvider.ts` — Vault-aware LLM provider; resolves LLM gateway configuration from active vault.
- `packages/kernel/src/providers/vault/index.ts` — Barrel export for all 5 vault providers + `VAULT_PROVIDER_IDS` constant.

#### Changed
- `packages/kernel/src/core/Kernel.ts` — Vault-aware Kernel: `vaultContext?: VaultContext` constructor parameter, `setVaultContext()`, `initializeProviders(config: VaultProviderConfig)`, `disposeVault()`, `getProviderReadiness()`, static `generateVaultId()`, `events` getter, `context` getter, `boot()`/`shutdown()` (Phase 7 backward compat), `isVaultInitialized` flag, `execute()` enrichment with `vaultId`/`spaceId` metadata.
- `packages/kernel/src/Kernel.ts` — Converted to **barrel re-export** of `core/Kernel.ts` (resolves the dual-Kernel class conflict without breaking existing Phase 7 imports).
- `packages/kernel/src/providers/IProvider.ts` — Added optional `initializeProvider?(config: VaultProviderConfig): Promise<void>` vault-aware hook.
- `packages/kernel/src/providers/IProviderManager.ts` — Added `initializeAll(config: VaultProviderConfig): Promise<Record<string, boolean>>` fan-out method.
- `packages/kernel/src/providers/ProviderManager.ts` — Implements `initializeAll()` with per-provider error handling; returns `Record<providerId, boolean>` (true = initialized, false = failed/missing hook).
- `packages/kernel/src/providers/ProviderCapabilities.ts` — Added `vaultRead?: boolean`, `vaultWrite?: boolean` flags.
- `packages/kernel/src/providers/ProviderInfo.ts` — Added `kind?: string`, `tags?: string[]`, `description?: string` fields.
- `packages/kernel/src/index.ts` — Added vault exports; re-exports `VAULT_EVENTS`, `VaultContext`, etc., from `@aios/shared`.
- `apps/api/src/services/vaultBootstrapService.ts` — Imports `VaultContext` from `@aios/shared`; fully wires `Kernel` with `VaultContext`; registers all 5 vault providers; calls `setVaultContext()` + `initializeProviders()`; reports per-provider readiness mapped to subsystems `{memory, workflow, provider, agent, qvault, llm}`. Added `onVaultOpenedForTesting()` helper that wraps `Kernel.prototype.initializeProviders` to attach event listener before `vault.opened` is emitted.
- `packages/kernel/package.json`, `packages/agents/package.json`, `packages/workflow/package.json`, `apps/api/package.json` — Added `@aios/shared` as dependency for `VaultContext` and event types.
- `.gitignore` — Added `data/` and `**/vitest.config.ts.timestamp-*.mjs` patterns.

#### Tests Added
- `packages/kernel/src/__tests__/Kernel.vault.test.ts` — 29 tests covering: vault-aware Kernel construction, `setVaultContext()`, `initializeProviders()`, `disposeVault()`, `getProviderReadiness()`, `execute()` request enrichment with vault metadata, Phase 7 backward compatibility (`boot()`/`shutdown()`/`context` getter), `generateVaultId()`.
- `packages/kernel/src/__tests__/vaultProviders.test.ts` — 41 tests covering all 5 vault providers (id, name, capabilities, description, idempotent `initializeProvider()`, `execute()` guards and response shape, vault metadata propagation).
- `packages/kernel/src/__tests__/ProviderManager.vault.test.ts` — 11 tests covering `ProviderManager.initializeAll()`: empty registry, missing `initializeProvider` opt-in, fan-out invocation, config propagation, single-failure isolation, multiple-failure isolation, non-Error throws, complete id enumeration, idempotency, unregistered providers, fresh-context propagation.
- `apps/api/src/services/vaultBootstrapService.e2e.test.ts` — 7 e2e tests covering full Vault → Kernel wiring path: status before init, init with kernel verification, live Kernel exposure, `vault.opened` event capture, `disposeVault` with `vault.closed`, restart simulation, input validation.

#### Validation
- **88/88** Stage 8.4 tests passing (29 Kernel.vault + 41 vaultProviders + 11 ProviderManager.vault + 7 vaultBootstrapService.e2e).
- **11/11** packages build successfully (`pnpm run build`).
- **TypeScript** compilation clean (`tsc --noEmit` on all modified packages).
- Architecture validation: All 6 principles preserved (modularity, isolation, dependency inversion, provider abstraction, kernel responsibilities, T-Bit independence).
- Coding rules compliance: No TODO, no placeholder, no pseudo-code; all public interfaces documented; strict TypeScript; no global state mutation.
- Dependency injection: Zero global state; VaultContext is constructor/`setVaultContext()`-injected only.
- No hardcoded paths in vault-aware providers — all paths via `tbitRuntimePaths`.

#### Architecture Invariant (Honored)
- The Kernel remains the **single orchestration point** for subsystem initialization. Stage 8.4 *extends* the existing `initializeProviders()` mechanism; it does **not** introduce a second initialization flow.

#### Boundary Contract (Preserved)
- `kernelReady=true` is now reachable AFTER `initializeProviders()` completes successfully.
- Vault events (`vault.opened`, `vault.closed`, `vault.switched`) are emitted on the Kernel event bus.

#### Specification Compliance Audit
- **9/9** Stage 8.4 requirements verified implemented (Active Vault Context, Runtime Path Resolution, Kernel Bootstrap Sequence, Provider Integration, Workflow Integration, Agent Integration, Vault Events, Dependency Injection, Phase 7 Backward Compatibility).
- Traceability matrix: see `docs/PHASE8_IMPLEMENTATION_PLAN.md` (Stage 8.4 Freeze Notice) and `docs/AIOS_ENGINEERING_AUDIT_v2.md` (Stage 8.4 Freeze Notice).
- Audit verdict: **FULLY IMPLEMENTED**.

#### Locked
Stage 8.4 architecture, vault-aware kernel, vault providers, vault events, and the following files are **LOCKED** unless an approved Engineering Change Request (ECR) authorizes a modification or a verified defect is discovered:

- `packages/shared/src/vaultContext.ts`
- `packages/shared/src/index.ts`
- `packages/kernel/src/Kernel.ts`
- `packages/kernel/src/core/Kernel.ts`
- `packages/kernel/src/providers/IProvider.ts`
- `packages/kernel/src/providers/IProviderManager.ts`
- `packages/kernel/src/providers/ProviderManager.ts`
- `packages/kernel/src/providers/ProviderCapabilities.ts`
- `packages/kernel/src/providers/ProviderInfo.ts`
- `packages/kernel/src/providers/vault/MemoryVaultProvider.ts`
- `packages/kernel/src/providers/vault/WorkflowVaultProvider.ts`
- `packages/kernel/src/providers/vault/AgentVaultProvider.ts`
- `packages/kernel/src/providers/vault/QVaultVaultProvider.ts`
- `packages/kernel/src/providers/vault/LlmVaultProvider.ts`
- `packages/kernel/src/providers/vault/index.ts`
- `packages/kernel/src/index.ts`
- `apps/api/src/services/vaultBootstrapService.ts`
- `apps/api/src/services/vaultBootstrapService.e2e.test.ts`
- `packages/kernel/src/__tests__/Kernel.vault.test.ts`
- `packages/kernel/src/__tests__/vaultProviders.test.ts`
- `packages/kernel/src/__tests__/ProviderManager.vault.test.ts`

---

## Frozen — Stage 8.2 (Backend Vault Bootstrap Service) — pre-2026-08-06

(Stage 8.2 freeze predates this changelog. See `docs/PHASE8_IMPLEMENTATION_PLAN.md` Stage 8.2 section.)

## Frozen — Stage 8.1 (Client-Side Vault Selection UI) — pre-2026-08-06

(Stage 8.1 freeze predates this changelog. See `docs/PHASE8_IMPLEMENTATION_PLAN.md` Stage 8.1 section.)

---

[Unreleased]: #

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/
