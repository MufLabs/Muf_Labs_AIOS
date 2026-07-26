# Appendix B — Normative References

## External documentation styles this specification follows

This specification's structure (one document per subsystem, each with its own scope statement, a shared glossary, a single index, and a stable cross-reference convention) follows the editorial conventions of:

- **POSIX / The Open Group Base Specifications** — chapter-per-subsystem structure with a shared rationale section pattern.
- **The Linux Kernel Documentation** — subsystem-owned documentation trees, each subsystem responsible for its own normative text.
- **Kubernetes SIG Architecture / KEPs** — proposal-style change documentation and single-responsibility design docs.
- **OpenAPI Specification** — formal, versioned interface definitions (mirrored here in `13_LanguageSpecifications.md` and `14_ObjectModels.md`).
- **LLVM Language Reference** — separation of language/grammar specification from the runtime behavior it describes (mirrored in the grammar-vs-behavior split between `13_LanguageSpecifications.md` and the subsystem documents that implement each grammar).

## Internal normative documents referenced throughout this specification

| Acronym | Full name | Defined in |
|---|---|---|
| WDL | Workflow Definition Language | `13_LanguageSpecifications.md` |
| ADL | Agent Definition Language | `13_LanguageSpecifications.md` |
| CDL | Capability Definition Language | `13_LanguageSpecifications.md` |
| PDL | Policy Definition Language | `16_GovernanceSecurity.md` |
| MOS | Memory Object Specification | `10_KnowledgeMemory.md` |
| KGS | Knowledge Graph Specification | `10_KnowledgeMemory.md` |
| KEP | Kernel Event Protocol | `11_Communication.md` |
| KCP | Kernel Communication Protocol | `11_Communication.md` |
| KSCS | Kernel System Call Specification | `03_KernelRuntime.md` |
| EOS | Engineering Object Specification | `14_ObjectModels.md` |
| AIP | AI Package Specification | `15_PackagesServices.md` |
| AISM | AI Service Manager | `05_ToolsAndServices.md` |
| AIR | AI Application Runtime | `06_ApplicationsSDK.md` |
| AI-HAL | AI Hardware Abstraction Layer | `12_HardwareVirtualization.md` |
| AIVL | Artificial Intelligence Virtualization Layer | `12_HardwareVirtualization.md` |
| CRE | Cognitive Reasoning Engine | `08_IntelligenceEngine.md` |
| APEE | Autonomous Planning & Execution Engine | `09_PlanningExecution.md` |
| AIOS-IDL | AI Operating System Interface Definition | `03_KernelRuntime.md` |
| AIFS | AI Filesystem | `03_KernelRuntime.md` |

## Note on scope

This specification does not itself claim conformance to POSIX, Kubernetes, OpenAPI, or LLVM — those are cited only as structural/editorial models, per the brief's instruction to produce documentation "comparable to" them.
