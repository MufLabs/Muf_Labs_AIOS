# Arquitectura Lógica del MVP — Diagrama de Comunicación

## Flujo de Comunicación: DeveloperAgent ↔ WorkflowEngine ↔ SessionManager

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USUARIO (Frontend UI)                        │
│  "Analiza este repositorio y dime en qué estado está"              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ POST /api/workflow/execute
                           │ { sessionId, command: "analyze" }
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Express)                          │
│  POST /api/workflow/execute  →  WorkflowController                  │
│  GET  /api/session/:id      →  SessionController                    │
│  POST /api/workflow/:id/pause → WorkflowController                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                                │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    WORKFLOW ENGINE                             │    │
│  │                                                               │    │
│  │  1. Recibe comando (analyze|implement|document)              │    │
│  │  2. Crea WorkflowInstance con estado 'created'               │    │
│  │  3. Ensambla EngineeringContext (vía MemoryStore)            │    │
│  │  4. Consulta AgentRegistry → ¿qué agente maneja este cmd?    │    │
│  │  5. Delega ejecución al agente correspondiente               │    │
│  │  6. Escucha eventos del agente y actualiza estado            │    │
│  │  7. Al completar, guarda resultados en MemoryStore           │    │
│  │  8. Emite evento workflow:completed → UI                     │    │
│  └──────────┬──────────────────────────────────────────────────┘    │
│             │                                                        │
│             │ ¿Quién maneja este comando?                            │
│             ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    AGENT REGISTRY                              │    │
│  │                                                               │    │
│  │  DeveloperAgent.canHandle('analyze')      → true             │    │
│  │  DeveloperAgent.canHandle('implement')    → true             │    │
│  │  DeveloperAgent.canHandle('document')     → true             │    │
│  │                                                               │    │
│  │  Map: EngineeringCommand → IAgent[]                           │    │
│  └──────────┬──────────────────────────────────────────────────┘    │
│             │                                                        │
│             │ execute(context)                                        │
│             ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   DEVELOPER AGENT                              │    │
│  │                                                               │    │
│  │  1. Recibe ExecutionContext con:                              │    │
│  │     - comando, sesión, historial, objetos previos             │    │
│  │  2. Evalúa si necesita más contexto (lee repo/files)          │    │
│  │  3. Construye prompt optimizado para el comando               │    │
│  │  4. Envía a LiteLLM (provider abstraction)                    │    │
│  │  5. Recibe respuesta de la IA                                 │    │
│  │  6. Valida resultado (formato, coherencia)                    │    │
│  │  7. Emite evento agent:progress → WorkflowEngine              │    │
│  │  8. Retorna ExecutionResult                                   │    │
│  └──────────┬──────────────────────────────────────────────────┘    │
│             │                                                        │
│             │ saveSession() / saveWorkflow() / saveObject()          │
│             ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   MEMORY STORE (SQLite)                        │    │
│  │                                                               │    │
│  │  sessions ────→ [{id, userId, status, context, config}]       │    │
│  │  workflows ───→ [{id, sessionId, command, state, steps}]      │    │
│  │  objects ─────→ [{id, type, content, hash, workflowId}]       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Secuencia Detallada de un Comando "Analyze"

```
USUARIO                API              WORKFLOW ENGINE         AGENT REGISTRY       DEVELOPER AGENT        MEMORY STORE       LiteLLM
  │                    │                       │                      │                    │                     │                │
  │  POST /workflow    │                       │                      │                    │                     │                │
  │────executar───────►│                       │                      │                    │                     │                │
  │                    │  createWorkflow()     │                      │                    │                     │                │
  │                    │──────────────────────►│                      │                    │                     │                │
  │                    │                       │  saveWorkflow()      │                    │                     │                │
  │                    │                       │────────────────────────────────────────────────────────────►│                │
  │                    │                       │                      │                    │                     │                │
  │                    │                       │  getContext()        │                    │                     │                │
  │                    │                       │────────────────────────────────────────────────────────────►│                │
  │                    │                       │◄─────context─────────────────────────────────────────────────┤                │
  │                    │                       │                      │                    │                     │                │
  │                    │                       │  canHandle('analyze')│                    │                     │                │
  │                    │                       │─────────────────────►│                    │                     │                │
  │                    │                       │◄─────true────────────┤                    │                     │                │
  │                    │                       │                      │                    │                     │                │
  │                    │                       │  execute(context)    │                    │                     │                │
  │                    │                       │─────────────────────────────────────────►│                     │                │
  │                    │                       │                      │                    │                     │                │
  │                    │                       │                      │                    │  buildPrompt()      │                │
  │                    │                       │                      │                    │─────────────────────►│                │
  │                    │                       │                      │                    │◄────response────────│                │
  │                    │                       │                      │                    │                     │                │
  │                    │                       │◄────ExecutionResult──│                    │                     │                │
  │                    │                       │                      │                    │                     │                │
  │                    │                       │  saveObject(result)  │                    │                     │                │
  │                    │                       │────────────────────────────────────────────────────────────►│                │
  │                    │                       │                      │                    │                     │                │
  │  ◄───200 OK +────  │                       │                      │                    │                     │                │
  │  WorkflowInstance  │◄──────────────────────│                      │                    │                     │                │
  │  con resultados    │                       │                      │                    │                     │                │
USUARIO                API              WORKFLOW ENGINE         AGENT REGISTRY       DEVELOPER AGENT        MEMORY STORE       LiteLLM
```

