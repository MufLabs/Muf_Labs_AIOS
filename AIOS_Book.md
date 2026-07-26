# AIOS BOOK

## Documento Maestro de Integración: T-BIT → AIOS v2.0

**Fecha de inicio:** 23 de Julio 2026
**Última actualización:** 25 de Julio 2026
**Autor:** MufLabs Engineering
**Repositorio base:** D:\Ai_tools\Muf_Labs (monorepo con Turborepo + pnpm)
**Repositorio fuente:** c:\Git\T-Bit (motor de almacenamiento determinista, 95 fases completadas)

> 📖 **Cómo leer este libro (guía para no-programadores):** Este documento explica TODO lo que se ha construido. Cada sección técnica incluye un bloque **"En simple"** que cualquier persona puede entender, seguido del detalle para quien quiera profundizar. No se necesita saber programar para entender el "En simple". Las IA también usan este archivo como memoria del proyecto.

---

# Sección 1: Contexto y Visión

## 1.1 Origen de los Dos Proyectos

### AIOS MVP

AIOS es un sistema operativo de inteligencia artificial diseñado como monorepo modular. Su arquitectura utiliza:

- **Turborepo** como build system
- **pnpm** como gestor de paquetes con workspaces
- **Packages desacoplados**: kernel, agents, ui, llm, database, sdk, shared, workflow
- **Apps**: api, web, desktop

### T-Bit

T-Bit es una plataforma de almacenamiento determinista para la era de la IA. Con 95 fases de desarrollo completadas, incluye:

- Motor de almacenamiento binario `.tbit` con direccionamiento espacial determinista
- Cifrado AES-256-GCM obligatorio en reposo
- Dualidad Vit/Anti-Vit para verificación de integridad continua
- WAL (Write-Ahead Logging) para protección transaccional
- IA multi-provider (OpenAI, Gemini, Ollama, NVIDIA NIM, LM Studio)
- Búsqueda semántica con SemanticIndex y QueryIndex
- Importación de documentos (PDF, DOCX, XLSX, Markdown, código fuente)
- Visualización 3D con React Three Fiber (QuantumEngine + QVault)
- GuardianObserver para monitoreo de integridad
- 14 paneles de gestión de subsistemas

El problema de T-Bit: es monolítico. Su `server.ts` tiene 91KB en un solo archivo.

## 1.2 Decisión de Integración

La integración sigue el principio: **"AIOS como arquitecto, T-Bit como ingeniero"**

- AIOS se queda como el armazón arquitectónico (monorepo, packages, build system)
- T-Bit se convierte en la implementación real de los paquetes vacíos de AIOS
- El server.ts de T-Bit se descompone en las rutas correspondientes de `apps/`
- Nada se pierde — todas las 95 fases de T-Bit se convierten en código vivo dentro de AIOS

## 1.3 Mapeo de Componentes

| Componente de T-Bit | Destino en AIOS | Estado |
|---------------------|-----------------|--------|
| Motor .tbit + cifrado + WAL | `packages/database` | ✅ Completado |
| AiProviderFactory + multi-provider | `packages/llm` | ✅ Completado |
| SemanticIndex + QueryIndex | `packages/database/src/indexing/` | ✅ Completado |
| MarkdownBridge | `packages/database/src/bridges/` | ✅ Completado |
| BinaryAssetBridge | `packages/database/src/bridges/` | ✅ Completado |
| UniversalDocumentBridge | `packages/database/src/bridges/` | ✅ Completado |
| DocumentExtractors | `packages/database/src/bridges/` | ✅ Completado |
| CodeGraphExtractor | `packages/database/src/bridges/` | ✅ Completado |
| MemoryCore | `packages/database/src/memory/` | ✅ Completado |
| AssetManager | `packages/database/src/assets/` | ✅ Completado |
| GuardianObserver | `packages/kernel/src/monitoring/` | ✅ Completado |
| ContainerHealth | `packages/kernel/src/monitoring/` | ✅ Completado |
| AiPermissions | `packages/kernel/src/security/` | ✅ Completado |
| Subsistema IA providers (adapters) | `packages/kernel/src/providers/` | ✅ Completado |
| Orquestación cognitiva | `packages/kernel/src/orchestration/` | ✅ Completado |
| Motor de consenso | `packages/kernel/src/consensus/` | ✅ Completado |
| QuantumEngine 3D | `apps/web/src/views/quantum/` | ⏳ Pendiente (Fase 6) |
| QVault UI | `apps/web/src/panels/` | ⏳ Pendiente (Fase 6) |
| 14 Paneles UI | `apps/web/src/panels/` | ⏳ Pendiente (Fase 6) |
| tbitRuntimePaths | `packages/shared` | ⏳ Pendiente |

