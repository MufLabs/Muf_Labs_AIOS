# ADR-009: Documentation Synchronization Policy

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-07 (codified)
- **Related Freeze**: All Phase 8 freeze notices; `AIOS_ENGINEERING_AUDIT_v2.md` §3 "Documentation Evolves with Code"

## Context

Phase 8 spans multiple authoritative documents (`AIOS_Book.md`, `PHASE8_IMPLEMENTATION_PLAN.md`, `PROJECT_STATE.md`, `AIOS_ENGINEERING_AUDIT_v2.md`, `CHANGELOG.md`, per-stage analyses). Inconsistencies between them create ambiguity about the true system state.

## Problem

How to keep all engineering documents describing exactly the same architecture and lifecycle, removing obsolete/duplicate/contradictory information?

## Decision

1. On every Formal Acceptance & Freeze event, **all** authoritative documents are updated in the same closure and a **Synchronization Table** is published showing the status of each doc.
2. Obsolete, duplicate, and contradictory information is removed at closure time.
3. Documents must agree on: current architecture, implemented stages, frozen stages, acceptance dates, validation results, engineering decisions, remaining roadmap, known limitations, open technical risks.
4. One inconsistency surfaced during Stage 8.6 closure (`AIOS_ENGINEERING_AUDIT_v2.md` §21.6 listed `CHANGELOG.md` as "Pending" when it had been updated) is corrected in this Stage 8.7 closure.
5. The `AIOS_MVP_ARCHITECTURE.md` is an **aspirational target** document, not the authority; where it conflicts with the implemented repository, the repository and `AIOS_Book.md` win.

## Consequences

- ✅ Single coherent engineering narrative across all docs.
- ✅ Future phases inherit an unambiguous baseline.
- ⚠️ Synchronization is a per-freeze obligation; deferring it re-introduces drift.

## Alternatives Considered

- **One giant document.** Rejected — unwieldy; loses per-purpose documents.
- **Docs updated ad hoc.** Rejected — proven to cause drift (Stage 8.6 audit caught one).
- **Auto-generate all docs from code.** Rejected — narrative/governance decisions cannot be inferred from code.
