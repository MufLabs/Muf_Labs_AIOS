# ADR-004: Runtime Path Resolution (tbitRuntimePaths canonical)

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-05 (approved) - codified 2026-08-07
- **Related Freeze**: AIOS_ENGINEERING_AUDIT_v2.md S16 T-Bit Ownership, Package Boundaries; legacy ADR-004 + ADR-005

## Context
Every persistent asset must live inside the user-selected Vault. Without a single path authority, packages would hardcode filesystem paths, breaking local-first ownership and cross-platform portability.

## Problem
Which package owns runtime path resolution? How to ensure no package hardcodes paths or duplicates path logic?

## Decision
1. @muf/tbit-core is the canonical source for T-Bit primitives, storage, encryption, manifests, runtime paths, sync. @aios/database provides persistence adapters only.
2. tbitRuntimePaths.ts (@muf/tbit-core) is the single authority (normalizeTBitVaultRoot, setActiveTBitSpacesRoot, createSpaceManifest, listSpaceManifests, TBitSpaceManifest, TBitSpacePaths).
3. VaultBootstrapService calls setActiveTBitSpacesRoot(vaultRoot + "/spaces"); providers resolve paths via tbitRuntimePaths.
4. @aios/shared only re-exports tbitRuntimePaths helpers - it does not own the logic.
5. @muf/tbit-core has zero dependencies on @aios/*; no circular imports.

## Consequences
- No hardcoded filesystem paths anywhere in providers; all paths via tbitRuntimePaths.
- Portable to macOS/Linux (paths use path.posix semantics: /spaces, /manifests).
- Moving T-Bit types, merging tbit-core into database, or adding @aios/* imports to tbit-core requires an ECR.

## Alternatives Considered
- Each provider resolves its own paths. Rejected - scattered logic; inconsistency risk.
- @aios/shared owns path logic. Rejected - violates T-Bit canonical ownership; shared is a re-export layer only.
- Merge tbit-core into database. Rejected - conflates T-Bit semantics with persistence plumbing.