## 1.4 El sistema en pocas palabras (para no-programadores)

Imagina **AIOS** como un cerebro digital con distintos órganos, y **T-Bit** como la memoria indeleble y a prueba de manipulación de ese cerebro.

- **AIOS = el entrevistador inteligente.** Cuando tú le pides algo ("resume este PDF", "analiza este código", "decide entre 3 modelos"), AIOS hace este proceso mental:
  1. **Entiende** de qué tipo de tarea se trata (clasifica).
  2. **Piensa** qué pasos la resuelven y qué "expertos" (modelos de IA) conviene llamar (analiza y rankea).
  3. **Habla** con los expertos correctos y combina sus respuestas.
  4. **Verifica** que las respuestas coincidan y no se contradigan (consenso).
- **T-Bit = la caja fuerte de la memoria.** Es como un archivo contenedor binario impenetrable:
  - Guarda cada dato **dos veces de forma complementaria** (Vit y Anti-Vit): si alguien altera una copia, la otra ya no cuadra y el sistema lo detecta al instante. Es como un sello de integridad que se rompe al falsificarlo.
  - Todo va **cifrado** (AES-256-GCM), así que ni siquiera quien tenga el archivo puede leerlo sin la llave.
  - Lleva un **diario (WAL)** de operaciones: si se corta la luz a mitad de una escritura, al volver arranca desde un estado seguro, sin datos a medias.
  - Tiene **búsqueda por significado**: no solo por palabra exacta, sino "cosas que hablan de lo mismo".
- **Multi-proveedor de IA.** AIOS puede hablar con varias "inteligencias" externas (OpenAI, Gemini, Claude/Anthropic, Ollama, NVIDIA, LM Studio, OpenRouter) y con un proveedor local determinista (T-BIT) que responde sin internet — útil para pruebas y entornos sin red.

**En resumen:** AIOS decide y orquesta; T-Bit recuerda y protege. Cada bloque técnico del resto del libro tiene un equivalente en esta analogía.

---

# Sección 2: Paquete `@aios/database` — Motor .tbit (Completado)

**En simple:** Este es el "almacén indeleble". Guarda información en un archivo `.tbit` imposible de corromper en silencio: cada dato se escribe junto con su "negativo" (Anti-Vit), de modo que cualquier alteración se detecta automáticamente. Todo va cifrado (candado AES-256), lleva un diario de operaciones para no perder datos ante cortes, y permite buscar "por significado", no solo por palabra. Aquí también entran los "traductores" (bridges) que importan PDFs, Word, Excel, Markdown y código al almacén, y el gestor de archivos adjuntos (assets).

**Versión:** 0.1.0  •  **Estado:** ✅ Migración del motor completada e indexando

## 2.1 Configuración

- `packages/database/package.json` — paquete `@aios/database`, privado, entry `src/index.ts`.
- `packages/database/tsconfig.json` — extiende `../../tsconfig.base.json`, output `dist/`, composite.

## 2.2 Núcleo y normalización

- `src/core/textEncoding.ts`
  - `normalizeUnicodeText(text)` — normaliza a NFC.
  - `normalizeTBitKey(key)` — NFC + lowercase + colapsa espacios + trim.
- `src/core/RuntimePaths.ts`
  - `getTBitDataDir`, `resolveActiveTBitDataPath`, `resolveContainerPath`, `resolveMetadataPath`, `resolveWalPath`, `resolveSnapshotsDir`, `resolveReplicasDir`, `resolveExportsDir`, `resolveLockPath` — resolución determinista de rutas del contenedor.

## 2.3 Almacenamiento determinista

- `src/storage/AllocationMap.ts`
  - Tipos: `AllocationRange`, `AllocationRegion`.
  - Clase `AllocationMap`: `load/canAllocate/allocate/remove/circularRanges`. Previene solapamiento de Vit/Anti-Vit en el contenedor.
- `src/storage/TBitContainer.ts` (migrado de `TBitFileSystem.ts`)
  - Clase `TBitContainer`; tipos `TBitOffsets`, `TBitProjection`.
  - Formato binario `.tbit` con magic headers (TBITFS1 + salt), frame magic (TBIT) little-endian, direccionamiento espacial `hash(salt+clave) × PiScaled mod usableSize`, dual-write Vit/Anti-Vit (`~byte & 0xff`), validación zero-sum `(data[i]+antiData[i]+1)&0xff===0`, cifrado AES-256-GCM (nonce+authTag+AAD), payload v1/v2 (keyId), I/O circular y proyección 3D offset→esférica.
