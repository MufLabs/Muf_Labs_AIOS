# Duplicate Report — Phase 2

For each of the 17 exactly-duplicated section titles found in `EngineeringWorkflow.md`, this report states the decision (KEEP / MERGE / REMOVE / MOVE) and the justification. Original line numbers are 1-indexed.

---

### 1. Workflow Outputs — lines 1399 & 13360
**Decision:** KEEP canonical in `01_EngineeringWorkflow.md`; MOVE+REDUCE duplicate in `13_LanguageSpecifications.md` (WDL chapter) to a cross-reference stub titled *"Output Declaration (WDL Reference)"*.
**Why:** Both sections say "a workflow SHALL declare its outputs," with near-identical bullet lists (Reports, Packages, documentation, etc.). The WDL occurrence adds no grammar-specific information beyond restating the concept, so it is replaced with a pointer to the canonical definition plus any bullets not already present.

### 2. Autonomous Engineering Planning — lines 1592 & 2455
**Decision:** MERGE into one section in `09_PlanningExecution.md`.
**Why:** Both describe the Workflow Engine generating a multi-stage execution/planning strategy before execution; one is triggered "before execution begins," the other "whenever complexity exceeds a threshold" — these are the same mechanism described from two angles. Merged into a single section retaining both trigger conditions and the union of planning outputs.

### 3. Capability Registry — lines 1889 & 14190
**Decision:** KEEP canonical in `05_ToolsAndServices.md`; MOVE+REDUCE duplicate in `13_LanguageSpecifications.md` (CDL chapter) to a cross-reference stub.
**Why:** Same registry concept (unique capability identification, metadata, discovery) restated inside the Capability Definition Language chapter. CDL-specific additions (registration/indexing/dependency-analysis support) were preserved as bullets under the stub.

### 4. Execution Profiles — lines 1956 & 9091
**Decision:** MERGE into one section in `04_ResourceManagement.md`.
**Why:** One version is workflow-engine-scoped ("reusable Execution Profiles" optimizing for quality/speed/cost/privacy), the other is OS-scoped (named presets: Maximum Quality, Balanced, Fast Response, Local Only, Enterprise…). These are the same feature at two levels of detail — merged so the named presets and the optimization-axis language live together.

### 5. Engineering Intelligence Layer — lines 2167 & 9898
**Decision:** MERGE into one section in `08_IntelligenceEngine.md`.
**Why:** Both introduce the EIL as the cognitive subsystem responsible for turning raw resources into structured understanding; the second adds a concrete responsibility list. Merged, second version's bullets appended.

### 6. Workflow Composition — lines 2495 & 13252
**Decision:** KEEP canonical in `09_PlanningExecution.md`; MOVE+REDUCE duplicate in `13_LanguageSpecifications.md` (WDL chapter) to a cross-reference stub.
**Why:** General composition concept vs. WDL's grammar-level "a Workflow MAY invoke sub-workflows/agents/skills…" — the WDL-specific invocation targets were preserved as bullets under the stub.

### 7. Memory Synchronization — lines 2936 & 15142
**Decision:** MERGE into one section in `10_KnowledgeMemory.md`.
**Why:** Same requirement (automatic, policy-driven synchronization preserving consistency/traceability/version history) stated once generally and once specifically for the Memory Object Specification. Merged.

### 8. Engineering Task Manager — lines 3241 & 6998
**Decision:** MERGE into one section in `03_KernelRuntime.md` (per the explicit rule "Task Manager belongs to Runtime").
**Why:** Both describe task decomposition and the same task-record fields (objective, dependencies, assigned agent, capabilities, status, evidence/artifacts). Merged, union of fields kept.

### 9. AI Operating System Principles — lines 3510 & 6224
**Decision:** MERGE into one section in `02_AIOSCoreArchitecture.md`, using the longer, subsection-structured version (line 6224) as the base.
**Why:** This is the clearest case of the "architectural principles shall exist only once" rule being violated — a 20-line list and a 100-line elaborated version of the *same* principle set (provider independence, governance, memory, traceability, explainability, auditability…). The elaborated version is kept as the base; any principle named only in the short version was folded in as its own subsection.

### 10. Capability Composition — lines 3628 & 14164
**Decision:** KEEP canonical in `05_ToolsAndServices.md`; MOVE+REDUCE duplicate in `13_LanguageSpecifications.md` (CDL chapter) to a cross-reference stub.
**Why:** The general version gives worked examples (Architecture Analysis Profile, Implementation Profile); the CDL version states the formal composition rule ("complex capabilities SHALL be composed from simpler capabilities… composition SHALL remain transparent"). The formal rule is preserved as a bullet under the stub rather than restated as prose.

