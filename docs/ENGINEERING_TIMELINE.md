# AIOS Engineering Timeline

> The complete engineering evolution of AIOS / MUF Labs, from Foundation to the current Engineering Baseline.

## Evolution Chain

Foundation -> Architecture -> Kernel -> T-Bit Integration -> Phase 7 -> Phase 8 -> Current Engineering Baseline

---

## Milestone 1 - Foundation
- **Date:** Phase 1
- **Objective:** Establish the monorepo scaffold, tooling, and base contracts.
- **Deliverables:** pnpm + Turborepo workspaces; tsconfig.base.json; Vitest configs; Docker Compose base.
- **Engineering Decisions:** Adopt pnpm workspaces + Turborepo for deterministic builds.
- **Baseline Commit:** established in repository history.

## Milestone 2 - Architecture
- **Date:** Phase 2
- **Objective:** Define modular package boundaries and the @muf/* vs @aios/* split.
- **Deliverables:** packages/kernel, tbit-core, agents, workflow, llm, database, shared, ui, sdk; apps/api, apps/web, apps/desktop.
- **Engineering Decisions:** @muf/tbit-core has zero @aios/* dependencies; @aios/shared is a re-export layer only (later codified as ADR-004).
- **Baseline Commit:** established in repository history.

## Milestone 3 - Kernel
- **Date:** Phase 3
- **Objective:** Build the central execution and orchestration component.
- **Deliverables:** IKernel, ProviderRegistry, ExecutionPipeline, context object, boot()/shutdown() lifecycle.
- **Engineering Decisions:** Kernel is the single orchestration point; lifecycle hooks on core/Kernel.ts (later codified as ADR-002).
- **Baseline Commit:** established in repository history.

## Milestone 4 - T-Bit Integration
- **Date:** Phase 4
- **Objective:** Integrate the T-Bit (Temporal Bit) primitive and provider abstraction.
- **Deliverables:** IProvider + ProviderRegistry; TBitStorageService; EncryptionKeyManager (AES-256-GCM); tbitRuntimePaths.
- **Engineering Decisions:** Provider abstraction with optional init hook; @muf/tbit-core canonical ownership (later codified as ADR-003, ADR-004).
- **Baseline Commit:** established in repository history.

## Milestone 5 - Phase 7 (Production Infrastructure)
- **Date:** Phase 7
- **Objective:** Complete production infrastructure: HTTP API, modular routes, Docker, persistence adapters, agent/workflow frameworks.
- **Deliverables:** @aios/api modular routes; @aios/database adapters/migrations/repositories; @aios/agents framework; @aios/workflow engine; Docker Compose validation.
- **Engineering Decisions:** ProviderRegistry + ProviderManager; repository pattern; symbolic API key guards.
- **Baseline Commit:** established in repository history.

## Milestone 6 - Phase 8 (T-Bit Vault Setup)
- **Date:** 2026-08-05 to 2026-08-07
- **Objective:** Client-first, single-vault, linear-bootstrap architecture tying all subsystems to a user-selected vault root.
- **Deliverables:**
  - Stage 8.1: Client-side Vault selection UI (File System Access API + IndexedDB)
  - Stage 8.2: VaultBootstrapService (single linear orchestrator)
  - Stage 8.3: Application startup & vault loader
  - Stage 8.4: Vault-aware Kernel + 5 vault providers + lifecycle events
  - Stage 8.6: Integration testing & build validation (220 tests + 8 integration)
  - Stage 8.7: Engineering closure (ADR-001..010, architecture baseline, metrics, audit, acceptance, freeze)
- **Removed Stages:** Stage 8.5 (Out of Scope)
- **Engineering Decisions (codified as ADRs):** ADR-001 Active Vault Architecture; ADR-002 Kernel Lifecycle Ownership; ADR-003 Provider Abstraction; ADR-004 Runtime Path Resolution; ADR-005 Dependency Injection; ADR-006 Event Architecture; ADR-007 Stage Lifecycle; ADR-008 Freeze Policy; ADR-009 Documentation Synchronization Policy; ADR-010 Specification Compliance Audit Process.
- **Acceptance Date:** 2026-08-07
- **Freeze Date:** 2026-08-07
- **Baseline Commit:** b3cfbd7da58047dc8acddad7a7855a6a49383e60

## Milestone 7 - Current Engineering Baseline
- **Date:** 2026-08-07
- **Objective:** Establish the definitive reference baseline for all future development.
- **Deliverables:**
  - docs/PHASE8_FINAL_ACCEPTANCE.md (permanent baseline)
  - docs/PHASE8_ARCHITECTURE_BASELINE.md (13/13 sections)
  - docs/PHASE8_ENGINEERING_METRICS.md (final metrics)
  - docs/PHASE8_FINAL_AUDIT.md (9-step audit)
  - docs/PHASE8_ENGINEERING_CLOSURE_REPORT.md (11-section closure)
  - docs/ADR/ADR-001..010 (+ README) and docs/ENGINEERING_DECISIONS.md
  - docs/RELEASES/RELEASE_v0.3.0.md (official release record)
  - docs/VERSION.md and VERSION (version governance)
  - docs/ENGINEERING_TIMELINE.md (this document)
- **Engineering Decisions:** Engineering governance policy (ADR-009): documentation is a mandatory deliverable; every modification updates every affected document immediately; AIOS_Book.md must never lag behind the repository.
- **Status:** Phase 8 Frozen; Repository Baseline Complete.
- **Next Approved Phase:** Phase 9 - Testing & Validation.
- **Baseline Commit:** b3cfbd7da58047dc8acddad7a7855a6a49383e60

---

*End of Engineering Timeline.*