- `src/storage/TBitStorageService.ts` (migrado de `TBitStorageService.ts`)
  - Clase `TBitStorageService`; tipos `TBitMetadataEntry`, `TBitMetadata`, `TBitWalState`, `TBitWalRecord`, `TBitBatchWriteInput`, `TBitBatchCollapseResult`, `TBitStorageConfig`.
  - Cola serializada con file lock, recovery WAL→ABORTED al iniciar, `inject/injectMany/recoverData/collapse/collapseMany/snapshot/rollback/exportBundle/importBundle`, cuotas dinámicas, HMAC con `timingSafeEqual`, replicación local + remota opcional.

## 2.4 Seguridad

- `src/security/EncryptionKeyManager.ts`
  - `getActiveEncryptionKey`, `getEncryptionKeyRing`, `getEncryptionKeyById`, `getEncryptionKeyStatus`; tipo `EncryptionKeyMaterial`.
  - Gestión de llaves AES-256-GCM con rotación (env: `TBIT_ENCRYPTION_SECRET`, `TBIT_ENCRYPTION_KEY_ID`, `TBIT_ENCRYPTION_PREVIOUS_SECRETS`).

## 2.5 Memoria

- `src/memory/MemoryCore.ts` — núcleo de memoria determinista del contenedor.

## 2.6 Puentes de documentos (Bridges)

- `src/bridges/MarkdownBridge.ts` — importación/exportación Markdown ↔ contenedor.
- `src/bridges/BinaryAssetBridge.ts` — ingesta de archivos binarios como assets.
- `src/bridges/UniversalDocumentBridge.ts` — puente universal para múltiples formatos.
- `src/bridges/DocumentExtractors.ts` — extractores PDF / DOCX / XLSX y otros.
- `src/bridges/CodeGraphExtractor.ts` — extracción de grafo de símbolos desde código fuente.

## 2.7 Indexación y búsqueda

- `src/indexing/SemanticIndex.ts` — índice semántico (búsqueda por significado).
- `src/indexing/QueryIndex.ts`
  - `rebuildQueryIndex`, `syncQueryIndexIncremental`, `getQueryIndex`, `searchQueryIndex`, `getQueryIndexStats` — índice de consulta invertido/refresh incremental.

## 2.8 Assets

- `src/assets/AssetManager.ts` — gestión del ciclo de vida de assets binarios.

## 2.9 Barrel

- `src/index.ts` — reexporta la API pública de todos los submódulos.

---

# Sección 3: Paquete `@aios/llm` — Proveedores de IA (Completado)

**En simple:** Este paquete es la "centralita de teléfonos" que conecta a AIOS con varias inteligencias externas (OpenAI, Gemini, Claude, Ollama, NVIDIA, LM Studio, OpenRouter) y con una local que responde sin internet. Ofrece una sola forma de hablar con todas ellas (no importa cuál uses, el diálogo es igual) y un catálogo de qué sabe hacer cada una, para que el núcleo (kernel) pueda elegir al "experto" más adecuado para cada tarea. También "comprime" las conversaciones largas para no saturar la memoria.

**Versión:** 0.1.0  •  **Estado:** ✅ Migración completada (Fase 2 del plan)

## 3.1 Contrato de proveedores

- `src/AiProvider.ts`
  - Tipos: `AiRole`, `AiToolCall`, `AiMessage`, `AiToolSchema`, `AiProviderRequest`, `AiProviderResponse`.
  - Proveedor determinístico local **T-BIT** basado en reglas (sin red, para tests/offline).

## 3.2 Fábrica y catálogo

- `src/AiProviderFactory.ts`
  - `getAiProvider(id)` — obtiene instancia de proveedor por id.
  - `getAiProviderCatalog()` — catálogo de proveedores registrados con su info (usado por el kernel para rankear candidatos).

## 3.3 Proveedores

- `src/providers/OpenAICompatibleProvider.ts` — base compatible con API OpenAI (chat completions, streaming, tools, timeout diferenciado 60s remoto / 180s local).
- `src/providers/UniversalAiProviders.ts` — adaptadores concretos: OpenAI, Gemini, Ollama, NVIDIA NIM, LM Studio y otros vía OpenAICompatible.

## 3.4 Compresión

- `src/compression/SemanticCompression.ts` — compresión semántica de contexto/prompt.

## 3.5 Barrel

- `src/index.ts` — reexporta `AiProvider`, `AiProviderFactory`, `providers/*`, `compression/SemanticCompression`.

---

# Sección 4: Paquete `@aios/kernel` — Sistema Operativo Cognitivo (Completado)

**En simple:** Este es el **cerebro que dirige todo**. Cuando le pides algo, hace cuatro cosas como un buen gerente:

