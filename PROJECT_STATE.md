# AIOS — Project State

> **Single source of truth** for the current lifecycle state of every implementation stage.
> Updated on each Formal Acceptance & Freeze event.

---

## 1. Current Phase

**Phase 8 — T-Bit Vault Setup**

| Stage | Title | Status | Frozen On | Notes |
|-------|-------|--------|-----------|-------|
| 8.1 | Client-Side Vault Selection UI (Frontend Only) | ✅ Complete | 2026-08-06 | 🧊 Frozen |
| 8.2 | Vault Bootstrap Service (Backend Orchestrator) | ✅ Complete | 2026-08-06 | 🧊 Frozen |
| **8.3** | **Application Startup & Vault Loader (Frontend)** | ✅ Complete | **2026-08-06** | **🧊 Frozen** |
| **8.4** | **Kernel & Provider Vault Integration** | ✅ Complete | **2026-08-06** | **🧊 Frozen** |
| 8.5 | (Removed — Out of Scope) | ⏭️ Removed | — | Intentionally omitted |
| 8.6 | Integration Testing & Build Validation | ⏳ Pending | — | Pending Stage 8.7 |
| 8.7 | Documentation & AIOS_Book.md Update | ⏳ Pending | — | Final stage |

---

## 2. Stage 8.3 — Frozen State (2026-08-06)

### 2.1 Lifecycle
- **Implementation**: ✅ Satisfies approved specification.
- **Validation**: ✅ Satisfies approved acceptance criteria.
- **Documentation**: ✅ Synchronized.
- **Audit**: ✅ 13/13 requirements Implemented (Specification Compliance Audit).
- **State**: 🧊 **FROZEN** (formal acceptance recorded 2026-08-06).

### 2.2 Implementation Surface (LOCKED)

| File | Role |
|------|------|
| `apps/web/src/hooks/useVaultInit.ts` | Startup state machine + init flow |
| `apps/web/src/hooks/useVaultPicker.ts` | File System Access API + IndexedDB persistence |
| `apps/web/src/AppWrapper.tsx` | Startup routing component |
| `apps/web/src/index.tsx` | Entry point — renders `<AppWrapper />` |
| `apps/web/src/api/tbit/tbitVaultClient.ts` | HTTP client (`initVault`, `getVaultStatus`) |
| `apps/web/src/types/vault.ts` | `VaultConfig`, `VaultStatusResponse`, FSA guard |
| `apps/web/src/components/OnboardingView.tsx` | Onboarding flow + Vault picker step |
| `apps/web/src/App.tsx` | Accepts `vaultConfig` + `onReconfigureVault` props |
| `apps/api/src/services/vaultBootstrapService.ts` | Linear vault bootstrap orchestrator |
| `apps/api/src/routes/tbit-vault.routes.ts` | POST `/vault/init`, GET `/vault/status` |

### 2.3 Validation Evidence

- **47/47** frontend Stage 8.3 tests passing
  - 15 `useVaultInit.test.ts`
  - 19 `useVaultPicker.test.ts`
  - 13 `AppWrapper.test.tsx`
- **72 tests** total across the monorepo
- **11/11** packages build successfully (`pnpm run build`)
- **TypeScript** compilation clean (`tsc --noEmit` on `@aios/web`)
- **Backend regression**: `@aios/api` Stage 8.2 e2e 3/3 passing
- **Kernel regression**: `@aios/kernel` 1/1 passing

### 2.4 Boundary Contract (PRESERVED)

- **`vaultReady=true, kernelReady=false`** — Stage 8.2 boundary held.
- Frontend `useVaultInit` gates the `ready` state on `status.initialized && status.vaultReady` (NOT on `kernelReady`).
- Stage 8.4 Kernel/provider wiring remains the **only** future code path that may flip `kernelReady` to `true`.

### 2.5 Modification Policy

From 2026-08-06 onward, the following are **LOCKED** unless:
1. A **verified defect** is discovered, or
2. An approved **Engineering Change Request (ECR)** explicitly authorizes the modification.

- Stage 8.3 architecture, startup flow, validation logic, and readiness boundaries.
- All files listed in §2.2.

---

