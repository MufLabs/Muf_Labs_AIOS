# AIOS — Architecture Decision Records (ADR)

> **Permanent engineering decisions registry for AIOS / MUF Labs.**
> Established during **Phase 8 Engineering Closure (Stage 8.7)** — 2026-08-07.

This directory is the canonical home for all Architecture Decision Records. Each ADR is an immutable record of a major architectural decision: its context, problem, decision, consequences, and alternatives considered.

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./ADR-001-active-vault-architecture.md) | Active Vault Architecture (Client-First, Single Vault, Linear Bootstrap) | Approved & frozen | 2026-08-05 |
| [ADR-002](./ADR-002-kernel-lifecycle-ownership.md) | Kernel Lifecycle Ownership (Single Orchestration Point) | Approved & frozen | 2026-08-05 |
| [ADR-003](./ADR-003-provider-abstraction.md) | Provider Abstraction (Registry, Initialization, Vault-Aware Config) | Approved & frozen | 2026-08-05 |
| [ADR-004](./ADR-004-runtime-path-resolution.md) | Runtime Path Resolution (`tbitRuntimePaths` canonical) | Approved & frozen | 2026-08-05 |
| [ADR-005](./ADR-005-dependency-injection.md) | Dependency Injection (No Global State; Constructor / `setVaultContext()`) | Approved & frozen | 2026-08-05 |
| [ADR-006](./ADR-006-event-architecture.md) | Event Architecture (Kernel-Level Event Bus + Vault Events) | Approved & frozen | 2026-08-05 |
| [ADR-007](./ADR-007-stage-lifecycle.md) | Stage Lifecycle (Specification Compliance Audit + Freeze Gates) | Approved & frozen | 2026-08-06 |
| [ADR-008](./ADR-008-freeze-policy.md) | Freeze Policy (LOCKED artifacts, ECR-gated modification) | Approved & frozen | 2026-08-06 |
| [ADR-009](./ADR-009-documentation-synchronization-policy.md) | Documentation Synchronization Policy | Approved & frozen | 2026-08-07 |
| [ADR-010](./ADR-010-specification-compliance-audit-process.md) | Specification Compliance Audit Process | Approved & frozen | 2026-08-07 |

## Cross-Reference

The legacy ADR numbering in `docs/AIOS_ENGINEERING_AUDIT_v2.md` §15 (ADR-001 Vault Architecture, ADR-002 Provider Architecture, ADR-003 Kernel Responsibilities, ADR-004 T-Bit Ownership, ADR-005 Package Boundaries, ADR-006 Event Bus, ADR-007 Memory Architecture, ADR-008 Q-Vault Integration, ADR-009 Workflow Architecture, ADR-010 Agent Architecture) is superseded in naming by this registry. The decisions are preserved and reconciled hereunder:

| Phase 8 Closure ADR | Reconciles legacy audit §15 ADR(s) |
|---------------------|------------------------------------|
| ADR-001 Active Vault Architecture | legacy ADR-001 (Vault Architecture) + ADR-008 (Q-Vault initializes last) |
| ADR-002 Kernel Lifecycle Ownership | legacy ADR-003 (Kernel Responsibilities) + ADR-007 (Memory Architecture) |
| ADR-003 Provider Abstraction | legacy ADR-002 (Provider Architecture) + ADR-009 (Workflow) + ADR-010 (Agent) |
| ADR-004 Runtime Path Resolution | legacy ADR-004 (T-Bit Ownership) + ADR-005 (Package Boundaries) |
| ADR-005 Dependency Injection | (new — explicitly codified Stage 8.4) |
| ADR-006 Event Architecture | legacy ADR-006 (Event Bus) |
| ADR-007 Stage Lifecycle | (new — Phase 8 process decision) |
| ADR-008 Freeze Policy | (new — Phase 8 process decision) |
| ADR-009 Documentation Synchronization Policy | (new — Stage 8.7 process decision) |
| ADR-010 Specification Compliance Audit Process | (new — Stage 8.6/8.7 process decision) |

No engineering decision was lost in this reconciliation. Every frozen decision in audit §16 Architecture Freeze maps to one or more ADRs above.

## Template

```
# ADR-XXX: <Title>
- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: YYYY-MM-DD
- **Related Freeze**: docs/AIOS_ENGINEERING_AUDIT_v2.md §16 <Decision Name>

## Context
## Problem
## Decision
## Consequences
## Alternatives Considered