1. **Clasifica** tu pedido (¿es programar? ¿analizar? ¿diseñar? ¿necesita varias opiniones?).
2. **Planifica** los pasos para resolverlo.
3. **Elige** las inteligencias (modelos) más adecuadas para esa tarea concreta.
4. **Pone a votar** cuando conviene: pide la opinión a varios modelos y elige la mejor respuesta con un "motor de consenso" que usa 5 métodos (mayoría, peso por experto, especialización, validación cruzada y desempate).

Además controla la seguridad (qué se permite y qué no), lleva un diario de eventos, vigila la salud del almacén (GuardianObserver) y se repara solo cuando detecte algo raro. Es el "sistema operativo" del que depende todo lo demás.

**Versión:** 0.1.0  •  **Estado:** ✅ Subsistemas migrados + orquestación y consenso implementados

> Nota de arquitectura: coexisten dos clases `Kernel`:
>
> - `src/Kernel.ts` (raíz) — **orquestador cognitivo** (`classify → analyze → rank providers`).
> - `src/core/Kernel.ts` — implementación de `IKernel` que delega al pipeline de ejecución y al `ProviderRegistry`.

## 4.1 Contexto y Kernel raíz

- `src/Kernel.ts`
  - `class Kernel`: `public readonly context: KernelContext`, `boot()/shutdown()/isRunning()` (emite `kernel.started`/`kernel.stopped`), **`orchestrate(prompt): ExecutionPlan`** (pipeline classifier→analyzer→selector), `selectRelevantContext(history, plan)`.
- `src/context/KernelContext.ts` — contexto principal (sessionId, services, events, state, memory).
- `src/context/KernelState.ts` / `src/context/index.ts` — estados del kernel y barrel.
- `src/core/IKernel.ts`, `src/core/Kernel.ts` — interfaz `IKernel` e implementación que usa `ExecutionPipeline` + `ProviderRegistry`.
- `src/index.ts` — barrel de toda la API pública (monitoreo, seguridad, contexto, Kernel raíz, orquestación y consenso).

## 4.2 Orquestación cognitiva (nuevo)

- `src/orchestration/TaskIntent.ts` — tipos de intención: `TaskCategory`, `TaskIntent`, agentes sugeridos, prioridad, método de consenso.
- `src/orchestration/ExecutionPlan.ts` — `PlanStep` y `ExecutionPlan` (goal, steps, requiredProviders).
- `src/orchestration/TaskClassifier.ts` — `classify(prompt): TaskIntent`. Clasifica categoría + agentes + proveedores sugeridos por keywords.
- `src/orchestration/GoalAnalyzer.ts` — `analyze(prompt, intent): ExecutionPlan`. Genera steps según categoría (programming/architecture/automation, review/analysis, documentation, consensus-multi, devops, ui-ux/design, conversation).
- `src/orchestration/ContextManager.ts` — `selectRelevant(history, plan)`: ventana deslizante de 6 + recuperación por keywords del plan.
- `src/orchestration/SelectionEngine.ts` — `rankProviders(intent, catalog)` rankea proveedores por dominio.

## 4.3 Consenso determinista (nuevo)

- `src/consensus/ConsensusTypes.ts` — tipos: `CandidateResponse`, `ConsensusMethod`, `ConsensusResult`.
- `src/consensus/ConsensusEngine.ts` — motor con los 5 métodos de la visión:
  - `majority` — similitud Jaccard entre candidatos.
  - `weighted` — peso × longitud de respuesta.
  - `specialization` — proveedor prioritario por dominio.
  - `cross-validation` — estabilidad de líneas coincidentes (trim + intersección).
  - `arbiter` — desempate ante desacuerdo.
  - Incluye detección de divergencia (`collectDifferences`) entre candidatos.

## 4.4 Eventos y servicios

- `src/events/EventBus.ts` — bus de eventos del kernel (emisión/suscripción tipada).
- `src/services/ServiceContainer.ts` — contenedor de servicios (IoC ligero).

## 4.5 Comandos, ejecución y sesión

- `src/commands/CommandRegistry.ts` — registro de comandos del kernel.
- `src/execution/` — `IExecutionPipeline`, `ExecutionPipeline`, `PipelineContext`, `PipelineResult`, `PromptBuilder`, `ExecutionEvents`, barrel `index.ts`. Pipeline de ejecución de prompts con bind de providers.
- `src/session/Conversation.ts`, `src/session/ConversationMessage.ts` — modelo de conversación y mensaje.

## 4.6 Memoria y monitoreo

- `src/memory/MemoryStore.ts` — almacén de memoria del kernel.
- `src/monitoring/GuardianObserver.ts` — observador de integridad (estándar T-Bit).
- `src/monitoring/ContainerHealth.ts` — salud del contenedor.
- `src/monitoring/HealthReconciliation.ts` — reconciliación de salud / auto-reparación.

