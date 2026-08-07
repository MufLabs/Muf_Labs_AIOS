# ADR-002: Kernel Lifecycle Ownership (Single Orchestration Point)

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-05 (approved) - codified 2026-08-07
- **Related Freeze**: AIOS_ENGINEERING_AUDIT_v2.md S16 Kernel Responsibilities, Memory Architecture; legacy ADR-003 + ADR-007

## Context
The Kernel (@aios/kernel) is the central execution and orchestration component of AIOS. It owns a ProviderRegistry, an ExecutionPipeline, a context object, and the lifecycle hooks boot()/shutdown() (Phase 7). Phase 8 introduced vault-aware initialization: the Kernel must receive a VaultContext and propagate it to providers without becoming a storage owner or a vault-path manager.

## Problem
1. Who owns subsystem initialization ordering?
2. Should the Kernel manage vault paths, storage, or encryption directly?
3. How to extend Phase 7 lifecycle (boot/shutdown/context/isRunning) with vault awareness without introducing a second initialization flow or breaking backward compatibility?

## Decision
The Kernel is the single orchestration point for subsystem initialization. It does not own storage, vault paths, or encryption.

1. IKernel executes; ProviderRegistry manages providers; ExecutionPipeline runs requests. The Kernel does NOT manage vault paths, storage, or encryption.
2. The Kernel receives VaultContext via an optional constructor parameter and/or setVaultContext(). It exposes initializeProviders(config: VaultProviderConfig) which fans out to each provider optional initializeProvider(config) hook via the ProviderManager.initializeAll(config) method.
3. Stage 8.4 extends the existing initializeProviders() mechanism - it does not introduce a second initialization flow.
4. Phase 7 backward compatibility is preserved: boot(), shutdown(), the context getter, and isRunning remain on core/Kernel.ts.
5. The Kernel emits vault events on its event bus (see ADR-006).
6. Memory architecture: all memory operations resolve paths via tbitRuntimePaths -> vault spaces/. The Kernel never hardcodes paths.

## Consequences
- Clear single ownership of initialization ordering; deterministic.
- Phase 7 consumers continue to work unchanged.
- Testable: getProviderReadiness() returns a Record<providerId, boolean> for health verification.
- Any change to IKernel interface, provider registration, or execution flow requires an ECR.
- Adding a second initialization path is explicitly forbidden; future init work must extend initializeProviders().

## Alternatives Considered
- Kernel owns storage/encryption. Rejected - violates Single Source of Truth; Kernel becomes a god object; conflicts with @muf/tbit-core ownership.
- Separate vault initialization coordinator outside Kernel. Rejected - splits orchestration; non-deterministic order; harder to reason about readiness.
- Break Phase 7 lifecycle to add vault hooks. Rejected - would force all consumers to migrate; no backward compatibility.
