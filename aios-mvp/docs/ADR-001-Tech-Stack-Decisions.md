# ADR-001: Architecture Decision Record — Tech Stack y Decisiones Técnicas

**Estado:** Aprobado  
**Fecha:** Julio 2026  
**Autor:** Arquitecto de Software Principal  

---

## Contexto

MufLabs AIOS MVP requiere un stack tecnológico que cumpla con:

1. **Independencia de proveedor de IA** — abstracción multi-provider desde el día 1
2. **Sesiones persistentes** — el sistema recuerda contexto entre ejecuciones
3. **Workflow Engine extensible** — comandos Analyze, Implement, Document como núcleo
4. **Agentes conectables** — DeveloperAgent como primer agente, otros después
5. **UI conversacional** — basada en el Mockup HTML proporcionado
6. **Ejecución local** — sin dependencia de cloud en MVP
7. **TypeScript nativo** — alineado con los agentes existentes que referencian TypeScript

---

## Decisión: TypeScript Full-Stack Monolítico Modular

### Stack Seleccionado

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| **Runtime** | Node.js | 22 LTS | Maduro, event-loop ideal para I/O asíncrono de IA |
| **Lenguaje** | TypeScript | 5.x | Tipado estático, alineado con agentes existentes |
| **Backend Framework** | Express.js + TS | 4.x | Liviano, sin abstracciones pesadas para MVP |
| **Frontend** | HTML/CSS/JS vanilla + HTMX | — | Máxima fidelidad al mockup, sin bundle overhead |
| **Base de Datos** | SQLite (via better-sqlite3) | — | Sesiones persistentes, 0 configuración, embebido |
| **ORM/Query** | Knex.js | — | Migraciones, query building, multi-dialecto futuro |
| **IA Abstraction** | LiteLLM (Python sidecar) | — | 100+ proveedores, misma API, failover automático |
| **Message Bus** | EventEmitter nativo Node.js | — | Sin dependencias para MVP interno |
| **Testing** | Vitest | — | Rápido, compatible con TS nativo |
| **CI/CD** | GitHub Actions | — | Ya en el ecosistema del proyecto |
| **Auth** | JWT simple (jsonwebtoken) | — | Suficiente para MVP |

### ¿Por qué NO otras opciones?

| Alternativa | Descartada por |
|-------------|---------------|
| Next.js + React | Overhead de SSR/SPA para MVP; el mockup es estático con interactividad mínima |
| Python FastAPI | El ecosistema de agentes ya referencia TypeScript; mantener un solo lenguaje reduce fricción |
| PostgreSQL | SQLite es suficiente para MVP mono-usuario; migrar a PG después |
| Docker Compose | Agrega complejidad innecesaria para desarrollo local; se introduce en Fase 3 |
| gRPC | Overhead de protobuf para comunicación interna en MVP; Express REST es suficiente |
| Redis | Para MVP local, el EventEmitter nativo y SQLite cubren cola y caché |

---

## Decisión: Patrón Arquitectónico — Capas Hexagonales Simplificadas