## 4.7 Seguridad

- `src/security/AiPermissions.ts` — permisos de IA (control de capacidades/acciones permitidas).

## 4.8 Providers — adaptadores de IA

- `src/providers/IProvider.ts`, `src/providers/ProviderInfo.ts`, `src/providers/ProviderCapabilities.ts` — contrato e info de capacidades.
- `src/providers/ProviderManager.ts` (y `ProviderManagerFactory.ts`) — manager/fábrica de proveedores.
- `src/providers/common/` — `AbortManager`, `Authentication`, `HttpClient`/`HttpRequest`/`HttpResponse`, `JsonSerializer`, `ProviderException`, `RetryPolicy`, `StreamingClient` (utilidades HTTP comunes a todos los adapters).
- `src/providers/adapters/` — 7 adapters + base `OpenAICompatible`:
  - **Anthropic** — `AnthropicProvider`, `AnthropicClient`, `AnthropicAuthentication`, `AnthropicConfiguration`, `AnthropicModels`, `AnthropicMapper`, `AnthropicErrorMapper`, `AnthropicStream`, `AnthropicProviderInfo`.
  - **OpenAI** — `OpenAIProvider`, `OpenAIConfiguration`, `OpenAIModels`, `OpenAIProviderInfo`.
  - **OpenAICompatible** — base reutilizable (`Client`, `Authentication`, `Configuration`, `ErrorMapper`, `Mapper`, `Models`, `Stream`).
  - **Gemini**, **Ollama**, **Nvidia** (NIM), **LMStudio**, **OpenRouter** — configuration/models/provider/providerInfo + barrel `index.ts`.

## 4.9 Registro y enrutamiento de providers

- `src/providers/IProviderManager.ts`, `src/providers/ProviderNotFoundError.ts`.
- `src/registry/` — `IProviderRegistry`, `ProviderRegistry`, `ProviderSelector`, `RegistryInspector`, `RegistryStatistics`, barrel `index.ts`.
- `src/routing/` — `IRoutingEngine`/`RoutingEngine`, `IRoutingPolicy`/`RoutingPolicy`(+`RoutingPolicyBuilder`), `IModelSelector`/`ModelSelector`, `IProviderResolver`/`ProviderResolver`, `ICapabilityResolver`/`CapabilityResolver`, `IFallbackManager`/`FallbackManager`, barrel `index.ts`.
- `src/routing/types/` — `ProviderCandidate`, `ProviderScore`, `RoutingContext`, `RoutingCriteria`, `RoutingRequest`, `RoutingResult`, `RoutingTypes` barrel.

## 4.10 Workflow y tipos

- `src/workflow/WorkflowState.ts`, `src/workflow/WorkflowCommand.ts` — definición de workflows.
- `src/types/` — `KernelOptions`, `KernelRequest`, `KernelResponse`, `KernelTypes` barrel.

## 4.11 Dependencias y enlace

- `packages/kernel/package.json` declara dependencias `@aios/database` y `@aios/llm` (`workspace:*`).
- Tras `pnpm install`, `@aios/llm` y `@aios/database` quedan enlazados como workspace (verificado: `packages/kernel/node_modules/@aios/llm` existe).

## 4.12 Verificación de build

- `tsc -p packages/kernel/tsconfig.json --noEmit` → **exit 0** (kernel compila sin errores).
- `tsc -p packages/llm/tsconfig.json --noEmit` → **exit 0** (LLM_OK).
- `tsc -p packages/database/tsconfig.json --noEmit` → **exit 0** (DATABASE_OK).
- `tsc -b` raíz falla por referencia *stale* preexistente a `packages/core/tsconfig.json` (no existe); ajeno a estos cambios y no bloquea los paquetes migrados.

---

# Sección 5: Fases Pendientes (Plan)

## Fase 6 — Migrar UI y visualización 3D  ⏳

- QuantumEngine 3D (React Three Fiber)
- QVault 3D limpio
- 14 paneles de gestión
- Stores (useTBitStore, useTBitCognitiveStore)
- Clientes API (todos los *Client.ts)

## Fase 7 — Conectar apps/api y apps/web  ⏳

- Descomponer server.ts (91KB) en rutas modulares
- Dockerización
- Conectar kernel + agents + database + llm

## Fase 8 — Testing y despliegue  ⏳

- Tests de integración
- Build de producción
- Deploy

**Completado (fuera del plan pendiente):**

