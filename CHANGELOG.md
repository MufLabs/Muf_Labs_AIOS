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

## [Unreleased]

### 🧊 Frozen — Stage 8.6 (2026-08-06)

**Stage 8.6 — Integration Testing & Build Validation** has been formally accepted and frozen.

#### Scope
Stage 8.6 is the **integration-validation gate** between implementation (Stages 8.1–8.4) and final Phase 8 closure (Stage 8.7). It validates that the entire monorepo — not just individual packages — is **coherent, deterministic, and release-ready**. No new product code is introduced; only test infrastructure, wiring, and one cross-package integration test.

#### Added
- `tests/integration/vault-bootstrap.test.ts` — New cross-package integration test exercising the public `Kernel` class API: constructs `Kernel` with a vault context, registers all 5 vault providers (`MemoryVaultProvider`, `WorkflowVaultProvider`, `AgentVaultProvider`, `QVaultVaultProvider`, `LlmVaultProvider`), calls `initializeProviders()`, asserts `providers.size() === 5`, asserts each registered provider reports vault capabilities (`info.capabilities.vaultRead === true` or `info.capabilities.vaultWrite === true`), asserts provider readiness via `getProviderReadiness()`, and asserts vault events are reachable through the `events` getter. 8 tests, 8/8 passing.
- `vitest.config.ts` (root) — Added `tests/**/*.test.ts` glob pattern so cross-package integration tests are picked up by Vitest in addition to workspace tests.
- `packages/ui/package.json`, `packages/shared/package.json`, `packages/workflow/package.json` — Updated `test` script to use `vitest run --passWithNoTests` so Turborepo does not fail on zero-test packages.

#### Changed
- `package.json` (root) — Replaced stub `test:integration` script (`turbo run test:integration` — no workspace defined that task) with direct Vitest invocation: `"test:integration": "vitest run --config vitest.config.ts tests/integration"`.
- `tests/integration/vault-bootstrap.test.ts` (during implementation, 3 revisions):
  - Switched from importing non-public `ProviderManagerFactory` (not in `@aios/kernel` public barrel) to public `Kernel` class API.
  - Switched from `kernel.providers.getProviders` (non-existent) to `kernel.providers.getAll()`.
  - Switched from `caps.some(...)` (capabilities is **object**, not array) to `caps.vaultRead === true || caps.vaultWrite === true`.

#### Tests Added
- `tests/integration/vault-bootstrap.test.ts` — 8 cross-package integration tests (vault-context kernel construction, provider registration for all 5 vault providers, `initializeProviders()` fan-out, `getProviderReadiness()` mapping, `info.capabilities` shape verification, vault events getter exposure).

#### Validation
- **220/220** monorepo tests passing across **18 test files** in **11 packages**.
  - Includes Stage 8.4 (88), Stage 8.3 (47), tbit-core (15), Stage 8.2 e2e (3), plus baseline suites.
- **8/8** cross-package integration tests passing (`pnpm test:integration`).
- **11/11** packages build successfully (`pnpm run build`).
- **TypeScript** compilation clean on all packages (`tsc --noEmit`).
- **Docker Compose** validates: `docker compose -f docker-compose.yml config` exits 0; all 3 services (`api`, `web`, `postgres`) parse cleanly.
- **Regression**: Stage 8.3 frontend 47/47, Stage 8.2 backend e2e 3/3, tbit-core 15/15 — all still passing. Zero regressions.
- **Frozen-Stage integrity**: Stage 8.4 LOCKED file list verified unchanged; no modifications to vault-aware Kernel, vault providers, vault events, or readiness flow.

#### Architecture Invariant (Honored)
- Kernel remains the **single orchestration point** for subsystem initialization — no new initialization paths introduced.
- No hardcoded filesystem paths introduced; all paths via `tbitRuntimePaths`.
- Zero global state mutation.
- Stage 8.4 architecture and LOCKED artifacts preserved untouched.

#### Specification Compliance Audit
- **14/15** Stage 8.6 requirements verified implemented (strict-pass).
- **1 deferral** (Gap G-1): **Lint not configured** at repository level — no `eslint.config.*`, no per-package ESLint. Documented as tooling gap, not architectural defect. Tracked for Stage 8.7 (add ESLint flat config + per-package `lint` script).
- Traceability matrix: see `docs/PHASE8_STAGE86_ENGINEERING_ANALYSIS.md` §10 (full 15-row matrix) and `docs/AIOS_ENGINEERING_AUDIT_v2.md` §21.3 (summary matrix).
- Audit verdict: **14/15 strict-pass, 1 deferral**. Freeze accepted; deferral does not block Phase 8 closure.

