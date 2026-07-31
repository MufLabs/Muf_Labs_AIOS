# AIOS — Phase 8 Engineering Analysis: T-Bit Vault Setup (Client-First)

> **Single source of truth** for Phase 8 implementation. Updated after every stage completion.
> Based on **AIOS_Book.md** (authoritative architecture) and codebase investigation.

---

## 1. Current Architecture Analysis

### 1.1 Package Structure (Monorepo)
```
Muf_Labs/
├── apps/
│   ├── api/          # Express REST API (@aios/api) — Port 3001
│   ├── web/          # Vite + React frontend (@aios/web) — Port 3000 (nginx)
│   └── desktop/      # Tauri desktop app (@aios/desktop) — Not yet wired
├── packages/
│   ├── agents/       # @aios/agents
│   ├── database/     # @aios/database
│   ├── kernel/       # @aios/kernel (IKernel, ProviderRegistry, ExecutionPipeline)
│   ├── llm/          # @aios/llm
│   ├── sdk/          # @aios/sdk
│   ├── shared/       # @aios/shared (re-exports @muf/tbit-core runtime paths)
│   ├── tbit-core/    # @muf/tbit-core — **Canonical T-Bit engine**
│   ├── ui/           # @aios/ui
│   └── workflow/     # @aios/workflow
├── docker-compose.yml
├── turbo.json
└── docs/AIOS_Book.md (this file's source of truth)
```

### 1.2 Dependency Graph (Current)
```
@muf/tbit-core (source of truth for T-Bit runtime paths, storage, encryption, indices)
       ▲
       │ re-exports
       │
@aios/shared
       ▲
       │
@aios/api ◄────── routes import @aios/shared, @muf/tbit-core
       ▲
       │
@aios/web (consumes API via fetch clients: tbitRegistrationClient, memoryCoreClient, etc.)
```

**Key Principle**: `@muf/tbit-core` has **zero dependencies** on `@aios/*` packages. All cross-package consumption flows through `@aios/shared` re-exports.

### 1.3 API Architecture (apps/api)
- **Entry**: `apps/api/src/main.ts` → `createServer()` → `startServer()`
- **Routes**: Modular registration in `apps/api/src/routes/index.ts` (11 route modules)
- **Auth**: All `/api/v1/tbit/*` routes protected by `requireSymbolicApiKey` middleware
- **Health**: `/health` endpoint (no auth)
- **T-Bit Setup Routes**: `apps/api/src/routes/tbit-setup.routes.ts`
  - `GET /setup/status` — Returns `{ initialized, encryptionConfigured, spacesCount }`
  - `POST /setup/bootstrap` — Server-side bootstrap: generates key, creates space manifest, initializes container

### 1.4 Frontend Architecture (apps/web)
- **Entry**: `main.tsx` → `App.tsx`
- **State**: `localStorage` keys: `tbit:activeContainerId`, `tbit:activeSpaceId`, `tbit:userId`
- **Onboarding**: `OnboardingView.tsx` (3-step wizard: welcome → profile → creating → done/error)
- **API Clients**:
  - `tbitRegistrationClient.ts` — `bootstrap()`, `getSetupStatus()`, `getEncryptionStatus()`, `hasExistingContainer()`, `getContainerId()`, `getUserId()`
  - `memoryCoreClient.ts` — Memory operations (remember, recall, context, graph, links)
  - Other panel-specific clients
- **Panels**: 16 panels wired in `App.tsx` (QVault, WikiLinks, QuantumRay, Topology, CognitiveTelemetry, Network, ContainerHealth, AIPermissions, EncryptionKeys, AssetManager, BinaryAssets, KVStore, MemoryGraph, QueryIndex, MarkdownImport, GuardianObserver)

### 1.5 Backend T-Bit Core (packages/tbit-core)
**Runtime Paths** (`tbitRuntimePaths.ts`):
- `TBitSpacePaths` — Full directory structure for a space
- `normalizeTBitSpaceId()`, `getTBitSpacesRoot()`, `getTBitSpacePaths()`
- `setActiveTBitDataDir()`, `setActiveTBitSpacesRoot()`, `normalizeTBitVaultRoot()`
- `createSpaceManifest()`, `listSpaceManifests()`
- `TBitSpaceManifest` — `{ spaceId, label, userId, createdAt, updatedAt, version }`

**Storage** (`TBitStorageService.ts`):
- `TBitStorageConfig` — Container paths, HMAC secrets, encryption config
- `recover()` — Startup recovery (WAL replay)
- `inject()`, `recoverData()`, `collapse()`, `snapshot()`, `rollback()`, `exportBundle()`, `importBundle()`

