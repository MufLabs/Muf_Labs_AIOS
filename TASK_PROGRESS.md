# Phase 8: T-Bit Vault Setup — Implementation Progress

## Status: Engineering Analysis Complete → Awaiting Approval to Implement

### Overview
Extend existing Phase 3 server-side bootstrap infrastructure with:
1. Client-side first-run Vault setup UI with native folder picker
2. Vault Bootstrap Service orchestrating Kernel, Memory, Workflow, Provider, Agent, Q-Vault
3. Application startup logic loading/verifying configured Vault

---

## Task Checklist

### Stage 1: Engineering Analysis & Architecture Validation
- [x] Analyze existing Phase 3 infrastructure (tbitRuntimePaths, setup routes, registration client)
- [x] Identify integration points for Kernel, Memory, Workflow, Provider, Agent, Q-Vault
- [x] Design Vault Bootstrap Service architecture (coordinator pattern, not replacement)
- [x] Design Vault configuration schema (UUID, creation date, schema version, root path)
- [x] Validate architecture preserves: modularity, package isolation, dependency inversion, provider abstraction, kernel responsibilities, T-Bit independence
- [x] Document architecture decisions in PHASE8_ENGINEERING_ANALYSIS.md

### Stage 2: Backend - Vault Configuration & Bootstrap API
- [ ] Add Vault configuration types to `@muf/tbit-core` (VaultConfig, VaultManifest) — *Note: will use @aios/shared for shared types*
- [ ] Extend `tbitRuntimePaths.ts` with Vault-level path management (already has `normalizeTBitVaultRoot`)
- [ ] Add Vault persistence (save/load Vault config to disk)
- [ ] Create Vault Bootstrap Service in `apps/api/src/services/vaultBootstrapService.ts`
- [ ] Add new API routes: `POST /vault/init`, `GET /vault/status`, `POST /vault/verify`, `GET /vault/config`
- [ ] Update existing `/setup/bootstrap` to use Vault config (or deprecate in favor of `/vault/init`)

### Stage 3: Frontend - Vault Selection UI
- [ ] Create Vault selection step in OnboardingView (native folder picker via File System Access API)
- [ ] Add Vault location persistence in IndexedDB (using `idb` package for FileSystemDirectoryHandle)
- [ ] Add fallback manual path input for unsupported browsers
- [ ] Add progress display for multi-subsystem initialization
- [ ] Handle error states (invalid folder, permissions, missing Vault)

### Stage 4: Application Startup Logic
- [ ] Create Vault loader in frontend (loads config on startup via `useVaultInit` hook)
- [ ] Create Vault verification API call on startup
- [ ] Add Vault-aware initialization sequence in `main.tsx`
- [ ] Handle missing Vault scenario (redirect to OnboardingView with folder picker)

### Stage 5: Subsystem Integration
- [ ] Kernel: Accept `vaultRoot` in constructor, pass to providers via `initialize()`
- [ ] Memory: Initialize using active Vault paths (via `tbitRuntimePaths`)
- [ ] Workflow: Persistence using active Vault
- [ ] Provider: Initialize after Vault ready
- [ ] Agent: Use active Vault as storage root
- [ ] Q-Vault/Map: Initialize after Vault ready

### Stage 6: Testing & Validation
- [ ] Test first startup (no Vault configured)
- [ ] Test Vault creation with folder picker
- [ ] Test successful initialization of all subsystems
- [ ] Test startup with existing Vault
- [ ] Test invalid/missing folder handling
- [ ] Test permission errors
- [ ] Test bootstrap failure recovery
- [ ] Run full monorepo build (FULL TURBO)

### Stage 7: Documentation
- [ ] Update AIOS_Book.md with Phase 8 completion
- [ ] Document Vault configuration schema
- [ ] Document Bootstrap Service API
- [ ] Document startup sequence
- [ ] Update AIOS_AppBible.md user flows
- [ ] Update CHANGELOG.md