- ✅ Fase 2 — Migrar paquete llm (AI Providers)
- ✅ Fase 3 — Migrar bridges restantes + DocumentExtractors
- ✅ Fase 4 (parcial) — Subsistemas del kernel migrados; agentes/tools pendientes
- ✅ Fase 5 — Migrar monitoreo (GuardianObserver, ContainerHealth, HealthReconciliation, AiPermissions)
- ✅ NUEVO — Orquestación cognitiva + Motor de consenso

---

# Sección 6: Registro de Cambios (Changelog)

## [0.1.0] — 2026-07-23

### Inicialización

- Creado `packages/database/package.json` como paquete `@aios/database`
- Creado `packages/database/tsconfig.json` con configuración composite
- Migrado `textEncoding.ts` → `src/core/textEncoding.ts`
- Migrado `AllocationMap.ts` → `src/storage/AllocationMap.ts`
- Migrado `EncryptionKeyManager.ts` → `src/security/EncryptionKeyManager.ts`
- Iniciada migración de `TBitFileSystem.ts` → `src/storage/TBitContainer.ts`
- Creado este documento `AIOS_Book.md`

## [0.1.0-database-complete] — 2026-07-23/24

- Completada migración de `TBitContainer.ts` (motor .tbit: magic headers, Vit/Anti-Vit, zero-sum, AES-256-GCM, I/O circular, proyección 3D).
- Migrado `TBitStorageService.ts` (WAL, recovery, inject/injectMany, collapse, snapshot/rollback, export/import, cuotas, HMAC, replicación).
- Migrada memoria: `src/memory/MemoryCore.ts`.
- Migrados puentes: `MarkdownBridge`, `BinaryAssetBridge`, `UniversalDocumentBridge`, `DocumentExtractors`, `CodeGraphExtractor`.
- Migrada indexación: `SemanticIndex`, `QueryIndex` (rebuild/incremental/search/stats).
- Migrados assets: `AssetManager`; rutas: `core/RuntimePaths.ts`.
- Creado barrel `src/index.ts` para `@aios/database`.

## [0.1.0-llm] — 2026-07-23/24

- Creado paquete `@aios/llm` (Fase 2 completada).
- Definido contrato de proveedores en `AiProvider.ts` (tipos + proveedor determinístico T-BIT local).
- Implementado `AiProviderFactory.ts` con `getAiProvider` y `getAiProviderCatalog`.
- Migrado `OpenAICompatibleProvider.ts` (chat completions, streaming, tools, timeout diferenciado).
- Migrado `UniversalAiProviders.ts` (OpenAI, Gemini, Ollama, NVIDIA NIM, LM Studio, OpenRouter vía OpenAICompatible).
- Migrado `compression/SemanticCompression.ts`.
- Creado barrel `src/index.ts`.

## [0.1.0-kernel-subsystems] — 2026-07-24

- Migrados subsistemas del kernel: `context/`, `events/EventBus`, `services/ServiceContainer`, `commands/CommandRegistry`.
- Migrado pipeline de ejecución `execution/` (`ExecutionPipeline`, `PromptBuilder`, `PipelineContext/Result`, `ExecutionEvents`).
- Migrados `memory/MemoryStore`, `session/Conversation` + `ConversationMessage`.
- Migrado monitoreo (Fase 5): `GuardianObserver`, `ContainerHealth`, `HealthReconciliation`.
- Migrada seguridad: `security/AiPermissions`.
- Migrado el subsistema de providers con 7 adapters (`providers/adapters/`: Anthropic, OpenAI, OpenAICompatible, Gemini, Ollama, Nvidia, LMStudio, OpenRouter) + capas comunes (`providers/common/`).
- Migrados registro/enrutamiento: `registry/` (`ProviderRegistry`, `ProviderSelector`, `RegistryInspector/Statistics`) y `routing/` (`RoutingEngine`, `RoutingPolicy`, `ModelSelector`, `ProviderResolver`, `CapabilityResolver`, `FallbackManager`) + tipos de routing.
- Migrados `workflow/` (`WorkflowState`, `WorkflowCommand`) y `types/` (`KernelOptions`, `KernelRequest`, `KernelResponse`).

## [0.1.0-kernel-orchestration-consensus] — 2026-07-25

- Implementada **orquestación cognitiva** en `Kernel.ts` (raíz): método `orchestrate(prompt)` con pipeline `classify → analyze → rankProviders`.
- Creados `orchestration/TaskIntent.ts`, `ExecutionPlan.ts`, `TaskClassifier.ts`, `GoalAnalyzer.ts`, `ContextManager.ts`, `SelectionEngine.ts`.
- Implementado **motor de consenso determinista** `consensus/ConsensusEngine.ts` con 5 métodos (majority/weighted/specialization/cross-validation/arbiter) + `ConsensusTypes.ts`.
- Corregido bug `TS2367` en `TaskClassifier.ts` (comparación imposible `category === "security"` fuera del `TaskCategory` union).
- Conectadas dependencias en `packages/kernel/package.json` (`@aios/database`, `@aios/llm` como `workspace:*`) y enlazadas vía `pnpm install`.
- Verificación de build: `tsc --noEmit` pasa para `@aios/kernel`, `@aios/llm` y `@aios/database` (exit 0).
- Actualizado este documento `AIOS_Book.md` al estado real del repositorio.