### 11. Distributed Intelligence — lines 4641 & 10790
**Decision:** MERGE into one section in `08_IntelligenceEngine.md`.
**Why:** Same concept ("reasoning/logical intelligence MAY execute across multiple computational environments") with slightly different environment lists. Merged, union of environments kept.

### 12. Package Registry — lines 7817 & 12527
**Decision:** MERGE into one section in `15_PackagesServices.md`.
**Why:** Both describe the same Package Registry with overlapping but non-identical supported operations (installation/updates/dependency-resolution/versioning/signing vs. discovery/installation/upgrades/removal/search). Merged into the union.

### 13. Engineering Digital Twin — lines 8513 & 15488
**Decision:** MERGE into one section in `10_KnowledgeMemory.md` (per the explicit rule "Digital Twin belongs to Knowledge & Memory").
**Why:** The second occurrence adds the important detail that the Twin is "constructed directly from the Knowledge Graph" — this detail was folded into the merged canonical section rather than lost.

### 14. Adaptive Intelligence — lines 8660 & 10806
**Decision:** MERGE into one section in `08_IntelligenceEngine.md`.
**Why:** Same adaptation mechanism (provider/capability/workflow/memory/prompt optimization) stated twice with minor wording differences. Merged.

### 15. Knowledge Validation — lines 8694 & 15509
**Decision:** MERGE into one section in `10_KnowledgeMemory.md`.
**Why:** Same validation gate (Consensus/Review/Human approval before knowledge becomes persistent/organizational) stated twice. Merged; the "validated knowledge SHALL receive increased confidence" clause from the second occurrence was preserved.

### 16. Service Discovery — lines 10077 & 16306
**Decision:** KEEP BOTH, renamed for disambiguation. Line 10077 stays **"Service Discovery"** in `05_ToolsAndServices.md`; line 16306 renamed **"Communication Endpoint Discovery"** in `11_Communication.md`.
**Why:** These are genuinely different concepts sharing a title by coincidence — one is subsystem/plugin/provider self-registration, the other is communication-endpoint discovery within the Kernel Communication Protocol. Merging them would conflate two distinct mechanisms, so both are kept with disambiguating titles instead (this is itself a "zero duplicated concepts" fix, just achieved by renaming rather than merging).

### 17. Error Handling — lines 13413 & 16436
**Decision:** KEEP BOTH, renamed for disambiguation. Line 13413 renamed **"Workflow Error Handling"** in `13_LanguageSpecifications.md`; line 16436 renamed **"Communication Error Handling"** in `11_Communication.md`.
**Why:** Same reasoning as #16 — workflow failure policy (retry/rollback/replanning/human escalation) and communication failure recovery (retry/alternate route/provider replacement) are different mechanisms that happened to share a generic heading.

---

## Summary table

| # | Title | Decision | Sections after |
|---|---|---|---|
| 1 | Workflow Outputs | MOVE + reduce to stub | 1 canonical + 1 stub |
| 2 | Autonomous Engineering Planning | MERGE | 1 |
| 3 | Capability Registry | MOVE + reduce to stub | 1 canonical + 1 stub |
| 4 | Execution Profiles | MERGE | 1 |
| 5 | Engineering Intelligence Layer | MERGE | 1 |
| 6 | Workflow Composition | MOVE + reduce to stub | 1 canonical + 1 stub |
| 7 | Memory Synchronization | MERGE | 1 |
| 8 | Engineering Task Manager | MERGE | 1 |
| 9 | AI Operating System Principles | MERGE | 1 |
| 10 | Capability Composition | MOVE + reduce to stub | 1 canonical + 1 stub |
| 11 | Distributed Intelligence | MERGE | 1 |
| 12 | Package Registry | MERGE | 1 |
| 13 | Engineering Digital Twin | MERGE | 1 |
| 14 | Adaptive Intelligence | MERGE | 1 |
| 15 | Knowledge Validation | MERGE | 1 |
| 16 | Service Discovery | RENAME (disambiguate) | 2 (both kept) |
| 17 | Error Handling | RENAME (disambiguate) | 2 (both kept) |

Plus the 4 global vision/philosophy statements (§3 of the Structural Audit) merged into one Vision & Philosophy section — no exact title collision there (titles differ), but they are the clearest instance of the "vision statements shall exist only once" rule and are called out here for completeness.
