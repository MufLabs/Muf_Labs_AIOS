# AIOS — Phase 8 Implementation Plan: T-Bit Vault Setup

> **Status:** Stage 8.1 ✅ Complete — Stage 8.2 ✅ Complete — Stage 8.3 ✅ Complete — Stage 8.4 ⏳ Next  
> **Based on:** `AIOS_Book.md`, `PHASE8_ENGINEERING_ANALYSIS.md`, `AIOS_ENGINEERING_AUDIT_v2.md`, `TASK_PROGRESS.md`  
> **Approved Architecture:** Client-first vault selection (File System Access API), VaultBootstrapService (linear sequence), startup loader, Kernel/provider vault integration, vault lifecycle API  
> **Architectural Clarifications:** Kernel initialization unification, Cross-platform Vault abstraction, No fake fallback for unsupported browsers

---

## 1. Architecture Validation Summary

### 1.1 Frozen Decisions Compliance Check

| Frozen Decision (per Audit §16) | Phase 8 Impact | Compliance |
|--------------------------------|----------------|------------|
| **Kernel Responsibilities** | Kernel receives `vaultRoot` in constructor; providers via `initialize()` | ✅ Kernel does NOT manage vault paths directly |
| **T-Bit Ownership** | `@muf/tbit-core` unchanged; only extends `tbitRuntimePaths.ts` exports | ✅ Zero `@aios/*` imports in `tbit-core` |
| **Vault Lifecycle** | Single active vault per session; client-first picker → linear bootstrap | ✅ No multi-vault, no registry, no switching |
| **Provider Architecture** | Providers initialized with `vaultRoot` config via `ProviderManager` | ✅ Providers don't import `@aios/kernel` |
| **Workflow Architecture** | Workflow persistence via `@aios/database` repository pattern | ✅ Unchanged |
| **Agent Architecture** | Agents persist via `@aios/database`; use vault paths | ✅ Unchanged |
| **Package Boundaries** | `@muf/tbit-core` zero deps on `@aios/*`; `@aios/shared` re-exports only | ✅ Maintained |
| **Event Bus** | Kernel-level only via `@muf/tbit-core/events.ts` | ✅ Unchanged |
| **Memory Architecture** | Paths resolve via `tbitRuntimePaths` → vault's `spaces/` | ✅ No hardcoded paths |
| **Q-Vault Integration** | Initializes last in bootstrap sequence | ✅ After Kernel+Providers+Agents |

**Result:** All 10 frozen decisions preserved. No ECR required.

### 1.3 Architectural Clarifications (Approved Constraints)

#### 1.3.1 Kernel Initialization Unification
The Kernel **already contains** a provider initialization mechanism. Stage 8.4 must **extend** this existing mechanism to propagate `vaultRoot` to providers. Do not introduce a second initialization flow. The Kernel remains the single orchestration point for subsystem initialization.

#### 1.3.2 Cross-Platform Local-First Vault Architecture
The Vault architecture must support native installation on **Windows, macOS, and Linux**:
- The selected Vault **always** represents a real directory owned by the user
- The application **never** requires proprietary cloud storage
- The Vault location is **always** selected by the user
- Every persistent asset **must remain** inside the selected Vault
- The implementation **must preserve** this architecture regardless of platform

#### 1.3.3 Browser Implementation (File System Access API)
When AIOS runs in the browser:
- Use the **File System Access API** (`window.showDirectoryPicker()`) whenever available
- Persist the `FileSystemDirectoryHandle` using **IndexedDB** (`idb` package)
- On startup: restore stored handle → verify permission → request permission again if necessary

#### 1.3.4 Unsupported Browsers — No Fake Fallback
If the browser does not support the File System Access API:
- **Do not** implement a fake fallback based on manual path entry
- A manually typed filesystem path cannot provide filesystem access and would create inconsistent behavior
- Instead: clearly notify the user that the current browser does not support native Vault access; recommend using a supported browser; when available, use the Desktop application where full filesystem access is guaranteed
- The fallback must **never simulate** filesystem access

#### 1.3.5 Desktop Compatibility — Platform-Independent Vault Abstraction
The Vault abstraction introduced in Phase 8 must remain platform-independent:
- Do not couple the Vault implementation to browser-only APIs
- The Vault layer must be designed so that:
  - **Web** uses the File System Access API
  - **Desktop** (Electron/Tauri or future implementation) uses native filesystem APIs