## [0.1.0-agents-context-engineer] — 2026-07-26

- Integrado el nuevo agente **Context Engineer** (`.github/agents/ContextEngineer.agent.md`) como agente de orquestación de primera clase: gatekeeper entre la petición del usuario y los agentes especializados.
- Responsabilidad única: **qué información** necesita cada agente (recuperar conocimiento, buscar docs/repos, cargar memoria y estándares, seleccionar archivos relevantes, descartar lo irrelevante, rankear, resolver dependencias, ensamblar el **Execution Context Package** estandarizado, detectar vacíos de conocimiento, validar y persistir/versionar el contexto).
- Refactorizado **Prompt Engineer** (`.github/agents/PromptEngineer.agent.md`) para consumir el Execution Context Package y dejar de duplicar la recuperación de contexto; ahora es dueño solo de **cómo presentar** la información al modelo (system prompts, plantillas, CoT, few-shot, optimización de tokens, adaptación por proveedor, prompt caching).
- Pipeline de orquestación de agentes consolidado: Usuario → Intent Analyzer → Workflow Manager → **Context Engineer** → **Prompt Engineer** → Model Router → Agentes Especializados → Consensus Agent → Validation Agent → Response Generator.
- Actualizado `AIOS_Book.md` con la Sección 8 (sistema de agentes) y este changelog.

---

# Sección 7: Glosario para no-programadores

- **Paquete (`package`):** una caja con código que hace un grupo de tareas relacionadas. AIOS tiene varias cajas que se conectan entre sí (database, llm, kernel…).
- **Barrel (`index.ts`):** la "portería" de un paquete. En lugar de que cada quien busque los archivos por separado, todo lo útil sale por esa única puerta.
- **Kernel:** el "cerebro/corquestador", el corazón que decide qué hacer y con quién.
- **Orquestación:** decisión automática de los pasos y los expertos (modelos de IA) para resolver una petición.
- **Proveedor de IA (`provider`):** cada inteligencia externa (OpenAI, Gemini, Claude, Ollama, etc.).
- **Adapter:** un "enchufe" que adapta la forma de hablar de AIOS a la forma particular de cada proveedor.
- **Routing / Registry:** registro de proveedores y reglas para elegir el mejor según la tarea.
- **Consenso:** pedir la opinión a varios modelos y combinar sus respuestas (mayoría, peso, especialización, validación cruzada, desempate).
- **Vit / Anti-Vit:** el dato y su "negativo" binario; juntos sirven como sello de integridad (si alteras uno, ya no cuadran).
- **WAL (diario de operaciones):** bitácora que garantiza que un corte de luz no deje datos a medias.
- **AES-256-GCM:** el candado de cifrado actual; sin la llave, el contenido es ilegible.
- **Búsqueda semántica:** encontrar resultados por significado, no solo por palabra exacta.
- **Bridge:** "traductor" que importa documentos (PDF, Word, Excel, Markdown, código) al almacén.
- **tsc (TypeScript):** el compilador que revisa que el código no tenga errores. "Exit 0" = todo correcto.
- **`workspace:*`:** forma de decir que un paquete del monorepo usa a otro paquete del mismo monorepo (sin descargar nada de internet).

> 🤖 **Nota para sistemas de IA que lean este archivo:** Este libro es la fuente de verdad del estado del proyecto. La estructura es: 1) visión y mapeo de componentes, 2) `@aios/database` (almacenamiento determinista), 3) `@aios/llm` (proveedores de IA), 4) `@aios/kernel` (orquestación + consenso + subsistemas), 5) fases pendientes, 6) changelog, 7) glosario, 8) sistema de agentes. Los bloques "En simple" son resúmenes en lenguaje natural; el resto es la referencia técnica exacta (firmas y propósito real verificado contra el código). Estado verificado el 2026-07-26: kernel, llm y database compilan (`tsc --noEmit` exit 0); queda pendiente la Fase 6 (UI 3D), Fase 7 (apps/api + apps/web) y Fase 8 (testing/deploy).

---

# Sección 8: Sistema de Agentes (`.github/agents/`)

