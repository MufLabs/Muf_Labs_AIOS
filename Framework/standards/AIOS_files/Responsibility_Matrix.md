# Responsibility Matrix

Each document below owns exactly one responsibility. "Owns" means: this is the *only* place that responsibility's normative (SHALL/SHOULD/MAY) content lives; every other document may reference it but must not restate it.

| Document | Single Responsibility | Owns | Explicitly does NOT own |
|---|---|---|---|
| `00_MasterSpecification.md` | Navigation, scope, how-to-read | Index of the spec itself | Any normative content |
| `01_EngineeringWorkflow.md` | The workflow request/response contract | Participants, authority, ownership, lifecycle, inputs/outputs, prompting | AI Operating System architecture (→02), execution mechanics (→09) |
| `02_AIOSCoreArchitecture.md` | The single global architectural narrative | Vision & Philosophy (singular), layered architecture, cross-cutting principles | Any subsystem's implementation detail |
| `03_KernelRuntime.md` | Process/agent execution substrate | Kernel, scheduler, task manager, agent runtime/lifecycle, system calls (KSCS), AI Filesystem | Event/message transport (→11), resource *policy* (→04) |
| `04_ResourceManagement.md` | Resource allocation & operational health | Resource model, execution profiles, cost/latency optimization, resilience, telemetry/observability | Compute/hardware substrate (→12), scheduling mechanism (→03) |
| `05_ToolsAndServices.md` | Tool/capability/provider/service ecosystem | Capability & provider registries, plugins, MCP, connectors, AI Service Manager | Package distribution (→15), formal capability grammar (→13, cross-referenced) |
| `06_ApplicationsSDK.md` | Developer-facing application surface | AI-native applications, Application Runtime (AIR), AI SDK | Tool/service internals (→05) |
| `07_UserExperience.md` | Human-facing interaction & control | Configuration philosophy, interaction modes, explainability, accessibility, human-in-the-loop | Governance/security controls (→16) |
| `08_IntelligenceEngine.md` | Reasoning & cognition | Reasoning strategies, swarm/distributed/adaptive intelligence, confidence/uncertainty, discovery, decision-making | Planning/execution orchestration (→09) |
| `09_PlanningExecution.md` | Turning intent into an execution plan | Decomposition, planning, parallel/autonomous execution, workflow composition & templates, sessions/checkpoints | Reasoning mechanics (→08), agent runtime (→03) |
| `10_KnowledgeMemory.md` | Persistent knowledge & memory | Memory architecture, Digital Twin, Knowledge Graph, MOS, KGS, knowledge validation/governance | Event transport of memory updates (→11) |
| `11_Communication.md` | Inter-component transport | Event Bus, Message Bus, KEP, KCP, sessions/routing/delivery, endpoint discovery | Business meaning of the messages (owned by the sending subsystem) |
| `12_HardwareVirtualization.md` | Physical/virtual compute substrate | AI-HAL, compute virtualization, AIVL (logical intelligence instances) | Resource *policy* (→04), scheduling (→03) |
| `13_LanguageSpecifications.md` | Formal DSL grammars | WDL, ADL, CDL (grammar only) | The behavior those grammars describe (owned by the relevant subsystem; grammar chapters cross-reference it) |
| `14_ObjectModels.md` | Universal object model | EOS: identity, metadata, relationships, lifecycle, versioning, serialization | Domain-specific object semantics (e.g. Memory Objects → 10) |
| `15_PackagesServices.md` | Distribution & marketplace | AIP package format, registry/repository, signing, Marketplace | Runtime service execution (→05) |
| `16_GovernanceSecurity.md` | Security, compliance, policy | Zero-trust security architecture, identity/authN/authZ, audit, PDL (policy grammar + behavior) | Feature-level access control specifics (owned by the feature's subsystem) |
| `17_ExtensibilityRoadmap.md` | Forward-looking, non-normative | Extensibility interfaces, roadmap items | Present-tense normative architecture (kept in 02 and elsewhere), per the "Roadmap must not be mixed with Architecture" rule |

## Ownership rules applied (from the brief's "Special Rules")

| Rule | Applied as |
|---|---|
| Kernel belongs to Runtime | All Kernel/AI-Kernel content → `03` |
| Schedulers belong to Runtime | All Scheduler content → `03` |
| Task Manager belongs to Runtime | Both duplicate "Engineering Task Manager" sections merged into `03` |
| Memory belongs to Knowledge & Memory | All Memory content, including MOS → `10` |
| Digital Twin belongs to Knowledge & Memory | Both duplicate "Engineering Digital Twin" sections merged into `10` |
| Knowledge Graph belongs to Knowledge & Memory | KGS chapter → `10` |
| Swarm Intelligence belongs to Intelligence Engine | Swarm content → `08` |
| Reasoning belongs to Intelligence Engine | CRE chapter → `08` |
| Planning belongs to Planning & Execution | APEE chapter → `09` |
| Execution belongs to Planning & Execution | Execution content → `09` |
| Event Bus belongs to Communication | Event Bus + KEP → `11` |
| Message Bus belongs to Communication | Message Bus + KCP → `11` |
| SDK belongs to Applications | AI SDK chapter → `06` |
| Marketplace belongs to Packages | Marketplace content → `15` |
| Compliance belongs to Governance | Compliance/audit content → `16` |
| Roadmap must NOT be mixed with Architecture | Roadmap/future/extensibility content isolated in `17`, kept out of `02` |
| Vision statements shall exist only once | 4 global vision/philosophy sections merged into one in `02` |
| Architectural principles shall exist only once | Duplicate "AI Operating System Principles" merged into one in `02` |
| Every introduction shall exist only once | Same merge as above; chapter-local rationale sections (WDL/ADL/CDL/PDL/… Philosophy) left in place as they scope their own chapter, not the whole spec |