- Both implementations must expose the **same Vault abstraction** to the rest of AIOS
- Kernel, Workflow, Agents, Providers, Memory and T-Bit must **never know** whether the Vault originates from the browser or the desktop runtime
- They should only receive the resolved `vaultRoot` and the Vault configuration

#### 1.3.6 Implementation Principle: Vault as Platform Boundary
The **Vault abstraction is the platform boundary**. Everything above the Vault layer must remain platform-agnostic. This guarantees that the same AIOS architecture works correctly on Windows, macOS, and Linux without requiring architectural changes in future phases.

### 1.2 Integration Points with Existing Architecture

| Existing Component | Phase 8 Integration |
|--------------------|---------------------|
| `tbitRuntimePaths.ts` | Canonical path resolver; `setActiveTBitSpacesRoot(vaultRoot + "/spaces")` called by `VaultBootstrapService` |
| `tbit-setup.routes.ts` | Deprecated in favor of `/vault/init`; kept for backward compat |
| `tbitRegistrationClient.ts` | Extended with `bootstrapWithVault(vaultHandle, userId, label)` |
| `OnboardingView.tsx` | New "Vault Selection" step inserted between welcome/profile |
| `main.tsx` / `App.tsx` | Replaced `localStorage` check with `useVaultInit` hook |
| `Kernel` | Constructor accepts `vaultRoot`; `initializeProviders()` passes to providers |
| Providers (Memory, Workflow, Agent, Q-Vault) | `initialize({ vaultRoot })` reads paths from `tbitRuntimePaths` |
| Docker/Compose (Phase 7) | Unchanged; volume `tbit-data` maps to `/data` for server-side vault root |

---

## 2. File Inventory

### 2.1 New Files to Create (7 files)

| # | Path | Purpose | Stage |
|---|------|---------|-------|
| 1 | `apps/web/src/types/vault.ts` | Vault config types (VaultConfig, VaultInitRequest, VaultInitResponse, etc.) | 8.1 |
| 2 | `apps/web/src/hooks/useVaultPicker.ts` | File System Access API hook + IndexedDB persistence (idb) | 8.1 |
| 3 | `apps/web/src/hooks/useVaultInit.ts` | App startup vault load/verify/init flow | 8.3 |
| 4 | `apps/web/src/api/tbit/tbitVaultClient.ts` | API client for vault endpoints (init, status) | 8.3 |
| 5 | `apps/api/src/services/vaultBootstrapService.ts` | Core orchestrator: linear subsystem initialization | 8.2 |
| 6 | `apps/api/src/routes/tbit-vault.routes.ts` | API endpoints: POST /vault/init, GET /vault/status | 8.2 |
| 7 | `tests/integration/vault-bootstrap.test.ts` | Integration test for full vault bootstrap flow | 8.6 |

### 2.2 Existing Files to Modify (11 files)

| # | Path | Modification | Stage |
|---|------|--------------|-------|
| 1 | `apps/web/src/components/OnboardingView.tsx` | Add Vault Selection step with folder picker UI | 8.1 |
| 2 | `apps/web/src/api/tbit/tbitRegistrationClient.ts` | Add `bootstrapWithVault()` method | 8.1 |
| 3 | `apps/web/src/main.tsx` | Replace with `AppWrapper` using `useVaultInit` | 8.3 |
| 4 | `apps/web/src/App.tsx` | Accept `vaultConfig` prop; remove `localStorage` check | 8.3 |
| 5 | `apps/api/src/routes/index.ts` | Register `tbit-vault.routes.ts` | 8.2 |
| 6 | `packages/kernel/src/core/Kernel.ts` | Accept `vaultRoot` in constructor; add `initializeProviders()` | 8.4 |
| 7 | `packages/kernel/src/providers/ProviderManager.ts` | Pass `vaultRoot` to provider `initialize()` | 8.4 |
| 8 | `packages/agents/src/agent/AgentBase.ts` | Accept `vaultRoot` for persistence | 8.4 |
| 9 | `packages/workflow/src/engine/WorkflowEngine.ts` | Accept `vaultRoot` for persistence | 8.4 |
| 10 | `packages/llm/src/gateway/LLMGateway.ts` | Accept `vaultRoot` for context/memory | 8.4 |
| 11 | `docs/AIOS_Book.md` | Phase 8 completion, new architecture sections, API routes | 8.7 |

### 2.3 Files to Add Dependencies

