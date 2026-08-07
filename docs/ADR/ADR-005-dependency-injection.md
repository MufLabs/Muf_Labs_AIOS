# ADR-005: Dependency Injection (No Global State; Constructor / `setVaultContext()`)

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-05 (approved) — codified 2026-08-07
- **Related Freeze**: `docs/AIOS_ENGINEERING_AUDIT_v2.md` §20 Stage 8.4 Freeze Notice (DI); legacy ADR-002

## Context

Stage 8.4 made the Kernel and providers vault-aware. If vault configuration were stored in a global/singleton or read from `process.env`, subsystem initialization would become non-deterministic, hard to test, and unsafe to run multiple isolated sessions.

## Problem

How should vault configuration flow to the Kernel and providers without hidden coupling, environmental coupling, or global mutable state?

## Decision

1. **`VaultContext` is injected only** — via the `Kernel` optional constructor parameter and/or `setVaultContext()`.
2. **No global state mutation.** No module-level mutable vault singleton; providers receive `VaultProviderConfig` through the `initializeProvider(config)` hook.
3. **No `process.env` reads inside the Kernel** for vault configuration; environment stays at the application edge.
4. `Kernel.execute()` enriches request metadata with `vaultId`/`spaceId` from the active context — derived, not stored globally.
5. `disposeVault()` clears the active context and emits `vault.closed`.

## Consequences

- ✅ Deterministic, testable initialization; a Kernel instance can be constructed with or without a vault context.
- ✅ Multiple isolated Kernel instances are possible (testable in parallel).
- ⚠️ Adding a global vault singleton or `process.env` reads inside the Kernel requires an ECR.

## Alternatives Considered

- **Global vault singleton.** Rejected — non-deterministic; untestable; unsafe for multi-session.
- **Env-var-driven vault config.** Rejected — couples kernel to environment; not portable to browser runtime.
- **Provider-local vault lookup.** Rejected — hides dependency; breaks the single orchestration point.