**Encryption** (`EncryptionKeyManager.ts`):
- Key ring with versioned activation
- `generateEncryptionKey()`, `activateStoredKey()`, `isEncryptionConfigured()`, `getActiveEncryptionKeyAsync()`

### 1.6 Kernel Integration (packages/kernel)
- `IKernel.execute(context, request)` — Core execution interface
- `Kernel` — Composes `ProviderRegistry`, `ProviderManager`, `ExecutionPipeline`
- Providers registered dynamically via `kernel.providers` (ProviderRegistry)

### 1.7 Existing Phase 3 Infrastructure (Foundation for Phase 8)
| Component | Location | Purpose |
|-----------|----------|---------|
| `tbitRuntimePaths.ts` | `packages/tbit-core/src/` | Space manifest creation, directory scaffolding, path resolution |
| `tbit-setup.routes.ts` | `apps/api/src/routes/` | Server-side bootstrap API |
| `tbitRegistrationClient.ts` | `apps/web/src/api/tbit/` | Client-side bootstrap & status checking |
| `OnboardingView.tsx` | `apps/web/src/components/` | 3-step wizard (welcome → profile → creating → done) |
| `localStorage` keys | `apps/web/src/App.tsx` | `tbit:activeContainerId`, `tbit:activeSpaceId`, `tbit:userId` |

---

## 2. Gap Analysis

### 2.1 What EXISTS (Phase 3 Foundation)
| Component | Status | Notes |
|-----------|--------|-------|
| Space manifest creation (`createSpaceManifest`) | ✅ Complete | Scaffolds directory tree, writes `space.json` |
| Space listing (`listSpaceManifests`) | ✅ Complete | Scans spaces root for valid manifests |
| Server-side bootstrap API (`POST /setup/bootstrap`) | ✅ Complete | Generates key, creates manifest, initializes container |
| Client-side bootstrap flow (`tbitRegistrationClient.bootstrap`) | ✅ Complete | Calls API, persists containerId/spaceId/userId to localStorage |
| Onboarding wizard UI (`OnboardingView`) | ✅ Complete | 3 steps: welcome → profile → creating → done |
| Runtime path configuration (`setActiveTBitSpacesRoot`) | ✅ Complete | Can override spaces root directory |
| Encryption key generation (`generateEncryptionKey`) | ✅ Complete | Creates AES-256-GCM key, stores in key ring |

### 2.2 What IS MISSING (Phase 8 Requirements)

#### A. Client-First Vault Selection (Native Folder Picker)
| Missing Component | Description |
|-------------------|-------------|
| **Vault Selection UI** | No native OS folder picker in web frontend. Current `OnboardingView` only asks for userId/label. |
| **File System Access API Integration** | Need `window.showDirectoryPicker()` for Chrome/Edge, fallback for Firefox/Safari. |
| **Vault Root Persistence** | Selected vault path must be persisted (IndexedDB or localStorage) and sent to API. |
| **Permission Handling** | Must request/retain file system permission across sessions. |

#### B. Vault Bootstrap Service (Orchestrates All Subsystems)
| Missing Component | Description |
|-------------------|-------------|
| **VaultBootstrapService** | Central orchestrator that initializes: Kernel, T-Bit Memory, Workflow Engine, Provider System, Agent System, Q-Vault — all pointed at the user-selected vault root. |
| **Kernel Initialization** | `IKernel` must be instantiated with vault-aware provider registry. |
| **Provider Registration** | All providers (Memory, Workflow, Agent, Q-Vault) must register with vault-scoped paths. |
| **Subsystem Health Verification** | Each subsystem must report "ready" before vault is marked active. |

#### C. Application Startup Logic (Load & Verify Configured Vault)
| Missing Component | Description |
|-------------------|-------------|
| **Vault Loader** | On app start: read persisted vault config → verify directory exists & is writable → initialize T-Bit runtime paths → bootstrap all subsystems. |
| **Migration/Recovery** | Handle vault version upgrades, schema migrations, corruption recovery. |
| **Fallback to Onboarding** | If no vault configured or vault inaccessible → show `OnboardingView` with folder picker. |

### 2.3 What MUST BE REFACTORED (Extend, Don't Replace)