## 3. Stage 8.4 — Frozen State (2026-08-06)

### 3.1 Lifecycle
- **Implementation**: ✅ Satisfies approved specification.
- **Validation**: ✅ Satisfies approved acceptance criteria.
- **Documentation**: ✅ Synchronized.
- **Audit**: ✅ 9/9 requirements Implemented (Specification Compliance Audit).
- **State**: 🧊 **FROZEN** (formal acceptance recorded 2026-08-06).

### 3.2 Implementation Surface (LOCKED)

#### Vault-Aware Types (canonical, `@aios/shared`)
| File | Role |
|------|------|
| `packages/shared/src/vaultContext.ts` | `VaultContext`, `VaultProviderConfig`, `VaultCapability`, event payloads, `VAULT_EVENTS` |
| `packages/shared/src/index.ts` | Re-exports of vault types + `tbitRuntimePaths` helpers |

#### Vault-Aware Kernel (`@aios/kernel`)
| File | Role |
|------|------|
| `packages/kernel/src/Kernel.ts` | Barrel re-export of `core/Kernel.ts` (resolves dual-Kernel conflict) |
| `packages/kernel/src/core/Kernel.ts` | Vault-aware Kernel: `vaultContext`, `setVaultContext()`, `initializeProviders()`, `disposeVault()`, `getProviderReadiness()`, `events`, `context`, `boot()`/`shutdown()`, `isVaultInitialized`, `execute()` enrichment |
| `packages/kernel/src/providers/IProvider.ts` | Added optional `initializeProvider?(config: VaultProviderConfig)` hook |
| `packages/kernel/src/providers/IProviderManager.ts` | Added `initializeAll(config)` fan-out method |
| `packages/kernel/src/providers/ProviderManager.ts` | Implements `initializeAll()` with per-provider error handling |
| `packages/kernel/src/providers/ProviderCapabilities.ts` | Added `vaultRead?`, `vaultWrite?` flags |
| `packages/kernel/src/providers/ProviderInfo.ts` | Added `kind?`, `tags?`, `description?` fields |
| `packages/kernel/src/providers/vault/MemoryVaultProvider.ts` | Concrete vault-aware Memory provider |
| `packages/kernel/src/providers/vault/WorkflowVaultProvider.ts` | Concrete vault-aware Workflow provider |
| `packages/kernel/src/providers/vault/AgentVaultProvider.ts` | Concrete vault-aware Agent provider |
| `packages/kernel/src/providers/vault/QVaultVaultProvider.ts` | Concrete vault-aware QVault provider |
| `packages/kernel/src/providers/vault/LlmVaultProvider.ts` | Concrete vault-aware LLM provider |
| `packages/kernel/src/providers/vault/index.ts` | Barrel export for all 5 vault providers + `VAULT_PROVIDER_IDS` |
| `packages/kernel/src/index.ts` | Vault exports; re-exports `VAULT_EVENTS`, `VaultContext`, etc. |

#### Bootstrap Service (`apps/api`)
| File | Role |
|------|------|
| `apps/api/src/services/vaultBootstrapService.ts` | Wires `Kernel` with `VaultContext`; registers all 5 vault providers; calls `setVaultContext()` + `initializeProviders()`; reports per-provider readiness |

#### Tests
| File | Role |
|------|------|
| `packages/kernel/src/__tests__/Kernel.vault.test.ts` | 29 tests — vault-aware Kernel behavior |
| `packages/kernel/src/__tests__/vaultProviders.test.ts` | 41 tests — all 5 vault providers |
| `packages/kernel/src/__tests__/ProviderManager.vault.test.ts` | 11 tests — `initializeAll()` fan-out |
| `apps/api/src/services/vaultBootstrapService.e2e.test.ts` | 7 e2e tests — Vault → Kernel wiring |

### 3.3 Validation Evidence

- **88/88** Stage 8.4 tests passing
  - 29 `Kernel.vault.test.ts`
  - 41 `vaultProviders.test.ts`
  - 11 `ProviderManager.vault.test.ts`
  - 7 `vaultBootstrapService.e2e.test.ts`
