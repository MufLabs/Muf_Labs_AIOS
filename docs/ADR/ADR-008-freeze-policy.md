# ADR-008: Freeze Policy (LOCKED Artifacts, ECR-Gated Modification)

- **Status**: Approved & frozen (Phase 8 Engineering Closure)
- **Date**: 2026-08-06 (approved) — codified 2026-08-07
- **Related Freeze**: `docs/AIOS_ENGINEERING_AUDIT_v2.md` §15/§16 + Stage freeze notices

## Context

Once a stage is frozen, uncontrolled changes would erode the audited baseline and break traceability. The project needs a formal, enforceable change-control rule for completed work.

## Problem

Under what conditions may frozen artifacts be modified after acceptance?

## Decision

1. Frozen artifacts are **LOCKED**. From the freeze date onward they may **only** be modified when:
   - a **verified defect** is discovered; **or**
   - an approved **Engineering Change Request (ECR)** explicitly authorizes the modification.
2. Every freeze notice publishes its **LOCKED file list** (e.g., Stage 8.4 lists 18 files; Stage 8.6 lists 3 infrastructure files).
3. Stage 8.6 is infrastructure-only and adds no new architectural LOCKED files; the Stage 8.4 list remains authoritative and is verified unchanged at each subsequent freeze.
4. The Engineering Baseline document (`AIOS_ENGINEERING_AUDIT_v2.md`) is itself frozen as a governance artifact; changes require a versioned revision with a freeze notice.
5. The repository commit at freeze time is the **Baseline Commit** for that stage.

## Consequences

- ✅ Predictable, defensible change control.
- ✅ Reproducibility: each frozen stage maps to a known commit and test baseline.
- ⚠️ ECR overhead is a deliberate trade-off; emergency defect fixes still need an ECR for traceability.

## Alternatives Considered

- **Honor-system changes.** Rejected — no protection; baseline erodes.
- **Freeze everything forever.** Rejected — must allow verified-defect fixes.
- **Freeze code but not docs.** Rejected — docs and code must stay synchronized (ADR-009).