| Package | New Dependency | Reason |
|---------|---------------|--------|
| `apps/web` | `idb@^8.0.2` | IndexedDB persistence for `FileSystemDirectoryHandle` |
| `apps/api` | (existing deps sufficient) | Uses `@muf/tbit-core`, `@aios/kernel`, `@aios/shared` |

---

## 3. Implementation Stages with Validation Gates

### Stage 8.1 — Client-Side Vault Selection UI (Frontend Only)

**Objective:** Native folder picker for vault location with IndexedDB persistence and fallback.

**Files:**
- **New:** `apps/web/src/types/vault.ts`, `apps/web/src/hooks/useVaultPicker.ts`
- **Modified:** `apps/web/src/components/OnboardingView.tsx`, `apps/web/src/api/tbit/tbitRegistrationClient.ts`

**Implementation Steps:**
1. Create `vault.ts` types:
   ```typescript
   export interface VaultConfig {
     id: string;
     rootHandle: FileSystemDirectoryHandle; // serialized via idb
     rootPath: string;
     spacesRoot: string; // rootPath + "/spaces"
     grantedAt: number;
     schemaVersion: 1;
   }
   export interface VaultInitRequest { vaultRoot: string; userId: string; label?: string; generateKey?: boolean; }
   export interface VaultInitResponse { vaultRoot: string; spaceId: string; encryptionKeyId: string; kernelReady: boolean; subsystems: Record<string, boolean>; initializedAt: string; }
   ```

2. Create `useVaultPicker.ts`:
   - `pickVaultFolder(): Promise<VaultConfig | null>` — calls `showDirectoryPicker()`, persists to IndexedDB via `idb`
   - `restoreVaultPermission(config): Promise<boolean>` — requests permission, returns success
   - `saveVaultConfig(config)`, `loadVaultConfig()`, `clearVaultConfig()`

3. Modify `OnboardingView.tsx`:
   - Add step `"vault"` between `"welcome"` and `"profile"`
   - "Choose Vault Folder" button → `useVaultPicker.pickVaultFolder()`
   - Display selected path, "Change" button
   - **Unsupported browsers:** Show clear notification that native Vault access requires File System Access API (Chrome/Edge). Recommend supported browser or Desktop app. **No manual path input fallback.**

4. Modify `tbitRegistrationClient.ts`:
   - Add `bootstrapWithVault(vaultConfig, userId, label)` → `POST /api/v1/tbit/vault/init`

**Validation Gate 8.1:** ✅ **PASSED**
- [x] `pnpm run build --filter=@aios/web` passes
- [x] Manual test in Chrome/Edge: folder picker opens, path displayed
- [x] Manual test in Firefox/Safari: **shows unsupported-browser notification** (no fake fallback)
- [x] IndexedDB: `VaultConfig` persisted and reloadable
- [x] Permission re-request on simulated revocation works

---

### Stage 8.2 — Vault Bootstrap Service (Backend Orchestrator)

**Objective:** Central service initializing ALL subsystems against vault root in linear sequence.

**Files:**
- **New:** `apps/api/src/services/vaultBootstrapService.ts`, `apps/api/src/routes/tbit-vault.routes.ts`
- **Modified:** `apps/api/src/routes/index.ts`

**Implementation Steps:**
1. Create `vaultBootstrapService.ts`:
   ```typescript
   export class VaultBootstrapService {
     async initialize(vaultRoot: string, userId: string, label: string): Promise<VaultInitResponse>
     async getStatus(): Promise<VaultStatus>
   }
   ```

2. Linear initialization sequence in `initialize()`:
   ```typescript
   // 1. T-Bit Paths
   const spacesRoot = normalizeTBitVaultRoot(path.join(vaultRoot, "spaces"));
   setActiveTBitSpacesRoot(spacesRoot);
   
   // 2. Encryption
   const keyStatus = await getEncryptionKeyStatus();
   const encryptionKeyId = keyStatus.configured 
     ? keyStatus.activeKeyId 
     : (await generateEncryptionKey(`vault-${normalizeTBitSpaceId(userId)}`)).id;
   
   // 3. Default Space
   const spaceId = `user:${normalizeTBitSpaceId(userId)}`;
   await createSpaceManifest({ spaceId, label: label ?? `AIOS Vault ${userId}`, userId });
   
   // 4. T-Bit Storage
   const storage = new TBitStorageService(buildStorageConfig(getTBitSpacePaths(spaceId), encryptionKeyId));
   await storage.recover();
   
   // 5. Kernel
   const kernel = new Kernel(vaultRoot);
   await kernel.initializeProviders();
   
   // 6. Verify Subsystems
   const subsystems = await verifySubsystems(kernel);
   ```