**En simple:** AIOS no es una sola IA que hace todo; es un equipo de agentes especializados, cada uno con un rol claro. El más importante de la cadena es el **Context Engineer**, que actúa como "investigador": antes de que cualquier agente empiece, reúne, filtra y organiza todo lo que los demás necesitan saber, y lo entrega en un paquete único (Execution Context Package). Luego el **Prompt Engineer** toma ese paquete y decide cómo "hablarle" a cada modelo. Después pasan a los especialistas (backend, frontend, seguridad, etc.), y al final un agente de **consenso** y uno de **validación** revisan que todo cuadre.

## 8.1 Pipeline de orquestación de agentes

```text
Usuario
   │
   ▼
Intent Analyzer        → entiende QUÉ se pide y el tipo de tarea
   │
   ▼
Workflow Manager       → decide los pasos y el flujo
   │
   ▼
Context Engineer       → construye el Execution Context Package
   │                      (qué información, de dónde, rankeada, validada)
   ▼
Prompt Engineer        → traduce el paquete a prompts por proveedor
   │                      (cómo presentar la información al modelo)
   ▼
Model Router           → elige el/los modelo(s) adecuados
   │
   ▼
Agentes Especializados → Backend, Frontend, UI/UX, Database, Docs, Security, Performance, Code Review
   │
   ▼
Consensus Agent        → combina varias respuestas y resuelve desacuerdos
   │
   ▼
Validation Agent       → verifica corrección arquitectónica y de estándares
   │
   ▼
Response Generator     → entrega la respuesta al usuario
```

## 8.2 Separación de responsabilidades (principio clave)

| Responsabilidad | Context Engineer | Prompt Engineer |
|------------------|:---:|:---:|
| Recuperar conocimiento / buscar el repo | ✅ |  |
| Cargar memoria y estándares | ✅ |  |
| Rankear documentos | ✅ |  |
| Resolver dependencias | ✅ |  |
| Detectar vacíos de información | ✅ |  |
| Ensamblar el Execution Context Package | ✅ |  |
| Construir el system prompt |  | ✅ |
| Optimizar prompts |  | ✅ |
| Adaptar prompts por modelo/proveedor |  | ✅ |
| Prompt caching / optimización de tokens |  | ✅ |
| Estructura chain-of-thought |  | ✅ |

## 8.3 Roster de agentes (`.github/agents/*.agent.md`)

- **ContextEngineer.agent.md** — gatekeeper de contexto; produce el Execution Context Package estandarizado (con metadata, versión, traceabilidad, métricas de cobertura/confianza, riesgos y vacíos). Incluye ciclo de vida del contexto, invalidación, refresh incremental/reconstrucción total, cache y persistencia versionada.
- **PromptEngineer.agent.md** — consume el Execution Context Package; dueño de cómo presentar la info (system prompts, plantillas, CoT/ToT/ReAct, few-shot, token optimization, adaptación por proveedor).
- **AiSystemEngineer.agent.md**, **ChiefArchitect.agent.md**, **EngineeringManager.agent.md** — arquitectura y gobernanza.
- **BackendEngineering.agent.md**, **DeveloperAgent.agent.md**, **DevOpsEngineer.agent.md**, **StorageEngineer.agent.md**, **DatabaseIntegrationEngineer.agent.md** — ingeniería de implementación.
- **UI-UXArchitect.agent.md** — front-end y experiencia.
- **DocumentationEngineer.agent.md** — documentación.
- **SecurityAuditor.agent.md**, **PerformanceEngineer.agent.md**, **CodeReviewer.agent.md** — revisión/auditoría.
- **ConsensusAgent.agent.md**, **ValidationEngineer.agent.md** — consenso y validación.

## 8.4 Salida estandarizada: Execution Context Package

Paquete determinista que recibe cada agente downstream: Intent Summary · Task Classification · Relevant Knowledge · Relevant Files · Architectural Constraints · Coding Standards · Memory References · Dependency Graph · Risks · Missing Information · Confidence Score · Recommended Agents/Models · Context Size Metrics · Traceability Matrix · Version Metadata. Es independiente del LLM (provider-agnostic); solo el Prompt Engineer lo adapta a cada proveedor.

## 8.5 Nota de integración con el kernel

Cuando se implemente el código de los agentes en `packages/kernel`/`packages/agents`, la orquestación cognitiva (`Kernel.orchestrate` + `consensus/ConsensusEngine`) consumen estos roles: `TaskClassifier` alimenta al equivalente del Intent Analyzer, `ContextManager` refleja parte del Context Engineer, y `ConsensusEngine` materializa el Consensus Agent. La documentación de agentes (esta sección) y la implementación del kernel (Sección 4) describen las dos caras del mismo pipeline.

---

*Este documento se actualizará continuamente conforme avance la migración.*