| Component | Current State | Required Change |
|-----------|---------------|-----------------|
| `tbitRuntimePaths.ts` | Uses `process.cwd()` + `/data/spaces` default | Must accept **vault root** from client; `normalizeTBitVaultRoot()` already exists but needs wiring. |
| `tbit-setup.routes.ts` | Server-side bootstrap (userId + label only) | Add new endpoint `POST /setup/vault` that accepts `vaultRoot` (client-selected) and returns vault config. |
| `tbitRegistrationClient.ts` | Only `bootstrap(userId, label)` | Add `bootstrapWithVault(vaultRoot, userId, label)` using File System Access API. |
| `OnboardingView.tsx` | Text inputs only | Add "Choose Vault Folder" button using native picker. |
| `App.tsx` startup logic | Checks `localStorage.tbit:activeContainerId` | Check vault config → verify accessibility → initialize subsystems → fallback to onboarding. |

### 2.4 What MUST REMAIN UNTOUCHED
| Component | Reason |
|-----------|--------|
| `@muf/tbit-core` internal storage engine (`TBitContainer`, `TBitStorageService`, `AllocationMap`) | Core T-Bit logic is stable and tested. |
| Encryption system (`EncryptionKeyManager`) | Key generation, rotation, HMAC signing are production-ready. |
| Memory Core API (`memoryCore.ts`, `memoryCoreCompat.ts`) | Semantic memory operations work correctly. |
| Kernel interface (`IKernel`, `Kernel.ts`) | Provider orchestration pattern is sound. |
| API route modules (memory, query, semantic, network, etc.) | All 11 route modules compile and function. |
| Docker/Compose configuration (Phase 7) | Production deployment infrastructure complete. |

### 2.5 Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **File System Access API not supported in Firefox/Safari** | Users on non-Chromium browsers cannot pick folders | Implement fallback: manual path input + server-side validation via API. |
| **Permission persistence across sessions** | Browser may revoke directory permission on restart | Store `FileSystemDirectoryHandle` in IndexedDB; re-request on startup. |
| **Vault path synchronization (client ↔ server)** | Server needs to know vault root for all operations | Pass `vaultRoot` in API calls; store in API config; validate on each request. |
| **Multi-space within single vault** | Current manifest system supports multiple spaces | Ensure `createSpaceManifest` works with custom `spacesRoot` from vault root. |
| **Kernel/Provider initialization order** | Providers may depend on each other | Define explicit initialization sequence in `VaultBootstrapService`. |

### 2.6 Architectural Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Breaking `@muf/tbit-core` isolation** | Violates "T-Bit Independence" principle | Only extend `tbitRuntimePaths.ts` exports; never import `@aios/*` into `@muf/tbit-core`. |
| **Circular dependency: `shared` ↔ `tbit-core`** | Build failures | Already resolved in Phase 7: `tbit-core` is source; `shared` only re-exports. |
| **Kernel initialization coupling to vault** | Kernel shouldn't know about vault paths | Kernel receives pre-initialized providers; `VaultBootstrapService` handles wiring. |
| **Frontend bundle size (3D panels >500kB)** | Vite warning | Phase 8.2: Implement `React.lazy` + `Suspense` for 3D panels. |

---

## 3. Phase 8 Master Plan

### 3.1 Implementation Stages (Dependency-Ordered)

| Stage | Objective | Dependencies | Duration |
|-------|-----------|--------------|----------|
| **8.1** | **Client-Side Vault Selection UI** (File System Access API + fallback) | None (extends `OnboardingView`, `tbitRegistrationClient`) | 1 session |
| **8.2** | **Vault Bootstrap Service** (Backend orchestrator) | 8.1 (needs vault root from client) | 1 session |
| **8.3** | **Application Startup & Vault Loader** (Frontend initialization flow) | 8.1, 8.2 | 1 session |
| **8.4** | **Kernel & Provider Vault Integration** (Wire subsystems to vault) | 8.2, 8.3 | 1 session |
| **8.5** | **API Extensions for Vault Operations** (New endpoints) | 8.2 | 0.5 session |
| **8.6** | **Integration Testing & Build Validation** | 8.1–8.5 | 0.5 session |
| **8.7** | **Documentation & AIOS_Book.md Update** | All stages | 0.5 session |

---

### 3.2 Stage 8.1 — Client-Side Vault Selection UI

**Objective**: Replace text-only onboarding with native folder picker for vault location.