- **11/11** packages build successfully (`pnpm run build`)
- **TypeScript** compilation clean (`tsc --noEmit` on all modified packages)
- **Stage 8.3 regression**: `apps/web` 47/47 frontend tests passing
- **Stage 8.2 regression**: `apps/api` 3/3 e2e tests passing
- **No hardcoded paths** in vault-aware providers — all paths via `tbitRuntimePaths`
- **Zero global state** — `VaultContext` is constructor/`setVaultContext()`-injected only

### 3.4 Architecture Invariant (HONORED)

- The Kernel remains the **single orchestration point** for subsystem initialization.
- Stage 8.4 *extends* the existing `initializeProviders()` mechanism; it does **not** introduce a second initialization flow.

### 3.5 Boundary Contract (PRESERVED)

- **`kernelReady=true`** is now reachable AFTER `initializeProviders()` completes successfully.
- **Vault events** (`vault.opened`, `vault.closed`, `vault.switched`) are emitted on the Kernel event bus.
- **Phase 7 backward compatibility** — `boot()`/`shutdown()`/`context` getter/`isRunning` preserved on `core/Kernel.ts`.

### 3.6 Deterministic Bootstrap Sequence

1. **Vault** — VaultContext propagated to Kernel
2. **Kernel** — receives VaultContext, sets `vaultContext` field
3. **Memory** — `MemoryVaultProvider` initialized via `initializeProvider()`
4. **Providers** — `WorkflowVaultProvider`, `QVaultVaultProvider`, `LlmVaultProvider` initialized in sequence
5. **Workflow** — WorkflowVaultProvider initialized (subsystem registered)
6. **Agent** — `AgentVaultProvider` initialized last (depends on all other providers)

### 3.7 Modification Policy

From 2026-08-06 onward, the following are **LOCKED** unless:
1. A **verified defect** is discovered, or
2. An approved **Engineering Change Request (ECR)** explicitly authorizes the modification.

- Stage 8.4 vault-aware architecture, kernel contract, vault providers, vault events, and readiness flow.
- All files listed in §3.2.

---

## 4. Next Stage — Stage 8.6 / 8.7 (Final Phase 8 Wrap-up)

**Objective**: Final integration testing, build validation, and documentation consolidation for Phase 8 closure.

**Files to modify (planned for Stage 8.6)**:
- Cross-package integration tests (UI → API → Kernel → T-Bit)
- Build pipeline verification
- Full-stack smoke tests

**Files to modify (planned for Stage 8.7)**:
- `docs/AIOS_Book.md` — Phase 8 closure section
- `docs/PHASE8_VERIFICATION_REPORT.md` — final report
- Final Phase 8 acceptance documentation

**Required pre-work before implementation**:
- [ ] Read Engineering Baseline (`docs/AIOS_Book.md`)
- [ ] Read `docs/PHASE8_IMPLEMENTATION_PLAN.md`
- [ ] Read this `PROJECT_STATE.md`
- [ ] Read `docs/AIOS_ENGINEERING_AUDIT_v2.md`

**Constraints**:
- Strict compliance with approved architecture.
- Do not expand the approved scope of Stages 8.6/8.7.
- Proceed incrementally (Implementation → Build → TypeScript → Testing → Docs → Audit → Acceptance → Freeze).

---

## 5. Documentation Synchronization

All affected documentation reflects **Stage 8.4 freeze**:

| Doc | Status | Section |
|-----|--------|---------|
| `docs/PHASE8_IMPLEMENTATION_PLAN.md` | ✅ Updated | Header status line; Stage 8.4 section marked ✅ Complete & [FROZEN] |
| `docs/AIOS_Book.md` | ✅ Updated | Lifecycle table row 8.4; Stage 8.4 freeze section; Changelog freeze entry |
| `docs/AIOS_ENGINEERING_AUDIT_v2.md` | ✅ Updated | Executive Summary; Stage 8.4 Freeze Notice section |
| `PROJECT_STATE.md` | ✅ Updated | This file (§1, §3 frozen, §5 sync table) |
| `CHANGELOG.md` | ✅ Updated | Stage 8.4 freeze entry under [Unreleased] |

No conflicting or outdated information remains.

---

*This file is the canonical lifecycle state. Every Formal Acceptance & Freeze event must update it.*
