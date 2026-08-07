# ADR-006: Event Architecture (Kernel-Level Event Bus + Vault Events)

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-05 (approved) — codified 2026-08-07
- **Related Freeze**: `docs/AIOS_ENGINEERING_AUDIT_v2.md` §16 Event Bus; legacy ADR-006

## Context

Subsystems need to react to vault lifecycle transitions (opened/closed/switched) and to kernel execution events. Without a single event authority, events would be scattered or duplicated across packages.

## Problem

Where do domain and lifecycle events live, and how are vault lifecycle events surfaced without introducing a second global event bus?

## Decision

1. **Kernel-level event sourcing** via `@muf/tbit-core/events.ts`. There is no global event bus outside the Kernel.
2. The Kernel exposes an `events` getter so consumers can subscribe to and emit events.
3. Vault lifecycle events are constant strings in `VAULT_EVENTS` (`packages/shared/src/vaultContext.ts`): `vault.opened`, `vault.closed`, `vault.switched`.
4. The Kernel emits `vault.opened` after successful `initializeProviders()`, and `vault.closed` on `disposeVault()`.
5. `VaultContext` payload types (`VaultOpenedPayload`, `VaultClosedPayload`, `VaultSwitchedPayload`) live in `@aios/shared` as the single source of truth, re-exported through `@aios/kernel`.

## Consequences

- ✅ One event model; consumers subscribe through the Kernel.
- ✅ Testable: `vaultBootstrapService.e2e.test.ts` captures the `vault.opened` event.
- ⚠️ Adding a global event bus outside the Kernel, or changing the event sourcing model, requires an ECR.

## Alternatives Considered

- **Per-package event emitters.** Rejected — no central ordering; hard to reason about lifecycle.
- **Global singleton bus.** Rejected — hidden coupling; untestable for isolated sessions.
- **Polling readiness flags instead of events.** Rejected — latency and complexity; no clean close/switch signaling.
