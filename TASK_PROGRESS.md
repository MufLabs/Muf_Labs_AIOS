# Phase 8: T-Bit Vault Setup — Implementation Progress

## Status: Stage 8.1 Complete — Stage 8.2 Approved to Begin

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
- [x] Apply architectural clarifications: Kernel unification, cross-platform Vault, no fake fallback

### Stage 8.1: Frontend - Client-Side Vault Selection UI ✅ **COMPLETED**
- [x] Create Vault selection step in OnboardingView (native folder picker via File System Access API)
- [x] Add Vault location persistence in IndexedDB (using `idb` package for FileSystemDirectoryHandle)
- [x] **Removed:** Fallback manual path input for unsupported browsers — replaced with clear notification
- [x] Handle error states (invalid folder, permissions, missing Vault)
- [x] Extend `tbitRegistrationClient.ts` with `bootstrapWithVault()` method
- [x] Update `useVaultPicker.ts` hook with IndexedDB + File System Access API
- [x] Update `OnboardingView.tsx` with vault step, folder picker, unsupported browser handling

### Stage 8.2: Backend - Vault Bootstrap Service 🔄 **NEXT**
- [ ] Create Vault Bootstrap Service in `apps/api/src/services/vaultBootstrapService.ts`
- [ ] Add new API routes: `POST /vault/init`, `GET /vault/status` (protected by `requireSymbolicApiKey`)
- [ ] Linear initialization sequence: T-Bit Paths → Encryption → Space Manifest → T-Bit Storage → Kernel → Verify
- [ ] Update `apps/api/src/routes/index.ts` to register vault routes

### Stage 8.3: Frontend - Application Startup & Vault Loader
- [ ] Create Vault loader in frontend (loads config on startup via `useVaultInit` hook)
- [ ] Create Vault verification API call on startup (`tbitVaultClient.ts`)
- [ ] Add Vault-aware initialization sequence in `main.tsx` (AppWrapper pattern)
- [ ] Handle missing Vault scenario (redirect to OnboardingView with folder picker)
- [ ] Update `App.tsx` to accept `vaultConfig` prop; remove `localStorage` check

### Stage 8.4: Subsystem Integration - Kernel & Providers
- [ ] Kernel: Accept `vaultRoot` in constructor, add `initializeProviders()`
- [ ] ProviderManager: Pass `vaultRoot` to provider `initialize({ vaultRoot })`
- [ ] Memory/Workflow/Agent/LLM Providers: Accept `vaultRoot` in `initialize()`, read paths via `tbitRuntimePaths`
- [ ] AgentBase: Accept `vaultRoot` for persistence
- [ ] WorkflowEngine: Accept `vaultRoot` for persistence
- [ ] LLMGateway: Accept `vaultRoot` for context/memory

### Stage 8.5: Removed (Out of Scope)
- [ ] Vault migration/repair endpoints — explicitly excluded per approved scope

### Stage 8.6: Testing & Validation
- [ ] Test first startup (no Vault configured)
- [ ] Test Vault creation with folder picker
- [ ] Test successful initialization of all subsystems
- [ ] Test startup with existing Vault
- [ ] Test invalid/missing folder handling
- [ ] Test permission errors
- [ ] Test bootstrap failure recovery
- [ ] Run full monorepo build (FULL TURBO)
- [ ] Docker compose: both services healthy
- [ ] E2E flow: fresh install → onboard → reload → auto-load

### Stage 8.7: Documentation
- [ ] Update AIOS_Book.md with Phase 8 completion
- [ ] Document Vault configuration schema
- [ ] Document Bootstrap Service API
- [ ] Document startup sequence
- [ ] Update AIOS_AppBible.md user flows
- [ ] Update CHANGELOG.md
- [ ] Update PHASE8_IMPLEMENTATION_PLAN.md with stage completions