**Files Affected**:
| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/src/components/OnboardingView.tsx` | **Modified** | Add "Choose Vault Folder" step with `showDirectoryPicker()` |
| `apps/web/src/api/tbit/tbitRegistrationClient.ts` | **Modified** | Add `bootstrapWithVault(vaultHandle, userId, label)` |
| `apps/web/src/hooks/useVaultPicker.ts` | **New** | Hook encapsulating File System Access API logic + fallback |
| `apps/web/src/types/vault.ts` | **New** | TypeScript types for `VaultConfig`, `VaultHandle` |

**New Files**:
- `apps/web/src/hooks/useVaultPicker.ts`
- `apps/web/src/types/vault.ts`

**Dependencies**: None (extends existing Phase 3)

**Risks**: Browser compatibility (File System Access API), permission persistence

**Acceptance Criteria**:
- [ ] User can click "Choose Vault Folder" → native OS dialog opens
- [ ] Selected folder handle persisted to IndexedDB (`idb` package)
- [ ] Fallback text input for unsupported browsers
- [ ] Permission re-requested on app reload if revoked
- [ ] Vault path sent to API during bootstrap

**Validation Strategy**:
- Manual test in Chrome/Edge/Firefox/Safari
- Automated test: mock `showDirectoryPicker`, verify handle storage

---

### 3.3 Stage 8.2 — Vault Bootstrap Service (Backend Orchestrator)

**Objective**: Central service that initializes ALL subsystems against a vault root.

**Files Affected**:
| File | Change Type | Description |
|------|-------------|-------------|
| `packages/tbit-core/src/tbitRuntimePaths.ts` | **Modified** | Export `setActiveTBitSpacesRoot()` — already exists; ensure it's wired |
| `apps/api/src/services/vaultBootstrapService.ts` | **New** | Core orchestrator class |
| `apps/api/src/routes/tbit-vault.routes.ts` | **New** | API endpoints: `POST /vault/init`, `GET /vault/status`, `POST /vault/verify` |
| `apps/api/src/routes/index.ts` | **Modified** | Register new vault routes |

**New Files**:
- `apps/api/src/services/vaultBootstrapService.ts`
- `apps/api/src/routes/tbit-vault.routes.ts`

**Dependencies**: Stage 8.1 (client sends vault root)

**VaultBootstrapService Responsibilities**:
1. **Receive vault root** from client (validated path)
2. **Set T-Bit runtime paths**: `setActiveTBitSpacesRoot(vaultRoot + "/spaces")`
3. **Initialize encryption**: Ensure key exists or generate
4. **Create/verify default space**: `createSpaceManifest()` for primary user
5. **Initialize T-Bit storage**: `TBitStorageService.recover()` on default space
6. **Register Kernel providers**: Memory, Workflow, Agent, Q-Vault providers with vault-scoped config
7. **Initialize Kernel**: `new Kernel()` with vault-aware provider registry
8. **Verify all subsystems**: Health checks for Memory, Query, Semantic, Network, Asset, Q-Vault
9. **Return vault config**: `{ vaultRoot, spaceId, encryptionKeyId, kernelReady, subsystems: {...} }`

**Risks**: Initialization order dependencies, provider registration failures

**Acceptance Criteria**:
- [ ] `POST /api/v1/tbit/vault/init` accepts `{ vaultRoot, userId, label }` → returns vault config
- [ ] `GET /api/v1/tbit/vault/status` returns current vault state
- [ ] `POST /api/v1/tbit/vault/verify` validates vault accessibility
- [ ] All 6 subsystems (Memory, Workflow, Provider, Agent, Q-Vault, Kernel) report ready
- [ ] Vault config persisted for subsequent starts

**Validation Strategy**:
- Unit test `VaultBootstrapService` with temp directory
- Integration test: Docker compose up → call `/vault/init` → verify all subsystems respond

---

### 3.4 Stage 8.3 — Application Startup & Vault Loader (Frontend)

**Objective**: On app load, detect configured vault → verify → initialize → or show onboarding.

**Files Affected**:
| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/src/main.tsx` | **Modified** | Add vault initialization before rendering `App` |
| `apps/web/src/App.tsx` | **Modified** | Replace `localStorage` check with vault config check |
| `apps/web/src/hooks/useVaultInit.ts` | **New** | Hook managing vault load/verify/init flow |
| `apps/web/src/api/tbit/tbitVaultClient.ts` | **New** | API client for vault endpoints |

**New Files**:
- `apps/web/src/hooks/useVaultInit.ts`
- `apps/web/src/api/tbit/tbitVaultClient.ts`

**Dependencies**: Stages 8.1, 8.2

**Flow**:
```
App Load
    ↓
useVaultInit()
    ↓
Read vault config from IndexedDB (vaultRoot, permissionHandle)
    ↓
IF no config → Show OnboardingView (with folder picker)
    ↓
ELSE verify vault accessible via API (GET /vault/status)
    ↓
IF accessible → Initialize React Query, mount App with panels
    ↓
IF not accessible → Show error + "Reconfigure Vault" button → OnboardingView
```

