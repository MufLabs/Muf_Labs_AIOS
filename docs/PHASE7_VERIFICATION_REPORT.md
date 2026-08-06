# Phase 7 Gap Verification Report — Pre-Stage 8.2 Cleanup

> **Date**: 2026-08-05  
> **Purpose**: Classify each gap identified in the Phase 7 Engineering Analysis before taking action.

---

## 1. `apps/api/src/routes.ts` — Legacy Route Monolith

### Verification: Referenced anywhere?

**Method**: Full-repository search for import patterns of `./routes` and `registerRoutes`.

**Findings**:
- `apps/api/src/server.ts` imports `registerRoutes` from `"./routes/index"` (the modular version) — **NOT** from `./routes`.
- `apps/api/src/main.ts` imports from `"./server"` only.
- No file in the repository imports from `"./routes"` (the legacy monolith at `apps/api/src/routes.ts`).
- The legacy `routes.ts` defines its own `registerRoutes(app)` but it is **never invoked** — `server.ts` calls the modular `routes/index.ts` version.

### Classification

| Category | ✅/❌ |
|----------|------|
| Legacy code no longer referenced | ✅ **YES** |
| Dead code that can be safely removed | ✅ **YES** |
| Planned Phase 8 functionality | ❌ No |
| Technical debt | ✅ **YES** (duplicate of modular routes) |
| Security improvement | ❌ No (cleanup only) |

### Decision: **Safe to delete**
`apps/api/src/routes.ts` is dead code — a legacy monolith superseded by `apps/api/src/routes/index.ts`. It contains `ChatController` and `TBitController` references that are no longer part of the modular architecture. Deletion will not affect the build or runtime.

---

## 2. Hardcoded `dev-hmac-secret`

### Verification: All usages in active monorepo (excluding node_modules)

**Method**: `findstr /S /I /N "dev-hmac" packages\*.ts apps\*.ts`

**Findings — Active source files containing `"dev-hmac-secret"`**:

| # | File (active) | Line | Context |
|---|--------------|------|---------|
| 1 | `packages/tbit-core/src/apiCompat.ts` | 22 | `createDefaultStorage()` fallback when no active encryption key |
| 2 | `packages/tbit-core/src/assetManagerCompat.ts` | 34 | Asset manager compat fallback |
| 3 | `packages/tbit-core/src/binaryAssetBridgeCompat.ts` | 33 | Binary asset bridge compat fallback |
| 4 | `packages/tbit-core/src/kvStore.ts` | 43 | KV store fallback |
| 5 | `packages/tbit-core/src/markdownBridgeCompat.ts` | 38 | Markdown bridge compat fallback |
| 6 | `packages/tbit-core/src/memoryCoreCompat.ts` | 38 | Memory core compat fallback |
| 7 | `packages/tbit-core/src/universalDocumentBridgeCompat.ts` | 35 | Universal document bridge compat fallback |

**Additional**:
| # | File (active) | Line | Context |
|---|--------------|------|---------|
| 8 | `apps/api/src/services/vaultBootstrapService.ts` | 122 | `VaultBootstrapService.initialize()` fallback HMAC secret |

**Note**: `packages/shared/node_modules/@muf/tbit-core/src/*` entries are symlinked copies of the `@muf/tbit-core` package — not separate files. Only the 7 files in `packages/tbit-core/src/` need modification.

### Classification

| Category | ✅/❌ |
|----------|------|
| Legacy code no longer referenced | ❌ No (actively used as fallback) |
| Dead code that can be safely removed | ❌ No (runtime fallback path) |
| Planned Phase 8 functionality | ❌ No |
| Technical debt | ✅ **YES** (hardcoded secret) |
| Security improvement | ✅ **YES** (critical) |

### Decision: **Security improvement — must externalize**
All 7 files in `packages/tbit-core` follow the same pattern: when no active encryption key is configured (i.e., `getActiveEncryptionKeyAsync()` returns null/undefined), they fall back to hashing `"dev-hmac-secret"` to derive the HMAC secret. This is a **development-only fallback** that must never ship to production.

**Approach**: Replace the hardcoded `"dev-hmac-secret"` string with a value sourced from an environment variable (`TBIT_HMAC_SECRET`), throwing a clear error if neither an active encryption key nor the env var is available in production. This keeps the fallback behavior for dev/test while making production safe.

### Scope of change
This change touches `@muf/tbit-core` (canonical source). Per the engineering principles, modifications to T-Bit core must preserve package independence (no `@aios/*` imports). Reading `process.env.TBIT_HMAC_SECRET` is acceptable in a Node.js context; for browser contexts the compat layer is not invoked.

---

## 3. Kernel Initialization, Provider Registration, Subsystem Verification

### Classification

| Category | ✅/❌ |
|----------|------|
| Legacy code no longer referenced | ❌ No |
| Dead code that can be safely removed | ❌ No |
| Planned Phase 8 functionality | ✅ **YES** — Stage 8.4 per approved plan |
| Technical debt | ❌ No (not yet implemented — by design) |
| Security improvement | ❌ No |

### Decision: **Keep inside Stage 8.4 — do not implement now**
Per the user's directive: "Keep Kernel initialization, Provider registration and subsystem verification inside Stage 8.2 as defined in the approved implementation plan."

> **Note**: The AIOS Book labels the stage containing Kernel integration as "8.4". The user's feedback refers to it as "Stage 8.2". I will follow the approved implementation plan's structure. The current `VaultBootstrapService` placeholders (`// TODO Phase 8.4`) will be implemented when that stage is reached.

---

## 4. Testing Roadmap

### Classification

| Category | ✅/❌ |
|----------|------|
| Legacy code no longer referenced | ❌ No |
| Dead code that can be safely removed | ❌ No |
| Planned Phase 8 functionality | ✅ **YES** — Stages 8.1–8.11 per approved plan |
| Technical debt | ❌ No |
| Security improvement | ❌ No |

### Decision: **Do not alter the testing roadmap**
Per the user's directive: "Do not move or redefine the approved testing roadmap. Testing must continue following the Engineering Baseline and the approved Phase 8 implementation plan."

---

## Summary of Actions

| # | Gap | Classification | Action | Stage |
|---|-----|----------------|--------|-------|
| 1 | `apps/api/src/routes.ts` | Dead code / legacy | **Delete** (safe) | Pre-8.2 cleanup |
| 2 | Hardcoded `dev-hmac-secret` (7 files in tbit-core + 1 in vaultBootstrapService) | Security improvement / tech debt | **Externalize** to `process.env.TBIT_HMAC_SECRET` | Pre-8.2 cleanup |
| 3 | Kernel/Provider/Subsystem integration | Planned Phase 8 functionality | **Defer** to Stage 8.4 | Stage 8.4 |
| 4 | Testing roadmap | Planned Phase 8 functionality | **Untouched** | Stages 8.1–8.11 |

---

## Approval

This verification report confirms:
1. `apps/api/src/routes.ts` is **safe to delete** (unreferenced dead code).
2. The `dev-hmac-secret` hardcoding is a **security improvement** requiring externalization across 8 active source files.
3. Kernel/Provider/Subsystem work is **deferred** to its approved stage.
4. The testing roadmap is **unchanged**.

Proceeding with pre-Stage 8.2 cleanup (items 1 and 2), then continuing to Stage 8.2.