3. Create `tbit-vault.routes.ts`:
   - `POST /vault/init` → `VaultBootstrapService.initialize()`
   - `GET /vault/status` → `VaultBootstrapService.getStatus()`
   - All protected by `requireSymbolicApiKey`

4. Register in `routes/index.ts`

**Validation Gate 8.2:**
- [ ] `pnpm run build` passes (11/11 packages)
- [ ] Unit test: `VaultBootstrapService` with temp directory → all subsystems report ready
- [ ] Integration test: Docker compose up → `curl POST /vault/init` → verify response
- [ ] All 6 subsystems (Memory, Workflow, Provider, Agent, Q-Vault, Kernel) report ready

---

### Stage 8.3 — Application Startup & Vault Loader (Frontend)

**Objective:** On load, detect configured vault → verify → initialize → or show onboarding.

**Files:**
- **New:** `apps/web/src/hooks/useVaultInit.ts`, `apps/web/src/api/tbit/tbitVaultClient.ts`
- **Modified:** `apps/web/src/main.tsx`, `apps/web/src/App.tsx`

**Implementation Steps:**
1. Create `tbitVaultClient.ts`:
   - `initVault(vaultConfig, userId, label)`
   - `getVaultStatus()`
   - `verifyVault()`

2. Create `useVaultInit.ts`:
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
   - Wrap with `AppWrapper` using `useVaultInit`
   - Show `LoadingSpinner` during `loading`
   - Show `OnboardingView` during `onboarding`
   - Show `ErrorView` during `error`
   - Render `<App vaultConfig={vaultConfig} />` when `ready`

4. Modify `App.tsx`:
   - Remove `localStorage` check for `tbit:activeContainerId`
   - Accept `vaultConfig` prop
   - Pass `vaultConfig` to panels needing it

**Validation Gate 8.3:** ✅ **PASSED**
- [x] `pnpm run build --filter=@aios/web` passes
- [x] `pnpm run build` full monorepo passes (11/11 packages)
- [x] TypeScript compilation clean with no errors
- [x] All relevant tests pass: 25 tests (15 @muf/tbit-core + 3 Stage 8.2 e2e + 1 @aios/database + 1 @aios/kernel + 1 @aios/agents + 1 @aios/llm + 3 @aios/api)
- [x] Architecture validation: All 6 principles preserved
- [x] Coding rules compliance: No TODO, no placeholder, no pseudo-code, all public interfaces documented, strict TypeScript
- [x] Readiness boundary aligned: Frontend uses `vaultReady` (not `kernelReady`) per Stage 8.2 contract

---

### Stage 8.4 — Kernel & Provider Vault Integration

**Objective:** Wire Kernel providers to use vault-scoped paths.

**Files:**
- **Modified:** `packages/kernel/src/core/Kernel.ts`, `packages/kernel/src/providers/ProviderManager.ts`, `packages/agents/src/agent/AgentBase.ts`, `packages/workflow/src/engine/WorkflowEngine.ts`, `packages/llm/src/gateway/LLMGateway.ts`

**Implementation Steps:**
1. `Kernel.ts`:
   ```typescript
   export class Kernel implements IKernel {
     constructor(private readonly vaultRoot?: string) { ... }
     
     async initializeProviders(): Promise<void> {
       for (const provider of this.providerManager.getAll()) {
         await provider.initialize({ vaultRoot: this.vaultRoot });
       }
     }
   }
   ```

2. `ProviderManager.ts`: Pass `vaultRoot` to each provider's `initialize(config)`

3. Each provider (`MemoryProvider`, `WorkflowProvider`, `AgentProvider`, `QVaultProvider`, `LLMProvider`):
   - Accept `vaultRoot` in `initialize(config)`
   - Read paths via `tbitRuntimePaths` (which now points to vault)

**Validation Gate 8.4:**
- [ ] `pnpm run build` passes
- [ ] Unit test: Kernel with `vaultRoot` → providers initialize with config
- [ ] Integration test: Memory operations persist to vault space
- [ ] Integration test: Workflow definitions stored in vault
- [ ] Integration test: Agent memories isolated per vault

---

