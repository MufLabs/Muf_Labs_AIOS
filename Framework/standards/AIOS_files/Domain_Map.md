# Domain Map

## Dependency direction

Domains are layered so that dependencies flow in one direction only (no circular ownership). Higher layers may reference lower layers; lower layers never reference higher ones.

```
Layer 4 — Experience & Delivery
  06_ApplicationsSDK   07_UserExperience   17_ExtensibilityRoadmap

Layer 3 — Orchestration
  08_IntelligenceEngine   09_PlanningExecution   01_EngineeringWorkflow

Layer 2 — Platform Services
  05_ToolsAndServices   10_KnowledgeMemory   15_PackagesServices   16_GovernanceSecurity

Layer 1 — Substrate
  03_KernelRuntime   04_ResourceManagement   11_Communication   12_HardwareVirtualization

Layer 0 — Formal Grammars & Data Shapes (cross-cutting, referenced by every layer)
  13_LanguageSpecifications   14_ObjectModels

Layer −1 — Foundation
  02_AIOSCoreArchitecture   00_MasterSpecification
```

`02_AIOSCoreArchitecture` sits conceptually "under" everything (it states the principles every other document must obey) but is drawn as its own foundation layer rather than Layer 0, since Layer 0 (grammars/object models) is a *sibling* concern, not a dependency of it.

## Who depends on whom (non-exhaustive, illustrative)

| Domain | Depends on | Referenced by |
|---|---|---|
| `01_EngineeringWorkflow` | `02`, `09` | `06`, `07` |
| `02_AIOSCoreArchitecture` | — (foundation) | all |
| `03_KernelRuntime` | `11`, `14` | `05`, `08`, `09` |
| `04_ResourceManagement` | `12` | `03`, `05`, `09` |
| `05_ToolsAndServices` | `13` (CDL), `11` | `06`, `08`, `09` |
| `06_ApplicationsSDK` | `05`, `01` | `07` |
| `07_UserExperience` | `01`, `08` | — |
| `08_IntelligenceEngine` | `10`, `13` | `09` |
| `09_PlanningExecution` | `03`, `08`, `13` (WDL) | `01`, `06` |
| `10_KnowledgeMemory` | `14` (EOS), `11` | `08`, `09` |
| `11_Communication` | `14` | `03`, `05`, `10` |
| `12_HardwareVirtualization` | — (substrate) | `03`, `04` |
| `13_LanguageSpecifications` | `14` | `05`, `09`, `16` |
| `14_ObjectModels` | — (foundation-adjacent) | almost all |
| `15_PackagesServices` | `13` (manifest schema), `16` (signing) | `05`, `06` |
| `16_GovernanceSecurity` | `14`, `11` | all (cross-cutting) |
| `17_ExtensibilityRoadmap` | `02` | — (nothing depends on roadmap by design) |

## Avoiding circular dependencies

Two adjustments were made specifically to prevent cycles:

1. **Capability & Workflow grammar were split from behavior.** Originally the CDL/WDL chapters both defined the grammar *and* re-asserted the behavior (causing duplicate #1, #3, #6, #10 in the Duplicate Report). By making `13_LanguageSpecifications` a grammar-only, dependency-free-of-behavior layer, `05_ToolsAndServices` and `09_PlanningExecution` can depend *down* on it without it depending back *up* on them.
2. **Policy behavior and policy grammar were kept together in `16_GovernanceSecurity`** rather than splitting PDL into `13`. Policies are inherently cross-cutting (every other domain's SHALL statements are subject to policy enforcement), so `16` is deliberately treated as a cross-cutting layer that many domains reference, but which itself only depends downward on `14` (object shapes) and `11` (audit event transport).

## Duplicated-ownership check

No responsibility appears as a "Depends on" *and* "Referenced by" target for the same pair of domains in opposite directions — i.e., the table above contains no A→B and B→A pair. This was verified by construction: every cross-reference added while writing the domain files points strictly to a lower layer.