#### Architectural Findings
| ID | Finding | Severity | Action |
|----|---------|----------|--------|
| **F-1** | Lint not configured at repository level. | Low (Tooling) | Stage 8.7 |
| **F-2** | Vite 3D-panel chunks exceed 500 kB warning threshold. | Low (Performance) | Stage 8.7 / Phase 9 |
| **F-3** | Root `test:integration` was a stub script. | Low (Tooling) | **RESOLVED** |
| **F-4** | Test gating failed on packages with zero test files. | Low (Tooling) | **RESOLVED** |
| **F-5** | Integration test initially imported non-public `ProviderManagerFactory`. | Low (Test Quality) | **RESOLVED** |
| **F-6** | Integration test initially treated `info.capabilities` as string array. | Low (Test Quality) | **RESOLVED** |

#### Documentation Synchronization
| Doc | Status |
|-----|--------|
| `docs/PHASE8_STAGE86_ENGINEERING_ANALYSIS.md` | ✅ New (12 sections, ~370 lines) |
| `docs/AIOS_ENGINEERING_AUDIT_v2.md` | ✅ Updated to v2.3 (§21 Stage 8.6 Freeze Notice added) |
| `PROJECT_STATE.md` | ✅ Updated (§4 = Stage 8.6 Frozen State) |
| `docs/PHASE8_IMPLEMENTATION_PLAN.md` | ✅ Stage 8.6 marked ✅ Complete & [FROZEN]; Stage 8.5 omission clarified |
| `docs/AIOS_Book.md` | ✅ Stage 8.6 freeze section added |
| `CHANGELOG.md` | ✅ This entry |

#### Locked
Stage 8.6 is **infrastructure-only** and does not introduce new architectural artifacts or new LOCKED files. The Stage 8.4 LOCKED file list (see above) remains authoritative and is verified unchanged. Stage 8.6 wiring is recorded for reproducibility:

- `tests/integration/vault-bootstrap.test.ts` — Cross-package integration test (frozen).
- `vitest.config.ts` (root) — Vitest configuration including `tests/**/*.test.ts` glob (frozen for Stage 8.6 scope).
- `package.json` (root) — `test:integration` script wiring (frozen for Stage 8.6 scope).

---

## Frozen — Stage 8.2 (Backend Vault Bootstrap Service) — pre-2026-08-06

(Stage 8.2 freeze predates this changelog. See `docs/PHASE8_IMPLEMENTATION_PLAN.md` Stage 8.2 section.)

## Frozen — Stage 8.1 (Client-Side Vault Selection UI) — pre-2026-08-06

(Stage 8.1 freeze predates this changelog. See `docs/PHASE8_IMPLEMENTATION_PLAN.md` Stage 8.1 section.)

---

[Unreleased]: #

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/


---

## Phase 8 Engineering Closure (Stage 8.7)

**Status: Phase 8 Successfully Closed**

- Acceptance Date: 2026-08-07
- Freeze Date: 2026-08-07
- Baseline Commit: b3cfbd7da58047dc8acddad7a7855a6a49383e60
- Next Phase: Phase 9 - Testing & Validation
- Closure artifacts: docs/PHASE8_FINAL_ACCEPTANCE.md, docs/PHASE8_ARCHITECTURE_BASELINE.md, docs/PHASE8_ENGINEERING_METRICS.md, docs/PHASE8_FINAL_AUDIT.md, docs/PHASE8_ENGINEERING_CLOSURE_REPORT.md, docs/ADR/ (ADR-001..010), docs/ENGINEERING_DECISIONS.md

Per ADR-008 Freeze Policy, Phase 8 implementation shall not be modified unless a verified defect is discovered or an approved ECR explicitly authorizes it.


---

## Phase 8 Repository Baseline & Governance (v0.3.0)

**Status: Repository Baseline Complete**

### What changed
Added the final repository-governance baseline artifacts: official Release record, Engineering Timeline, and Version governance. package.json version bumped 0.1.0 -> 0.3.0 (metadata only; no functionality, architecture, or API changes).

### Why it changed
Phase 8 engineering closure required a permanent release baseline, timeline, and version record for all future AIOS/MUF Labs development.

