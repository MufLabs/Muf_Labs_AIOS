# ADR-003: Provider Abstraction (Registry, Initialization, Vault-Aware Config)

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-05 (approved) - codified 2026-08-07
- **Related Freeze**: AIOS_ENGINEERING_AUDIT_v2.md S16 Provider Architecture, Workflow Architecture, Agent Architecture; legacy ADR-002 + ADR-009 + ADR-010

## Context
AIOS subsystems (Memory, Workflow, Agent, Q-Vault, LLM) must be pluggable, individually testable, and able to read/write vault-scoped data. Phase 4 introduced IProvider + ProviderRegistry; Phase 8 made providers vault-aware.

## Problem
How to register, initialize, and describe providers uniformly while keeping them decoupled from the Kernel and from each other, and while making them vault-aware without hardcoding paths?

## Decision
1. Providers are registered via ProviderRegistry and managed by ProviderManager.
2. Each provider implements IProvider; an optional initializeProvider?(config: VaultProviderConfig) hook is invoked by ProviderManager.initializeAll(config) when a vault is active.
3. Providers receive dependencies and VaultContext via constructor/initialize() injection - providers do NOT import @aios/kernel.
4. Provider identity is described by ProviderInfo (id, name, kind?, tags?, description?) and capabilities by ProviderCapabilities (incl. vaultRead?, vaultWrite? flags - an object, not a string array).
5. Five concrete vault-aware providers ship in @aios/kernel under providers/vault/: MemoryVaultProvider, WorkflowVaultProvider, AgentVaultProvider, QVaultVaultProvider, LlmVaultProvider (VAULT_PROVIDER_IDS).
6. Workflow definitions and agent state persist via @aios/database repository pattern; providers never own storage.

## Consequences
- Uniform provider lifecycle; isolated failures (initializeAll continues on per-provider error and reports Record<id, boolean>).
- Vault awareness is opt-in via the optional hook; non-vault providers keep working.
- Changing provider registration, the init contract, or coupling to Kernel requires an ECR.

## Alternatives Considered
- Providers import Kernel for context. Rejected - creates cycles; couples layers.
- Mandatory initializeProvider on every provider. Rejected - breaks Phase 7 providers.
- capabilities as string array. Rejected - Stage 8.6 finding F-6 corrected this.