**Acceptance Criteria**:
- [ ] App loads vault config from IndexedDB on startup
- [ ] API health check validates vault before mounting panels
- [ ] Graceful fallback to onboarding if vault missing/inaccessible
- [ ] No flash of unauthenticated content
- [ ] Loading spinner during vault verification

**Validation Strategy**:
- E2E test: fresh install → onboarding → vault pick → bootstrap → reload → auto-load
- E2E test: revoke permission → reload → re-request permission

---

### 3.5 Stage 8.4 — Kernel & Provider Vault Integration

**Objective**: Wire Kernel providers to use vault-scoped paths.

**Files Affected**:
| File | Change Type | Description |
|------|-------------|-------------|
| `packages/kernel/src/core/Kernel.ts` | **Modified** | Accept optional `vaultConfig` in constructor |
| `packages/kernel/src/providers/ProviderManager.ts` | **Modified** | Providers receive vault-scoped config |
| `packages/agents/src/` | **Modified** | Agent system reads vault root for persistence |
| `packages/workflow/src/` | **Modified** | Workflow engine uses vault paths |
| `packages/llm/src/` | **Modified** | LLM provider uses vault for context/memory |

**Dependencies**: Stage 8.2 (VaultBootstrapService creates Kernel)

**Key Changes**:
1. `Kernel` constructor accepts `vaultRoot?: string`
2. `ProviderManager` passes `vaultRoot` to each provider's `initialize(config)`
3. Providers (`MemoryProvider`, `WorkflowProvider`, `AgentProvider`, `QVaultProvider`) read paths from `tbitRuntimePaths` (which now points to vault)
4. `VaultBootstrapService` instantiates `Kernel` with `vaultRoot` after T-Bit paths configured

**Acceptance Criteria**:
- [ ] Kernel starts with vault-aware providers
- [ ] Memory operations persist to vault space
- [ ] Workflow definitions stored in vault
- [ ] Agent memories isolated per vault
- [ ] Q-Vault 3D engine reads/writes vault data

**Validation Strategy**:
- Unit test each provider with temp vault directory
- Integration test: full kernel execution with vault config

---

### 3.6 Stage 8.5 — API Extensions for Vault Operations

**Objective**: Expose vault lifecycle endpoints.

**Files Affected**:
| File | Change Type | Description |
|------|-------------|-------------|
| `apps/api/src/routes/tbit-vault.routes.ts` | **New** | (Created in 8.2) Add: `POST /vault/migrate`, `GET /vault/config`, `POST /vault/repair` |