### How it works
The @aios/* source code, Kernel, Workflow, Providers, Agents, T-Bit, Q-Vault, Memory, API, and Frontend are unchanged. Only engineering-governance documentation and the manifest version were added/updated.

### Architectural / Engineering rationale
Documented in ADR-008 (Freeze Policy) and ADR-009 (Documentation Synchronization Policy). The release baseline + timeline + version form the immutable reference referenced by future phases.

### Dependencies
Final Acceptance, Final Audit, Architecture Baseline, Engineering Metrics, Closure Report, ADR registry, Phase 8 frozen stages.

### Validation performed
Build 11/11 PASS; TypeScript 10/10 PASS; Tests 220/220 + 8 integration PASS; Docker Compose valid; Documentation Consistency Audit: 16/16 artifacts present, 0 placeholder/TODO issues, version 0.3.0 consistent.

### Acceptance criteria
Repository frozen, Architecture frozen, Documentation synchronized, Engineering Baseline complete, Release documented, Timeline documented, Version documented, Git Tag commands prepared, Repository ready for Phase 9.

### Architectural impact
None (governance / metadata only).

### Future considerations
Phase 9 (Testing & Validation) is the next approved phase. No future implementation may modify the frozen baseline without a verified defect or an approved ECR.

### New governance artifacts
- docs/RELEASES/RELEASE_v0.3.0.md
- docs/ENGINEERING_TIMELINE.md
- VERSION + docs/VERSION.md
- package.json version: 0.3.0

---

## Phase 9 Engineering Closure (Testing & Validation)

**Status: Phase 9 Successfully Closed**

- Acceptance Date: 2026-08-13
- Freeze Date: 2026-08-13
- Validated Commit: 13078768645cb5f33a2b02da792d34e6bcbeab6d (1307876) — "Phase 9 bootstrap secret configuration"
- Package Version: v0.3.0 (unchanged; Phase 9 introduces no semantic change)
- Next Phase: Phase 10 - Deployment & Production Hardening (formally unblocked)

### What changed
Formally closed Phase 9 (Testing, Validation & Release Candidate Preparation). Phase 9
delivered the **Bootstrap Stabilization** workstream (ECR-Phase9-0001 — secret bootstrap
configuration and structured bootstrap logging, FR-07) and produced a fully validated
release candidate at commit `1307876`.

### Validation performed
- Secret bootstrap: `pnpm run test:secret` — **10/10 PASS**
- API typecheck: PASS; Web typecheck: PASS
- Web tests: **47/47 PASS** (3 test files)
- Integration: `pnpm test:integration` — **8/8 PASS**
- Full build: `pnpm build` — **11/11 tasks successful**
- Full typecheck: `pnpm typecheck` — **10/10 tasks successful**
- Full test suite: `pnpm test` — **18/18 tasks successful**
  - @aios/web 47, @aios/kernel 82, @aios/api 12, @muf/tbit-core 15, aios-mvp 55, @aios/database 4, @aios/llm 1, @aios/agents 1 (all PASS); @aios/shared/ui/workflow exit 0 (no tests)
- Runtime API `GET /health` — HTTP 200
- T-Bit setup status (pre-bootstrap) — HTTP 200, initialized=false, encryptionConfigured=true, spacesCount=0
- Invalid auth — HTTP 403
- Vault init — HTTP 201
- Full vault status (post-init) — initialized=true, spacesCount=1, all 6 subsystems ready
- Vault filesystem — structure verified under `C:\Temp\aios-phase9-test-vault`
- Web/API CORS — `Access-Control-Allow-Origin: http://localhost:5173` honored (HTTP 200)
- Git working tree — clean

### Documents
- `docs/PHASE9_FINAL_ACCEPTANCE.md` — NEW (Phase 9 closure & acceptance record)
- `docs/PHASE9_BOOTSTRAP_VALIDATION_REPORT.md` — APPROVED entry artifact (unchanged)
- `docs/PHASE9_BOOTSTRAP_SMOKE_TEST_ST001.md` — PASS entry artifact (unchanged)

### Locked
Phase 8 architecture, package boundary contracts, and the frozen Phase 8 baseline remain
unchanged. Per ADR-008 Freeze Policy, neither the Phase 8 baseline nor the Phase 9
validated state at commit `1307876` shall be modified without a verified defect or an
approved Engineering Change Request (ECR).
