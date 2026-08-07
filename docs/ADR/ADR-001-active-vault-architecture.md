# ADR-001: Active Vault Architecture (Client-First, Single Vault, Linear Bootstrap)

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-05 (approved) - codified 2026-08-07
- **Related Freeze**: AIOS_ENGINEERING_AUDIT_v2.md S16 Vault Lifecycle; legacy ADR-001 + ADR-008

## Context
AIOS is a local-first operating system for AI agents. All persistent T-Bit data must derive from a single user-owned root folder - the Vault. Phases 1-7 established T-Bit Core, Kernel, LLM, Workflow, Agents, and Docker infra, but did not define how a user selects the data root or how all subsystems initialize against that root.

Early design assumed a server-side bootstrap (POST /setup/bootstrap with userId + label) where the server assumed the storage path. This conflicted with local-first ownership and cross-platform portability (the server cannot pick the user folder).

## Problem
1. Who chooses the Vault location, and on which runtime?
2. How many vaults are active at once?
3. What is the single initialization entry point, and in what order do subsystems start?
4. How to support Web (File System Access API) and future Desktop (native FS) without duplicating bootstrap logic or coupling subsystems to a runtime?

## Decision
Client-first, single-vault, linear bootstrap.

1. Client chooses the Vault. On first run, the user selects a local folder via the native OS picker. On the Web this is the File System Access API (showDirectoryPicker()); on Desktop it will be native filesystem APIs. The selected folder becomes the Vault Root - the single source of truth for all T-Bit data.
2. Exactly one active vault per session. No multi-vault, no vault registry, no vault switching in the MVP scope.
3. Vault configuration (VaultContext: vaultId, vaultRoot, spacesRoot, spaceId, encryptionKeyId, userId, label, initializedAt) is persisted in IndexedDB (web) / local storage (desktop) and verified on every startup; on failure the app falls back to onboarding.
4. A single orchestrator - VaultBootstrapService - initializes ALL subsystems against the vault root in a fixed, linear, deterministic order: T-Bit paths -> Encryption -> Default Space Manifest -> Storage Recovery -> Kernel -> Memory -> Workflow -> Providers -> Agents -> Q-Vault -> Health Verification.
5. Q-Vault initializes last, after Kernel + Providers + Agents, because it depends on all other providers being ready.
6. The Vault abstraction is the platform boundary. Everything above it (Kernel, Workflow, Agents, Providers, Memory, T-Bit) is platform-agnostic and only ever receives the resolved vaultRoot + VaultContext.

Out of scope for Phase 8: multiple vaults, vault registry, import/export, migration, repair, vault switching, remote/network sync, encryption key rotation.

## Consequences
- Local-first ownership preserved; user controls data location.
- Deterministic startup; single orchestration point eliminates scattered init logic.
- Same architecture works on Windows, macOS, and Linux without redesign.
- Browser unsupported on Firefox/Safari (no File System Access API) - handled by a clear unsupported-browser notification, no fake fallback (per Phase 8 approved constraint). Desktop runtime guarantees full FS access.
- Single-vault limitation must be lifted (via ECR) when multi-vault is needed (Phase 11+).
- Bootstrap sequence is frozen; reordering requires an ECR.

## Alternatives Considered
- Server-side bootstrap (server picks path). Rejected - violates local-first; server cannot know the user folder; not portable.
- Multi-vault from day one. Rejected - adds registry, switching, teardown/reinit complexity not required for MVP.
- Per-subsystem self-initialization (no central orchestrator). Rejected - scattered logic, non-deterministic order, hard to test/verify readiness.
- Manual path text input as browser fallback. Rejected (explicitly) - a typed path cannot provide filesystem access; instead the app notifies the user to use a supported browser or the Desktop app.