```
┌──────────────────────────────────────────────────┐
│                   UI Layer                        │
│        (Frontend HTML/CSS + HTMX)                │
├──────────────────────────────────────────────────┤
│                API Layer                          │
│     (Express REST endpoints + DTOs)              │
├──────────────────────────────────────────────────┤
│              Application Layer                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │   Session   │  │  Workflow  │  │   Agents   │ │
│  │  Manager    │  │   Engine   │  │  Registry  │ │
│  └────────────┘  └────────────┘  └────────────┘ │
├──────────────────────────────────────────────────┤
│              Domain Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │   Core      │  │  Contracts │  │   Events   │ │
│  │  Entities   │  │  (APIs)    │  │   (Bus)    │ │
│  └────────────┘  └────────────┘  └────────────┘ │
├──────────────────────────────────────────────────┤
│           Infrastructure Layer                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │  SQLite DB  │  │  LiteLLM   │  │  File Sys  │ │
│  │ (Knex)      │  │  Sidecar   │  │  (Repo)    │ │
│  └────────────┘  └────────────┘  └────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Decisión: Data Models (Cierre GAP #2)

### Session
```typescript
interface Session {
  id: string;                          // UUID
  userId: string;                      // Owner
  status: SessionStatus;               // Active | Paused | Completed | Failed
  context: EngineeringContext;          // Memoria del proyecto
  config: SessionConfig;               // Autonomía, proveedor, etc.
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

type SessionStatus = 'inactive' | 'active' | 'paused' | 'completed' | 'failed';
```

### Workflow Instance
```typescript
interface WorkflowInstance {
  id: string;
  sessionId: string;
  command: EngineeringCommand;         // analyze | implement | document
  state: WorkflowState;                // created → executing → completed
  steps: WorkflowStep[];
  currentStepIndex: number;
  context: EngineeringContext;
  result: EngineeringResult | null;
  error: EngineeringError | null;
  createdAt: Date;
  updatedAt: Date;
}

type EngineeringCommand = 'analyze' | 'implement' | 'document';
type WorkflowState = 'created' | 'context_assembly' | 'executing' | 'review' | 'completed' | 'failed' | 'cancelled';
```

### Engineering Object
```typescript
interface EngineeringObject {
  id: string;
  type: EngineeringObjectType;        // file | decision | report | code_snippet | doc
  version: number;
  content: string;
  hash: string;                        // SHA256 del contenido
  owner: string;                       // Agent ID or 'user'
  workflowId: string;
  sessionId: string;
  tags: string[];
  relations: EngineeringRelation[];    // Vínculos a otros objetos
  createdAt: Date;
}
```

### Message (Agent Communication)
```typescript
interface Message {
  id: string;
  type: MessageType;                   // command | event | result | error | log
  source: string;                      // agent id o 'system' o 'user'
  target: string;                      // agent id o 'workflow' o 'ui'
  payload: unknown;
  correlationId: string;               // vincula mensajes de un flujo
  timestamp: Date;
  ttl: number;                         // tiempo de vida en ms
}
```

---

## Decisión: Interface Contracts (Cierre GAP #1)

### Contrato 1: Agent → Workflow Engine
```typescript
interface IWorkflowEngine {
  createWorkflow(sessionId: string, command: EngineeringCommand, context: EngineeringContext): Promise<WorkflowInstance>;
  executeStep(workflowId: string, stepIndex: number): Promise<StepResult>;
  pauseWorkflow(workflowId: string): Promise<void>;
  resumeWorkflow(workflowId: string): Promise<void>;
  cancelWorkflow(workflowId: string): Promise<void>;
  getWorkflowState(workflowId: string): Promise<WorkflowInstance>;
  on(event: WorkflowEvent, handler: WorkflowEventHandler): void;
}
```

### Contrato 2: Workflow Engine → Agent
```typescript
interface IAgent {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  canHandle(command: EngineeringCommand): boolean;
  execute(context: ExecutionContext): Promise<ExecutionResult>;
  validate(result: ExecutionResult): Promise<ValidationReport>;
  getStatus(): AgentStatus;
}
```

### Contrato 3: Kernel → Memory
```typescript
interface IMemoryStore {
  saveSession(session: Session): Promise<void>;
  getSession(sessionId: string): Promise<Session | null>;
  saveWorkflow(workflow: WorkflowInstance): Promise<void>;
  getWorkflow(workflowId: string): Promise<WorkflowInstance | null>;
  saveObject(obj: EngineeringObject): Promise<void>;
  getObjectsBySession(sessionId: string): Promise<EngineeringObject[]>;
  getContext(sessionId: string): Promise<EngineeringContext>;
}
```

---

## Decisión: Event/Message Bus

```typescript
interface IEventBus {
  publish(channel: string, message: Message): void;
  subscribe(channel: string, handler: (msg: Message) => void): () => void;  // unsubscribe
  subscribeToAgent(agentId: string, handler: (msg: Message) => void): () => void;
  publishToAgent(agentId: string, message: Message): void;
}
```

**Canales definidos para MVP:**
- `session:*` — eventos de sesión (created, paused, resumed, closed)
- `workflow:*` — eventos de workflow (started, step_completed, completed, failed)
- `agent:*` — comunicación con agentes (command, result, error)
- `ui:*` — eventos hacia la interfaz de usuario

---

## Decisión: Resolución de Gap #3 — Tech Stack Completo

| Componente | Implementación | Justificación |
|-----------|---------------|---------------|
| **Backend principal** | Node.js 22 + TypeScript + Express | Un solo lenguaje para frontend y backend |
| **Frontend** | HTML+CSS vanilla servido por Express | 0 overhead de framework, fidelidad total al mockup |
| **Base de datos** | SQLite via better-sqlite3 | Embebido, 0 configuración, rápido |
| **Migraciones** | Knex.js | Control de esquema versionado |
| **IA Provider Abstraction** | LiteLLM (proxy HTTP local) | 100+ providers, misma API, failover |
| **Auth** | JWT simple (sin sesiones de servidor) | Stateless, simple para MVP |
| **Testing** | Vitest | Rápido, nativo TS |
| **Logging** | pino | JSON logging, bajo overhead |
| **UUID** | uuid | IDs únicos para sesiones, workflows, objetos |

---

## Consecuencias

### Positivas
- **Un solo lenguaje** (TypeScript) en todo el stack — menor fricción cognitiva
- **SQLite** evita setup de bases de datos — MVP funcional en segundos
- **LiteLLM** permite cambiar de proveedor de IA sin cambiar código
- **EventBus nativo** sin dependencias externas para MVP
- **Estructura modular** permite escalar a microservicios si es necesario

### Negativas
- **Node.js single-threaded** — para cómputo pesado de IA, necesitaremos workers en el futuro
- **SQLite** no escala horizontalmente — migrar a PostgreSQL cuando haya multi-tenancy
- **LiteLLM como sidecar Python** — requiere Python instalado, pero es un costo asumible
- **HTMX vanilla** — si la UI se vuelve compleja, migrar a React/Vue

### Riesgos y Mitigaciones
| Riesgo | Probabilidad | Mitigación |
|--------|:-----------:|------------|
| LiteLLM no soporta un provider futuro | Baja | El contrato IAgent abstrae al proveedor; migrar es local |
| SQLite reacha límite de concurrencia | Baja (MVP mono-usuario) | Migrar a PostgreSQL con Knex requiere cambiar solo la config |
| El frontend vanilla se vuelve inmanejable | Media | La separación API/UI permite reemplazar frontend sin tocar backend |

---

## Referencias

- Documento Maestro de Producto (Prompt/) — Sección 8: MVP Scope
- AIOS Core Architecture — 02_AIOSCoreArchitecture.md
- User Experience Spec — 07_UserExperience.md
- Extensibility Roadmap — 17_ExtensibilityRoadmap.md (Reference Implementation)