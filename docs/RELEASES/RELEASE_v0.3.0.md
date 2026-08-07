# AIOS Release v0.3.0 - Phase 8 Engineering Baseline

- **Version:** v0.3.0
- **Release Name:** Phase 8 Engineering Baseline (T-Bit Vault Setup)
- **Release Date:** 2026-08-07
- **Baseline Commit:** b3cfbd7da58047dc8acddad7a7855a6a49383e60
- **Acceptance Date:** 2026-08-07
- **Freeze Date:** 2026-08-07

## Executive Summary
Release v0.3.0 is the formal Phase 8 Engineering Baseline of AIOS/MUF Labs. It delivers the client-first, single-vault, linear-bootstrap architecture: a user-selected local folder is the single source of truth for all T-Bit data; a single VaultBootstrapService orchestrates all subsystems deterministically; the Kernel and 5 vault-aware providers initialize against that vault; vault lifecycle events are emitted on the Kernel event bus. The monorepo builds (11/11), type-checks (10/10), and passes 220 tests + 8 integration tests. Phase 8 is complete, validated, audited, and frozen. This release establishes the official engineering baseline that all future development (Phase 9 Testing, Phase 10 Deployment) will build on.

## Architecture Summary
Local-first, modular pnpm + Turborepo monorepo (9 packages + 3 apps + standalone aios-mvp). @muf/tbit-core is the canonical T-Bit owner (storage, encryption, manifests, runtime paths). @aios/kernel is the single orchestration point (executes, manages providers, runs pipeline; owns no storage/paths/encryption). @aios/database provides persistence adapters. The Vault abstraction is the platform boundary; subsystems are vault-aware via an optional initializeProvider hook. Full detail: docs/PHASE8_ARCHITECTURE_BASELINE.md (13/13 sections).

## Major Features
- Client-side Vault selection UI (File System Access API + IndexedDB; no fake fallback)
- Backend Vault Bootstrap Service (single, linear, deterministic orchestrator)
- Application startup & vault loader (frontend state machine)
- Vault-aware Kernel + 5 vault providers (Memory, Workflow, Agent, QVault, LLM) + lifecycle events
- Integration testing & build validation
- Engineering closure: 10 ADRs, architecture baseline, metrics, audit, acceptance, freeze

## Completed Phases
- Phase 1: Foundation
- Phase 2: Architecture
- Phase 3: Kernel
- Phase 4: T-Bit Integration
- Phase 5: Production Infrastructure (Phase 7 scope)
- Phase 6: (pre-production hardening)
- Phase 7: Production Infrastructure
- Phase 8: T-Bit Vault Setup (this release)

## Completed Stages
- Stage 8.1 - Client-Side Vault Selection UI - Frozen
- Stage 8.2 - Vault Bootstrap Service (Backend) - Frozen
- Stage 8.3 - Application Startup & Vault Loader - Frozen
- Stage 8.4 - Kernel & Provider Vault Integration - Frozen
- Stage 8.6 - Integration Testing & Build Validation - Frozen
- Stage 8.7 - Engineering Closure - Frozen

## Removed Stages
- Stage 8.5 - Officially Removed (Out of Scope). No code shipped. Documented in PHASE8_IMPLEMENTATION_PLAN.md.

## Engineering Metrics
See docs/PHASE8_ENGINEERING_METRICS.md. Totals: 12 workspace packages + aios-mvp; 8 implemented packages; 3 apps; 5 vault-aware providers; 9 package barrels; 220 automated tests (18 files) + 8 integration tests; 10 ADRs.

## Build Status
PASS - 11/11 packages (pnpm -r build: Tasks 11 successful, 11 total).

## TypeScript Status
PASS - 10/10 packages (pnpm -r typecheck: Tasks 10 successful, 10 total).

## Testing Status
PASS - 220 tests across 18 test files (pnpm -r test: Tasks 18 successful, 18 total). Integration: 8/8. Zero regressions.

## Documentation Status
PASS - All authoritative documents synchronized. 17 closure artifacts created. No documentation conflicts, no obsolete/contradictory information.

## Breaking Changes
None. Phase 8 is backward-compatible with Phase 7: boot()/shutdown()/context/isRunning remain on core/Kernel.ts; the optional initializeProvider hook preserves Phase 7 providers.

## Known Limitations
- Single active vault per session (multi-vault is Phase 11+).
- No vault switching/import/export/migration/repair/key rotation (deferred per Phase 8 scope).
- Web runtime requires File System Access API (Chromium); unsupported browsers notify with no fake fallback.
- No repository-level lint pipeline (deferred - tooling, not architecture).
- Vite 3D-panel chunks > 500 kB (code-splitting deferred).
- Cross-platform CI matrix not yet established (Phase 9/10).
- Bundle-size budget policy not yet formalized (Phase 9/10).

## Remaining Risks
1. Firefox/Safari lack File System Access API (High UX) - Desktop guarantees FS access.
2. Permission persistence may be revoked across restarts (Medium) - IndexedDB handle + re-request flow.
3. No lint pipeline (Low) - Phase 9 ESLint.
4. Bundle size > 500 kB (Low) - Phase 9 code-splitting.
5. No CI cross-platform matrix (Low) - Phase 9/10.

## Next Approved Phase
**Phase 9 - Testing & Validation.** Recommendations: ESLint flat config, Vite code-splitting, coverage thresholds, Playwright E2E, cross-platform CI matrix, bundle-size budget, Phase 10 production hardening.

---

*End of AIOS Release v0.3.0.*