**New Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tbit/vault/init` | Initialize vault (called by client after folder pick) |
| GET | `/api/v1/tbit/vault/status` | Current vault state (initialized, space count, health) |
| POST | `/api/v1/tbit/vault/verify` | Validate vault accessibility & integrity |
| GET | `/api/v1/tbit/vault/config` | Return vault configuration (paths, keys, spaces) |
| POST | `/api/v1/tbit/vault/migrate` | Run schema migrations (future-proofing) |
| POST | `/api/v1/tbit/vault/repair` | Attempt corruption recovery |

**Acceptance Criteria**:
- [ ] All endpoints require `requireSymbolicApiKey`
- [ ] Responses match TypeScript interfaces in `@aios/shared`
- [ ] OpenAPI/Swagger docs updated (if applicable)

---

### 3.7 Stage 8.6 — Integration Testing & Build Validation

**Objective**: Full end-to-end verification.

**Validation Checklist**:
| Check | Command | Expected |
|-------|---------|----------|
| TypeScript compile | `pnpm run build` | ✅ 11/11 packages |
| Lint | `pnpm run lint` | ✅ No errors |
| Unit tests | `pnpm run test` | ✅ All pass |
| API tests | `docker compose up --build` + `curl` | ✅ Health checks pass |
| E2E flow | Manual: fresh browser → onboard → reload | ✅ Auto-loads vault |
| Chunk size | `pnpm run build --filter=@aios/web` | ⚠️ < 500kB (Phase 8.7 task) |

---

### 3.8 Stage 8.7 — Documentation & AIOS_Book.md Update

**Objective**: Update all living documentation.

**Files to Update**:
| File | Updates |
|------|---------|
| `docs/AIOS_Book.md` | Phase 8 status, new architecture sections, API routes, vault config |
| `docs/AIOS_AppBible.md` | User flow for vault selection, onboarding updates |
| `Framework/standards/` | Any new coding patterns (VaultBootstrapService, hooks) |
| `CHANGELOG.md` | Phase 8 completion entry |

---

## 4. Architecture Validation (Pre-Implementation)

### 4.1 Principle Compliance Checklist

| Principle | Phase 8 Impact | Validation |
|-----------|----------------|------------|
| **Modularity** | New `vaultBootstrapService` in `apps/api/src/services/` — isolated, single responsibility | ✅ New file, no cross-package deps |
| **Package Isolation** | `vaultBootstrapService` imports `@muf/tbit-core`, `@aios/kernel`, `@aios/shared` — all declared deps | ✅ Check `apps/api/package.json` |
| **Dependency Inversion** | Kernel receives providers via registry; `VaultBootstrapService` wires them | ✅ No concrete deps in Kernel |
| **Provider Abstraction** | Providers initialized with vault config; no hardcoded paths | ✅ Uses `tbitRuntimePaths` |
| **Kernel Responsibilities** | Kernel executes; `VaultBootstrapService` handles lifecycle | ✅ Separation maintained |
| **T-Bit Independence** | `@muf/tbit-core` unchanged; only `tbitRuntimePaths.ts` extended (already exported) | ✅ Zero `@aios/*` imports in `tbit-core` |

### 4.2 Proposed Improvements (Pre-Implementation)

1. **Move `tbitRuntimePaths.ts` to `@aios/shared`** (tracked in TODO list)
   - Currently in `@muf/tbit-core` but re-exported by `@aios/shared`
   - Better: canonical location in `shared`, `tbit-core` imports from `shared`
   - **Decision**: Defer to post-Phase 8 to avoid scope creep. Current architecture works.

2. **Code-splitting for 3D panels** (Vite chunk >500kB warning)
   - Wrap 3D panel components in `React.lazy()` + `Suspense`
   - **Decision**: Phase 8.6 validation will measure; implement if still >500kB.

3. **Vault config schema in `@aios/shared`**
   - Define `VaultConfig` interface shared by API and Web
   - **Decision**: Add in Stage 8.2 when creating `tbit-vault.routes.ts`.

---

## 5. Implementation Plan (Execution Order)

### 5.1 Stage 8.1 — Client Vault Selection UI

**Order**: First (no backend deps)

**Steps**:
1. Create `apps/web/src/types/vault.ts` with:
   ```typescript
   export interface VaultConfig {
     rootHandle: FileSystemDirectoryHandle; // or serialized path for fallback
     rootPath: string; // human-readable
     grantedAt: number;
     spacesRoot: string; // derived: rootPath + "/spaces"
   }
   export interface VaultInitRequest {
     vaultRoot: string; // server-resolved path
     userId: string;
     label?: string;
   }
   export interface VaultInitResponse {
     vaultRoot: string;
     spaceId: string;
     encryptionKeyId: string;
     kernelReady: boolean;
     subsystems: Record<string, boolean>;
   }
   ```

2. Create `apps/web/src/hooks/useVaultPicker.ts`:
   - `pickVaultFolder(): Promise<VaultConfig | null>`
   - `restoreVaultPermission(config: VaultConfig): Promise<boolean>`
   - `saveVaultConfig(config: VaultConfig): Promise<void>`
   - `loadVaultConfig(): Promise<VaultConfig | null>`
   - `clearVaultConfig(): Promise<void>`
   - Uses `idb` (IndexedDB wrapper) for `FileSystemDirectoryHandle` persistence

3. Modify `OnboardingView.tsx`:
   - Add step `"vault"` between `"welcome"` and `"profile"`
   - UI: "Choose Vault Folder" button → calls `pickVaultFolder()`
   - Show selected path, "Change" button
   - Fallback: text input for manual path (server-validated)

4. Modify `tbitRegistrationClient.ts`:
   - Add `async bootstrapWithVault(vaultConfig: VaultConfig, userId: string, label?: string)`
   - Calls `POST /api/v1/tbit/vault/init` with `{ vaultRoot: config.rootPath, userId, label }`
   - Persists returned `spaceId`, `encryptionKeyId` to localStorage

**Validation**: Build web → manual test folder picker in Chrome/Edge.

---

### 5.2 Stage 8.2 — Vault Bootstrap Service (Backend)

**Order**: Second (needs vault root from client)

**Steps**:
1. Create `apps/api/src/services/vaultBootstrapService.ts`:
   ```typescript
   export class VaultBootstrapService {
     async initialize(vaultRoot: string, userId: string, label: string): Promise<VaultInitResponse>
     async verify(vaultRoot: string): Promise<VaultStatus>
     async getStatus(): Promise<VaultStatus>
     async migrate(vaultRoot: string): Promise<void>
     async repair(vaultRoot: string): Promise<RepairResult>
   }
   ```

2. Create `apps/api/src/routes/tbit-vault.routes.ts`:
   - `POST /vault/init` → `VaultBootstrapService.initialize()`
   - `GET /vault/status` → `VaultBootstrapService.getStatus()`
   - `POST /vault/verify` → `VaultBootstrapService.verify()`
   - `GET /vault/config` → `VaultBootstrapService.getConfig()`
   - All protected by `requireSymbolicApiKey`

3. Register routes in `apps/api/src/routes/index.ts`

4. Implementation details for `initialize()`:
   ```typescript
   // 1. Normalize & validate vault root
   const spacesRoot = normalizeTBitVaultRoot(path.join(vaultRoot, "spaces"));
   setActiveTBitSpacesRoot(spacesRoot);
   
   // 2. Ensure encryption key
   const keyStatus = await getEncryptionKeyStatus();
   let encryptionKeyId: string;
   if (!keyStatus.configured) {
     const key = await generateEncryptionKey(`vault-${normalizeTBitSpaceId(userId)}`);
     encryptionKeyId = key.id;
   } else {
     encryptionKeyId = keyStatus.activeKeyId;
   }
   
   // 3. Create default space
   const spaceId = `user:${normalizeTBitSpaceId(userId)}`;
   const manifest = await createSpaceManifest({ spaceId, label: label ?? `AIOS Vault ${userId}`, userId });
   
   // 4. Initialize T-Bit storage for space
   const paths = getTBitSpacePaths(spaceId);
   const storage = new TBitStorageService(buildStorageConfig(paths, encryptionKeyId));
   await storage.recover();
   
   // 5. Initialize Kernel with vault-aware providers
   const kernel = new Kernel(vaultRoot);
   await kernel.initializeProviders(); // New method
   
   // 6. Verify subsystems
   const subsystems = await verifySubsystems(kernel);
   
   return { vaultRoot, spaceId: manifest.spaceId, encryptionKeyId, kernelReady: true, subsystems };
   ```

**Validation**: Unit test with temp dir; Integration test via Docker.

---

### 5.3 Stage 8.3 — Frontend Vault Loader

**Order**: Third (needs 8.1 + 8.2)

**Steps**:
1. Create `apps/web/src/api/tbit/tbitVaultClient.ts`:
   - `initVault(vaultConfig, userId, label)`
   - `getVaultStatus()`
   - `verifyVault()`

2. Create `apps/web/src/hooks/useVaultInit.ts`:
   ```typescript
   export function useVaultInit() {
     const [state, setState] = useState<'loading' | 'onboarding' | 'ready' | 'error'>('loading');
     const [vaultConfig, setVaultConfig] = useState<VaultConfig | null>(null);
     
     useEffect(() => {
       async function init() {
         const config = await loadVaultConfig();
         if (!config) { setState('onboarding'); return; }
         
         const ok = await restoreVaultPermission(config);
         if (!ok) { setState('onboarding'); return; }
         
         const status = await tbitVaultClient.getVaultStatus();
         if (status.initialized) {
           setVaultConfig(config);
           setState('ready');
         } else {
           setState('onboarding');
         }
       }
       init();
     }, []);
     
     return { state, vaultConfig, retry: init };
   }
   ```

3. Modify `main.tsx`:
   ```tsx
   const root = createRoot(document.getElementById('root')!);
   
   function AppWrapper() {
     const { state, vaultConfig } = useVaultInit();
     
     if (state === 'loading') return <LoadingSpinner />;
     if (state === 'onboarding') return <OnboardingView onComplete={handleComplete} />;
     if (state === 'error') return <ErrorView onRetry={retry} />;
     
     return <App vaultConfig={vaultConfig} />;
   }
   
   root.render(<AppWrapper />);
   ```

4. Modify `App.tsx`:
   - Remove `localStorage` check for `tbit:activeContainerId`
   - Accept `vaultConfig` prop
   - Pass `vaultConfig` to panel components that need it

**Validation**: Full E2E flow in browser.

---

### 5.4 Stage 8.4 — Kernel & Provider Integration

**Order**: Fourth (backend orchestration)

**Steps**:
1. Modify `packages/kernel/src/core/Kernel.ts`:
   ```typescript
   export class Kernel implements IKernel {
     constructor(private readonly vaultRoot?: string) { ... }
     
     async initializeProviders(): Promise<void> {
       // Providers already registered; call initialize with vault config
       for (const provider of this.providerManager.getAll()) {
         await provider.initialize({ vaultRoot: this.vaultRoot });
       }
     }
   }
   ```

2. Update providers (`packages/agents`, `packages/workflow`, etc.) to accept `vaultRoot` in `initialize()`

3. Ensure `ProviderManager` passes vault config to providers

**Validation**: Kernel unit tests with vault config.

---

### 5.5 Stage 8.5 — API Extensions

**Order**: Fifth (parallel with 8.4)

**Steps**:
- Add remaining endpoints to `tbit-vault.routes.ts`
- Add TypeScript interfaces to `@aios/shared` for vault config

---

### 5.6 Stage 8.6 — Build & Test Validation

**Order**: Sixth

**Commands**:
```bash
pnpm run build           # Must pass: 11/11 packages
pnpm run lint            # Must pass
pnpm run test            # Must pass
docker compose up --build # Must bring up healthy services
```

---

### 5.7 Stage 8.7 — Documentation Update

**Order**: Final

**Files**: `AIOS_Book.md`, `AIOS_AppBible.md`, `CHANGELOG.md`

---

## 6. Verification Strategy (Per Stage)

| Stage | Verification Method | Success Criteria |
|-------|---------------------|------------------|
| 8.1 | Manual browser test + unit test (mock FS API) | Folder picker opens, handle stored, fallback works |
| 8.2 | Unit test (temp dir) + Docker integration test | All subsystems report ready; API returns vault config |
| 8.3 | E2E test (Playwright/Cypress) | Fresh load → onboarding → reload → auto-load |
| 8.4 | Kernel unit tests + provider integration tests | Providers initialize with vaultRoot; operations persist to vault |
| 8.5 | API contract test (OpenAPI) | All endpoints return typed responses |
| 8.6 | Full CI pipeline | `pnpm run build && pnpm run test && docker compose up --build` |
| 8.7 | Doc review | `AIOS_Book.md` reflects Phase 8 architecture |

---

## 7. Documentation Updates (Post-Stage)

### 7.1 AIOS_Book.md Additions

**Phase Status Table**:
```markdown
| **Phase 8** | ✅ **Complete** | T-Bit Vault Setup (client-first folder picker, Vault Bootstrap Service, startup loader) |
```

**New Sections**:
- "## 🔐 Phase 8 — T-Bit Vault Setup (Client-First)"
  - Stage 8.1: Vault Selection UI
  - Stage 8.2: VaultBootstrapService
  - Stage 8.3: Startup Vault Loader
  - Stage 8.4: Kernel/Provider Vault Integration
  - Stage 8.5: Vault API Extensions
- Updated "## 🌐 API Routes" with `/vault/*` endpoints
- Updated "## 🏗️ Architecture" with vault initialization sequence diagram
- Updated "## ⚠️ Technical Risks" with mitigations applied

### 7.2 AIOS_AppBible.md Updates
- User flow: "First Run → Choose Vault Folder → Create Identity → Enter AIOS"
- Vault migration/reconfiguration flow
- Permission management for File System Access API

### 7.3 CHANGELOG.md
```markdown
## [Phase 8] - 2026-07-31
### Added
- Client-first vault selection with native OS folder picker (File System Access API)
- VaultBootstrapService orchestrating Kernel, Memory, Workflow, Agent, Q-Vault initialization
- Application startup vault loader with permission persistence (IndexedDB)
- Vault lifecycle API: init, status, verify, config, migrate, repair
### Changed
- OnboardingView: Added vault selection step
- tbitRuntimePaths: Vault root wiring for multi-space support
- Kernel: Accepts vaultRoot for provider initialization
### Fixed
- File System Access API fallback for Firefox/Safari
- Vault permission re-request on browser restart
```

---

## 8. Risk Mitigation Summary

| Risk | Mitigation in Plan |
|------|-------------------|
| Browser FS API support | Stage 8.1: Fallback text input + server validation |
| Permission persistence | Stage 8.1: IndexedDB storage of `FileSystemDirectoryHandle`; re-request on failure |
| Vault path sync client↔server | Stage 8.2: Client sends `vaultRoot`; server normalizes via `normalizeTBitVaultRoot()` |
| Subsystem init order | Stage 8.2: Explicit sequence in `VaultBootstrapService.initialize()` |
| Kernel coupling | Stage 8.4: Kernel receives vaultRoot via constructor; providers via `initialize()` |
| T-Bit core isolation | Maintained: only `tbitRuntimePaths.ts` extended (already exported) |
| Bundle size | Stage 8.6: Measure; Stage 8.7: Code-split if needed |

---

## 9. Approval Gate

**Before implementation begins**, confirm:

- [ ] Architecture validation passed (Section 4)
- [ ] Phase 7 Docker/Compose infrastructure stable
- [ ] `@muf/tbit-core` build passes in isolation
- [ ] No blocking dependencies on Phase 8.1 start

**Approval**: ________________ Date: ________________

---

*This document is the single source of truth for Phase 8. Update after each stage completion.*