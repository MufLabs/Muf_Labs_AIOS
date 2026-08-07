# ADR-010: Specification Compliance Audit Process

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-07 (codified)
- **Related Freeze**: `docs/PHASE8_STAGE86_ENGINEERING_ANALYSIS.md` §10; `AIOS_ENGINEERING_AUDIT_v2.md` §21.3

## Context

Stages 8.3, 8.4, and 8.6 each concluded with a Specification Compliance Audit producing a traceability matrix and a verdict. The process proved effective and should be standardized.

## Problem

What is the repeatable process for auditing a stage against its specification with repository evidence?

## Decision

1. For each stage, produce a **traceability matrix**: one row per spec requirement, with columns `Requirement`, `Implemented In`, `Status`, `Evidence`.
2. Verdict per requirement: ✅ Implemented, ⚠️ Deferrable, ❌ Not Implemented.
3. Stage verdict = strict-pass count / total, with explicit deferrals and rationale. A deferral must be a non-blocking tooling/process gap, not an architectural defect.
4. Every conclusion must be **supported by repository evidence** (file path, test name, command output).
5. The audit is recorded in the stage analysis document and summarized in `AIOS_ENGINEERING_AUDIT_v2.md`.
6. Phase-level final audit (Stage 8.7) chains: Repository → Documentation → Architecture → Implementation → Testing → Build → TypeScript → Traceability → Acceptance.

## Consequences

- ✅ Reproducible, defensible acceptance decisions.
- ✅ Deferrals are explicit and tracked, not hidden.
- ⚠️ Audit effort scales with stage size; mitigated by reusing the matrix template.

## Alternatives Considered

- **Narrative-only review.** Rejected — not traceable; no verdict per requirement.
- **Pass/fail with no evidence.** Rejected — unverifiable.
- **Defer audits to phase end.** Rejected — discovers defects too late; Stage 8.6 found 6 findings (F-1..F-6) precisely because the audit ran in-stage.