### Stage 8.5 — Removed (Out of Scope)

Per approved Phase 8 scope, vault migration and repair endpoints are **explicitly excluded** and deferred to future phases.

**Stage 8.5 is intentionally omitted.** Implementation proceeds directly from Stage 8.4 to Stage 8.6.

---

### Stage 8.6 — Integration Testing & Build Validation

**Objective:** Full end-to-end verification.

**Commands:**
```bash
pnpm run build           # Must pass: 11/11 packages
pnpm run lint            # Must pass
pnpm run test            # Must pass
docker compose up --build # Must bring up healthy services
```

**Validation Gate 8.6:**
- [ ] All 11 packages compile (FULL TURBO)
- [ ] All unit tests pass
- [ ] Docker compose: both services healthy
- [ ] E2E flow: fresh install → onboard → reload → auto-load
- [ ] Chunk size check: Vite build < 500kB (or code-split implemented)

---

### Stage 8.7 — Documentation & AIOS_Book.md Update

**Objective:** Update all living documentation.

**Files:**
- `docs/AIOS_Book.md` — Phase 8 status, architecture, API routes, vault config
- `docs/AIOS_AppBible.md` — User flow for vault selection, onboarding
- `CHANGELOG.md` — Phase 8 completion entry
- `Framework/standards/` — Any new patterns

---

## 4. Technical Risks & Mitigations

| Risk | Stage | Mitigation |
|------|-------|------------|
| File System Access API unsupported in Firefox/Safari | 8.1 | Show unsupported-browser notification; recommend Chrome/Edge or Desktop app; **no simulated filesystem access** |
| Permission persistence across browser restarts | 8.1, 8.3 | Store `FileSystemDirectoryHandle` in IndexedDB via `idb`; re-request on startup failure |
| Vault path sync client↔server | 8.2 | Client sends `vaultRoot`; server normalizes via `normalizeTBitVaultRoot()` |
| Subsystem initialization order dependencies | 8.2 | Explicit linear sequence in `VaultBootstrapService.initialize()` |
| Kernel coupling to vault paths | 8.4 | Kernel receives `vaultRoot` via constructor; providers via `initialize()` |
| T-Bit core isolation violation | All | Only extend `tbitRuntimePaths.ts` exports; never import `@aios/*` into `tbit-core` |
| Bundle size >500kB (3D panels) | 8.6 | Implement `React.lazy` + `Suspense` for QuantumEngine, QVault panels if needed |
| `@aios/kernel` depends on `@aios/database` (doc vs code) | 8.4 | Update `PHASE8_ENGINEERING_ANALYSIS.md` §1.2 graph to reflect actual deps |

---

## 5. Remaining Prerequisites Before Coding

| Prerequisite | Status | Notes |
|--------------|--------|-------|
| Phase 7 Docker/Compose stable | ✅ Verified | All services build, health checks pass |
| `@muf/tbit-core` builds in isolation | ✅ Verified | Part of FULL TURBO |
| `idb` package available for web | ⚠️ Need to add | `apps/web/package.json` needs `idb@^8.0.2` |
| Architecture validation passed | ✅ This plan | All 10 frozen decisions compliant |
| Approval to implement | ⏳ Pending | User sign-off required |

---

## 6. Approval Gate

**Before implementation begins, confirm:**

- [ ] Architecture validation passed (Section 1)
- [ ] Phase 7 Docker/Compose infrastructure stable
- [ ] `@muf/tbit-core` build passes in isolation
- [ ] No blocking dependencies on Stage 8.1 start
- [ ] `idb` dependency added to `apps/web/package.json`

**Approval:** ________________ Date: ________________

---

## 7. Implementation Order Summary

```
Stage 8.1 → Stage 8.2 → Stage 8.3 → Stage 8.4 → Stage 8.5 → Stage 8.6
   │          │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼          ▼
Frontend   Backend    Frontend   Kernel/    (Removed)  Full       Docs
Only       Only       Loader     Providers  — Out of   Validation Update
                                           Scope
```

**Dependencies respected:** Each stage only depends on completed prior stages. No parallel implementation of unrelated subsystems. Stage 8.5 (API Extensions) intentionally omitted per approved scope.

---

*This plan reflects the approved architecture from `PHASE8_ENGINEERING_ANALYSIS.md` and frozen decisions from `AIOS_ENGINEERING_AUDIT_v2.md`. Implementation will proceed one stage at a time with validation gates.*