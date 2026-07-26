# Cross-Reference Report

## Purpose

This report lists every place where one document intentionally points to another, so the specification's inter-document links can be spot-checked and kept stable as the documents evolve independently.

## Stable cross-reference conventions used

- References are made **by document + section title** (e.g. `05_ToolsAndServices.md § "Capability Registry"`), not by line number, so they survive future edits to either file.
- The 4 cross-reference stubs created during deduplication (see Duplicate Report) each contain an explicit sentence naming the canonical document and section title.
- Every "Special Rules" ownership decision documented in the Responsibility Matrix is treated as an implicit cross-reference contract: any document mentioning a concept it does not own (e.g. `09_PlanningExecution.md` mentioning "Kernel scheduling") should treat that mention as a pointer to the owning document, not a redefinition.

## Explicit stub cross-references created during this refactor

| From | Section | Points to |
|---|---|---|
| `13_LanguageSpecifications.md` | "Output Declaration (WDL Reference)" | `01_EngineeringWorkflow.md` § "Workflow Outputs" |
| `13_LanguageSpecifications.md` | "Capability Registry (CDL Reference)" | `05_ToolsAndServices.md` § "Capability Registry" |
| `13_LanguageSpecifications.md` | "Workflow Composition (WDL Reference)" | `09_PlanningExecution.md` § "Workflow Composition" |
| `13_LanguageSpecifications.md` | "Capability Composition (CDL Reference)" | `05_ToolsAndServices.md` § "Capability Composition" |

## Disambiguated pairs (no longer cross-referenced — deliberately independent)

| Title collision | Kept independently as |
|---|---|
| "Service Discovery" | `05_ToolsAndServices.md` § "Service Discovery" (subsystem/plugin/provider self-registration) vs. `11_Communication.md` § "Communication Endpoint Discovery" (protocol-level endpoint discovery) |
| "Error Handling" | `13_LanguageSpecifications.md` § "Workflow Error Handling" (WDL failure policy) vs. `11_Communication.md` § "Communication Error Handling" (KCP failure recovery) |

## Domain-level cross-reference expectations (per Domain Map)

Each domain document should, where it mentions a concept it doesn't own, reference the owning document rather than silently duplicating behavior. The Domain Map's dependency table is the authoritative list of which direction each cross-reference should flow. A future automated check could grep each generated file for concept nouns owned elsewhere (using the Responsibility Matrix as the ground truth) and flag any prose that looks like a full restatement rather than a reference — this is a natural next automation step but was not run here since it is a linting task, not a one-time reorganization task.

## Known limitation

Because this refactor operates at section granularity, it has verified that no *entire section* duplicates another. It has not exhaustively verified that no individual *sentence* inside a large, uniquely-titled section (e.g. a 40-line "Native AIOS Features" section) restates a sentence from another uniquely-titled section elsewhere. This is the sentence-level counterpart to the "Remaining work" item flagged in the Migration Report, and is recommended as the scope of a Phase 5 pass.