## Diagrama de Estados del Workflow Engine

```
        ┌──────────┐
        │  created  │
        └────┬─────┘
             │
             ▼
    ┌───────────────┐
    │ context_       │
    │ assembly       │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  executing    │◄────────┐
    └───────┬───────┘         │
            │                  │
            ▼                  │
    ┌───────────────┐          │ (parcial)
    │    review     │──────────┘
    └───────┬───────┘
            │
      ┌─────┴──────┐
      ▼            ▼
  ┌────────┐ ┌──────────┐
  │completed│ │  failed  │
  └────────┘ └──────────┘
```

## Interfaces de Comunicación (Contratos ya definidos en ADR-001)

### Flujo de Mensajes a través del EventBus

```
EventBus.publish('workflow:started', {
  type: 'event',
  source: 'workflow-engine',
  target: 'ui',
  payload: { workflowId, command: 'analyze', state: 'executing' },
  correlationId: workflowId,
  timestamp: new Date(),
  ttl: 5000
})

EventBus.publish('agent:progress', {
  type: 'event', 
  source: 'developer-agent',
  target: 'workflow-engine',
  payload: { step: 'analyzing_repository', progress: 0.4 },
  correlationId: workflowId,
  timestamp: new Date(),
  ttl: 5000
})

EventBus.publish('workflow:completed', {
  type: 'event',
  source: 'workflow-engine',
  target: 'ui',
  payload: { workflowId, result: { summary: '...', objects: [...] } },
  correlationId: workflowId,
  timestamp: new Date(),
  ttl: 5000
})
```

## Estructura de Directorios del MVP

```
aios-mvp/
├── docs/
│   ├── ADR-001-Tech-Stack-Decisions.md
│   └── LOGICAL-ARCHITECTURE-MVP.md
├── src/
│   ├── types/
│   │   ├── index.ts          (export de todos los tipos)
│   │   ├── session.ts        (Session, SessionConfig, SessionStatus)
│   │   ├── workflow.ts       (WorkflowInstance, WorkflowState, EngineeringCommand)
│   │   ├── agent.ts          (IAgent, AgentCapability, AgentStatus)
│   │   ├── memory.ts         (IMemoryStore, EngineeringObject, EngineeringContext)
│   │   ├── events.ts         (Message, EventBus channels)
│   │   └── api.ts            (Request/Response DTOs)
│   ├── core/
│   │   ├── Database.ts       (Knex/SQLite connection + migraciones)
│   │   ├── EventBus.ts       (implementación de IEventBus)
│   │   └── MemoryStore.ts    (implementación de IMemoryStore)
│   ├── workflow/
│   │   ├── WorkflowEngine.ts (implementación de IWorkflowEngine)
│   │   └── WorkflowSteps.ts  (definiciones de pasos por comando)
│   ├── agents/
│   │   ├── AgentRegistry.ts  (registro y lookup de agentes)
│   │   ├── BaseAgent.ts      (clase abstracta para agentes)
│   │   └── DeveloperAgent.ts (implementación del agente principal)
│   ├── api/
│   │   ├── index.ts          (Express app setup + middleware)
│   │   ├── session.routes.ts (endpoints de sesión)
│   │   ├── workflow.routes.ts(endpoints de workflow)
│   │   └── agent.routes.ts   (endpoints de agente)
│   └── index.ts              (entry point del servidor)
├── frontend/
│   ├── index.html            (mockup adaptado)
│   ├── styles.css            (estilos glassmorphism)
│   └── app.js                (interactividad + fetch a API)
├── migrations/
│   ├── 001_create_sessions.ts
│   ├── 002_create_workflows.ts
│   └── 003_create_objects.ts
├── package.json
├── tsconfig.json
└── README.md