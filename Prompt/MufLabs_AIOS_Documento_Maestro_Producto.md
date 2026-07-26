# MufLabs AI Operating System (AIOS)
## Documento Maestro de Producto

**Versión:** 1.0 (Draft para revisión)
**Basado en:** Especificación técnica MufLabs AIOS v2.1 (17 documentos de arquitectura)
**Alcance de mercado:** Universal — desarrolladores individuales, freelancers, startups y equipos enterprise
**Estado:** Borrador de trabajo — requiere validación de negocio (pricing, go-to-market, timeline)

> **Nota metodológica:** Este documento traduce una especificación de arquitectura técnica (normativa, con lenguaje SHALL/SHOULD/MAY) a documentos de producto orientados a usuario y negocio. Todo lo que proviene directamente de la arquitectura está fundamentado en los 17 documentos fuente. Las secciones que requieren juicio de producto (priorización de MVP, métricas de éxito, journeys) están marcadas explícitamente como **[Recomendación de producto]** para que puedas validarlas o ajustarlas — no son requisitos normativos de la arquitectura.

---

# 1. PRODUCT VISION

## 1.1 Declaración de Visión

> **MufLabs AIOS convierte la ingeniería de software en una conversación con un sistema operativo inteligente: cualquier persona —desde un desarrollador freelance hasta un equipo de ingeniería enterprise— puede expresar un objetivo de ingeniería en lenguaje natural y confiar en que un ecosistema de Agentes de Ingeniería, gobernado y transparente, lo ejecutará con la autonomía que el usuario decida otorgar, sin atarse jamás a un proveedor de IA específico.**

## 1.2 El problema que resuelve

La arquitectura identifica de forma explícita las cargas que el sistema elimina del usuario. El usuario **no** debería necesitar entender:

- Ingeniería de prompts
- Enrutamiento entre proveedores de IA
- Orquestación de capacidades
- Descomposición de workflows
- Coordinación de Agentes de Ingeniería

*(Fuente: `07_UserExperience.md` — User Configuration Philosophy)*

Hoy, usar IA para ingeniería de software significa: elegir un proveedor, quedar atado a él, perder contexto entre sesiones, no tener trazabilidad de decisiones, y no tener un modelo de confianza progresiva (todo o nada). MufLabs AIOS ataca directamente estos cinco problemas.

## 1.3 Pilares estratégicos (derivados de la arquitectura)

| Pilar | Fundamento en la arquitectura |
|---|---|
| **Independencia de proveedor** | El sistema SHALL permanecer completamente independiente de cualquier proveedor de IA (OpenAI, Anthropic, Google, xAI, local, etc.). Reemplazar un proveedor NO requiere rediseño arquitectónico. (`02_AIOSCoreArchitecture.md`) |
| **Autoridad humana absoluta** | El control humano es innegociable: el usuario siempre puede aprobar, rechazar, pausar o revertir cualquier decisión autónoma. (`07_UserExperience.md` — User Control) |
| **Autonomía progresiva** | De asistencia manual (Nivel 0) a organizaciones de ingeniería autónomas (Nivel 4), configurable por el usuario/organización. (`07_UserExperience.md` — Progressive Autonomy) |
| **Transparencia total** | Cada decisión autónoma es explicable: qué se decidió, por qué, qué agentes/proveedores participaron. (`07_UserExperience.md` — Engineering Explainability Framework) |
| **Extensibilidad perpetua** | Cada subsistema expone puntos de extensión estables; nueva funcionalidad se añade por composición, no por modificación. (`17_ExtensibilityRoadmap.md`) |
| **Memoria e identidad persistentes** | El conocimiento de ingeniería (decisiones, estándares, lecciones aprendidas) sobrevive a sesiones, proveedores y migraciones. (`10_KnowledgeMemory.md`, `14_ObjectModels.md`) |

## 1.4 Visión de experiencia (a 3–5 años)

Los usuarios dejan de pensar en "prompts", "modelos" o "proveedores". Expresan objetivos —*"revisa mi repositorio", "prepara un release", "optimiza esta arquitectura"*— y el sistema resuelve automáticamente qué workflow, qué agentes y qué proveedores usar. La complejidad avanzada permanece disponible pero opcional, mediante *Progressive Disclosure*. *(Fuente: `07_UserExperience.md` — AI Operating System Experience Vision)*

## 1.5 Qué NO es MufLabs AIOS

- No es un asistente de código atado a un único modelo o IDE.
- No es una caja negra: cada acción autónoma es auditable.
- No reemplaza la autoridad de decisión humana, ni siquiera en su nivel de autonomía más alto.

---

# 2. PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 2.1 Resumen ejecutivo

MufLabs AIOS es una plataforma tipo "sistema operativo" que orquesta Agentes de Ingeniería impulsados por IA para ejecutar el ciclo completo de ingeniería de software (análisis, planificación, implementación, validación, documentación, despliegue), de forma agnóstica al proveedor de IA, con gobernanza, memoria persistente y control humano configurable.

## 2.2 Objetivos del producto

1. Permitir que cualquier usuario —sin importar su nivel técnico o el tamaño de su organización— ejecute workflows de ingeniería complejos mediante lenguaje natural.
2. Eliminar el vendor lock-in con proveedores de IA.
3. Ofrecer un modelo de autonomía configurable y auditable (Niveles 0 a 4).
4. Proveer memoria e inteligencia de ingeniería que persiste y mejora con el tiempo.
5. Habilitar un ecosistema extensible (marketplace de agentes, workflows, paquetes) que crezca más allá del equipo core de MUF Labs.

## 2.3 No-objetivos (explícitos en la arquitectura)

- El sistema **no** implementa lógica de negocio de las aplicaciones que corren sobre él (`06_ApplicationsSDK.md`).
- El motor de inteligencia **no** ejecuta workflows —solo razona (`08_IntelligenceEngine.md`).
- La capa de hardware **no** toma decisiones de asignación de recursos —solo abstrae (`12_HardwareVirtualization.md`).

## 2.4 Usuarios objetivo

Ver Sección 3 — Personas. Producto **horizontal**: mismo motor, distintos niveles de configuración/autonomía/complejidad expuesta según el perfil (Progressive Disclosure).

## 2.5 Funcionalidades clave por área (mapeo subsistema → beneficio de usuario)

| Subsistema fuente | Capacidad para el usuario |
|---|---|
| Engineering Workflow (01) | Pedir algo en lenguaje natural y que el sistema arme el workflow correcto automáticamente |
| Kernel & Runtime (03) | Sesiones que sobreviven interrupciones; ejecución confiable y trazable |
| Resource Management (04) | El sistema elige el mejor proveedor/hardware disponible según costo/calidad/latencia, sin que el usuario lo configure |
| Tools & Services (05) | Conexión con herramientas externas (Git, CI/CD, MCP Servers) sin fricción |
| Applications & SDK (06) | Terceros pueden construir apps nativas de IA sobre la plataforma |
| User Experience (07) | Interacción conversacional, transparencia, control humano, accesibilidad |
| Intelligence Engine (08) | Comprensión semántica del repositorio/proyecto, recomendaciones explicables |
| Planning & Execution (09) | Descomposición automática de objetivos en tareas ejecutables |
| Knowledge & Memory (10) | El sistema recuerda decisiones, estándares y contexto entre sesiones |
| Communication (11) | Coordinación fiable entre agentes y servicios |
| Hardware & Virtualization (12) | Ejecución local, enterprise o en la nube, de forma transparente |
| Language Specifications (13) | Definición declarativa y portable de workflows/agentes/políticas (WDL/ADL/CDL/PDL) |
| Object Models (14) | Todo activo de ingeniería (archivo, decisión, workflow) es rastreable y versionado |
| Packages & Services (15) | Marketplace de agentes, workflows y extensiones instalables |
| Governance & Security (16) | Cumplimiento, auditoría, permisos, autenticación |
| Extensibility & Roadmap (17) | La plataforma crece sin romper compatibilidad |

## 2.6 Métricas de éxito **[Recomendación de producto]**

> Estas métricas no están definidas en la arquitectura; son una propuesta inicial de producto sujeta a tu validación.

- **Activación:** % de usuarios que completan su primer Engineering Request exitoso en <10 min desde el registro.
- **Confianza/autonomía:** % de usuarios que suben de Nivel 0/1 a Nivel 2+ de autonomía en los primeros 30 días.
- **Retención de contexto:** % de sesiones que reutilizan Engineering Memory de sesiones anteriores.
- **Independencia de proveedor:** % de cuentas usando más de un proveedor de IA (validación del pilar de no lock-in).
- **Confiabilidad:** tasa de workflows completados sin intervención de rollback.

## 2.7 Restricciones y supuestos **[Requiere tu validación]**

- Modelo de negocio (freemium / suscripción / consumo) — **no definido en la arquitectura, pendiente de decisión de negocio.**
- Timeline y presupuesto de desarrollo — **no definido.**
- Regulaciones sectoriales específicas (si apunta a enterprise regulado: salud, finanzas) — **no definido.**

---

# 3. PERSONAS

*Definidas para cubrir el mercado universal declarado (freelance → enterprise), ancladas en los perfiles de usuario, niveles de expertise y modelos de interacción que sí define la arquitectura (`07_UserExperience.md` — Adaptive User Experience: Beginner/Intermediate/Advanced/Expert).*

### Persona 1 — "Sofía", Desarrolladora Freelance
- **Perfil:** Trabaja sola o en proyectos pequeños con clientes distintos. Sensible al costo, quiere velocidad.
- **Nivel de expertise AIOS:** Beginner → Intermediate.
- **Autonomía preferida:** Nivel 1 (Guided Assistance) — quiere recomendaciones, pero aprueba cada acción hasta ganar confianza.
- **Necesidad clave:** Onboarding simple, sin curva de aprendizaje de prompt engineering; poder elegir proveedores baratos o locales para controlar costo (Local Compute Support, `12_HardwareVirtualization.md`).
- **Frustración actual:** Saltar entre herramientas de IA sin memoria compartida entre proyectos de distintos clientes (resuelto por Project Isolation con conocimiento cruzado opcional, `01_EngineeringWorkflow.md` — Multi-Project Management).

### Persona 2 — "Daniel", Ingeniero de Plataforma / DevOps en Startup
- **Perfil:** Startup en crecimiento, stack heterogéneo, necesita velocidad sin sacrificar trazabilidad.
- **Nivel de expertise:** Advanced.
- **Autonomía preferida:** Nivel 2–3 (Supervised → Engineering Autonomy) — automatiza tareas rutinarias, exige aprobación en despliegues a producción.
- **Necesidad clave:** Integración con CI/CD, Git y MCP Servers existentes (`05_ToolsAndServices.md`); observabilidad y auditoría de lo que la IA hizo (`16_GovernanceSecurity.md`).
- **Frustración actual:** Herramientas de IA que no exponen por qué tomaron una decisión — necesita el Engineering Explainability Framework.

### Persona 3 — "Laura", Engineering Manager en Empresa Enterprise
- **Perfil:** Lidera múltiples equipos, responde ante compliance y seguridad.
- **Nivel de expertise:** Intermediate en IA, Expert en gestión de ingeniería.
- **Autonomía preferida:** Configurable por política organizacional (Organization Profiles, `01_EngineeringWorkflow.md`).
- **Necesidad clave:** Governance & Security robusto (autenticación, permisos, compliance, auditoría), Organization Profiles con proveedores/estándares aprobados, visibilidad de todos los workflows activos (AI Native Dashboard).
- **Frustración actual:** Falta de control centralizado cuando distintos equipos usan IA de forma descoordinada, sin estándares comunes.

### Persona 4 — "Marco", Arquitecto de Software Senior
- **Perfil:** Responsable de decisiones arquitectónicas de largo plazo.
- **Nivel de expertise:** Expert.
- **Autonomía preferida:** Nivel 3–4, pero exige control total en decisiones arquitectónicas (Human Override).
- **Necesidad clave:** Motor de Inteligencia con comprensión profunda del repositorio (Repository Understanding, `08_IntelligenceEngine.md`), Architecture Decision Records versionados y trazables (`14_ObjectModels.md`).
- **Frustración actual:** Herramientas de IA que "alucinan" arquitectura sin conocer el contexto real del sistema.

### Persona 5 — "Camila", Stakeholder No Técnico (Product/Business)
- **Perfil:** No escribe código, pero necesita visibilidad y a veces pedir cambios simples (documentación, reportes).
- **Nivel de expertise:** Beginner absoluto.
- **Autonomía preferida:** Nivel 0–1.
- **Necesidad clave:** Interfaz de lenguaje natural sin fricción, explicaciones simples, ocultar complejidad técnica (`07_UserExperience.md` — Natural Language Operating System, Adaptive UX/Beginner).
- **Frustración actual:** No poder participar en el ciclo de ingeniería sin depender 100% de un desarrollador.

---

# 4. CASOS DE USO

*Basados directamente en la Engineering Command Interface (`07_UserExperience.md`), que define los comandos universales soportados por el sistema.*

| # | Caso de uso | Comando base | Persona principal | Resultado esperado |
|---|---|---|---|---|
| CU-01 | Analizar un repositorio existente | Analyze | Sofía, Marco | Reporte de comprensión del proyecto, riesgos y arquitectura detectada |
| CU-02 | Implementar una funcionalidad nueva | Implement | Sofía, Daniel | Código generado, validado y documentado, con Engineering Package trazable |
| CU-03 | Revisar código (code review asistido) | Review | Daniel, Marco | Reporte de Code Review con hallazgos y recomendaciones |
| CU-04 | Validar cumplimiento de estándares | Validate | Laura | Reporte de validación / compliance |
| CU-05 | Optimizar arquitectura o performance | Optimize | Marco, Daniel | Recomendaciones de optimización con evidencia |
| CU-06 | Refactorizar código existente | Refactor | Sofía, Daniel | Código refactorizado con historial de decisiones |
| CU-07 | Generar documentación técnica | Document | Camila, Sofía | Documentación generada y sincronizada con el código |
| CU-08 | Preparar y ejecutar un release | Deploy | Daniel | Artefactos de despliegue, con gate de aprobación humana |
| CU-09 | Monitorear salud de proyectos/agentes | Monitor | Laura | Dashboard con estado de workflows, agentes y métricas |
| CU-10 | Investigar una tecnología o enfoque | Research | Marco, Camila | Reporte de investigación con fuentes y recomendaciones |
| CU-11 | Configurar políticas organizacionales | (Configuración) | Laura | Organization Profile aplicado a todos los proyectos del equipo |
| CU-12 | Instalar una extensión/agente del marketplace | (Package Install) | Daniel, Marco | Nuevo agente/capacidad disponible, validado y firmado digitalmente |
| CU-13 | Cambiar de proveedor de IA sin perder contexto | (Provider Switch) | Todas | Continuidad del trabajo sin rediseño ni pérdida de memoria |
| CU-14 | Aprobar o rechazar una acción autónoma | (Human-in-the-loop) | Todas | Decisión humana registrada y trazable |
| CU-15 | Recuperar contexto de un proyecto anterior | (Memory Retrieval) | Sofía | El sistema retoma el trabajo con contexto completo, sin repetir explicaciones |

---

# 5. USER JOURNEYS

## Journey A — Sofía (Freelance) ejecuta su primer proyecto con un cliente nuevo

1. **Onboarding:** Sofía crea una cuenta, define su perfil (Nivel de autonomía: Guided). *(Progressive Disclosure — Beginner)*
2. **Inicio del proyecto:** Escribe: *"Analiza este repositorio y dime en qué estado está."* → CU-01.
3. **Transparencia:** El sistema explica qué agentes usó y por qué. Sofía gana confianza.
4. **Ejecución:** Pide implementar una funcionalidad → CU-02. Aprueba cada paso (Human-in-the-loop).
5. **Entrega:** Pide documentación automática para el cliente → CU-07.
6. **Cierre:** El Engineering Package queda archivado y vinculado al proyecto; en el próximo proyecto del mismo cliente, puede recuperar memoria → CU-15.
7. **Resultado:** Sofía sube su nivel de autonomía a Supervised en su segundo proyecto.

## Journey B — Daniel (Startup) automatiza su pipeline de calidad

1. Conecta AIOS a su repositorio y su CI/CD (`05_ToolsAndServices.md` — Connector Framework).
2. Configura Nivel de Autonomía 2 (Supervised): tareas rutinarias automáticas, despliegues requieren aprobación.
3. Cada Pull Request dispara automáticamente CU-03 (Review) y CU-04 (Validate).
4. Cuando detecta una oportunidad de mejora, el sistema sugiere CU-05 (Optimize); Daniel aprueba o descarta.
5. Al preparar un release, el sistema ejecuta CU-08 pero se detiene en el gate de aprobación humana antes de producción.
6. Daniel revisa el Dashboard (CU-09) para ver el estado de todos sus workflows activos.

## Journey C — Laura (Enterprise) estandariza el uso de IA en 5 equipos

1. Define un **Organization Profile**: proveedores aprobados, estándares de código, políticas de seguridad y compliance.
2. Aplica el perfil a los 5 equipos → CU-11.
3. Cada equipo opera con su propio Nivel de Autonomía dentro de los límites organizacionales.
4. Laura monitorea de forma centralizada: workflows activos, uso de proveedores, incidentes de gobernanza → CU-09.
5. Ante una auditoría de compliance, exporta el historial completo de decisiones y aprobaciones (Governance & Security — Audit).

## Journey D — Marco (Arquitecto) toma una decisión arquitectónica crítica

1. Pide al sistema: *"Analiza el impacto de migrar de monolito a microservicios."* → CU-01 + CU-05.
2. El Motor de Inteligencia entrega un reporte con nivel de confianza y explicación (Confidence Evaluation, `08_IntelligenceEngine.md`).
3. Marco cuestiona una recomendación; el sistema explica el razonamiento (Explainability Framework).
4. Marco registra su decisión final como Architecture Decision Record, versionado y trazable.
5. La decisión queda disponible como contexto para futuros workflows del proyecto (Engineering Memory).

## Journey E — Camila (No técnica) pide un reporte sin saber programar

1. Escribe en lenguaje natural: *"Explícame en qué está el proyecto X esta semana."* → CU-01 simplificado (Beginner UX).
2. El sistema oculta la complejidad técnica y entrega un resumen ejecutivo.
3. Camila pide documentación de una funcionalidad para presentarla a un cliente → CU-07.
4. Nunca necesita tocar configuración avanzada; todo ocurre en Nivel 0 de autonomía con máxima simplicidad.

---

# 6. FUNCTIONAL REQUIREMENTS (Requisitos Funcionales)

*Extraídos y consolidados directamente de las declaraciones normativas (SHALL) de los 17 documentos. Agrupados por subsistema.*

### RF-1 Workflow y Orquestación (fuente: 01, 09)
- RF-1.1 El sistema SHALL interpretar solicitudes en lenguaje natural y generar automáticamente el workflow de ingeniería correspondiente.
- RF-1.2 El sistema SHALL descomponer objetivos de ingeniería en tareas ejecutables con dependencias explícitas.
- RF-1.3 El sistema SHALL ensamblar Engineering Context completo antes de que cualquier agente ejecute.
- RF-1.4 El sistema SHALL permitir pausar, reanudar y cancelar workflows en cualquier etapa.
- RF-1.5 El sistema SHALL generar automáticamente artefactos de ingeniería (reportes, documentación, ADRs) al completar un workflow.

### RF-2 Runtime y Ejecución (fuente: 03)
- RF-2.1 El sistema SHALL mantener sesiones de ingeniería persistentes que sobrevivan interrupciones.
- RF-2.2 El sistema SHALL exponer el ciclo de vida completo de cada Agente de Ingeniería (creación → ejecución → limpieza).
- RF-2.3 El sistema SHALL permitir ejecución paralela de múltiples procesos de IA.

### RF-3 Gestión de Recursos y Proveedores (fuente: 04, 12)
- RF-3.1 El sistema SHALL seleccionar automáticamente el proveedor de IA y el hardware óptimo según calidad, costo y latencia, sin requerir configuración manual.
- RF-3.2 El sistema SHALL permitir al usuario definir perfiles de ejecución (máxima calidad, mínimo costo, privacidad, offline).
- RF-3.3 El sistema SHALL soportar failover automático entre proveedores/hardware ante fallas.

### RF-4 Herramientas y Conectores (fuente: 05)
- RF-4.1 El sistema SHALL permitir conectar herramientas externas (control de versiones, CI/CD, MCP Servers) mediante un registro estandarizado de conectores.
- RF-4.2 El sistema SHALL virtualizar herramientas equivalentes (ej. GitHub/GitLab) bajo capacidades lógicas comunes.

### RF-5 Aplicaciones y SDK (fuente: 06)
- RF-5.1 El sistema SHALL proveer un SDK para que terceros construyan Aplicaciones Nativas de IA sobre la plataforma.
- RF-5.2 Toda aplicación SHALL declarar un Manifiesto con capacidades y permisos requeridos, validado antes de ejecutar.

### RF-6 Experiencia de Usuario (fuente: 07)
- RF-6.1 El sistema SHALL exponer un Comando de Ingeniería universal (Analyze, Implement, Review, Validate, Optimize, Refactor, Document, Deploy, Monitor, Research).
- RF-6.2 El sistema SHALL adaptar la complejidad expuesta al nivel de expertise del usuario (Beginner → Expert).
- RF-6.3 El sistema SHALL soportar 5 niveles de autonomía configurables (Manual → Organizacional).
- RF-6.4 El usuario SHALL poder aprobar, rechazar, pausar o revertir cualquier decisión autónoma en cualquier momento.
- RF-6.5 El sistema SHALL explicar cada decisión autónoma (qué, por qué, qué agentes/proveedores participaron).
- RF-6.6 El sistema SHALL soportar interacción vía interfaces conversacionales, web, desktop, mobile, CLI y voz.

### RF-7 Motor de Inteligencia (fuente: 08)
- RF-7.1 El sistema SHALL analizar repositorios y generar comprensión semántica de su arquitectura.
- RF-7.2 El sistema SHALL emitir recomendaciones con nivel de confianza explícito.

### RF-8 Conocimiento y Memoria (fuente: 10, 14)
- RF-8.1 El sistema SHALL persistir Engineering Memory entre sesiones y proyectos (con aislamiento salvo autorización explícita de compartir).
- RF-8.2 Todo activo de ingeniería SHALL representarse como un Engineering Object con identidad única, versionado y trazable.

### RF-9 Comunicación (fuente: 11)
- RF-9.1 El sistema SHALL coordinar agentes y servicios mediante un Event/Message Bus estandarizado con entrega confiable.

### RF-10 Paquetes y Marketplace (fuente: 15)
- RF-10.1 El sistema SHALL soportar instalación, actualización y rollback de paquetes (agentes, workflows, capacidades) con validación previa.
- RF-10.2 El sistema SHALL exponer un Marketplace de recursos reutilizables, firmados digitalmente.

### RF-11 Gobernanza y Seguridad (fuente: 16)
- RF-11.1 El sistema SHALL aplicar autenticación y autorización a cada acción del sistema.
- RF-11.2 El sistema SHALL generar registros de auditoría para toda acción autónoma.
- RF-11.3 El sistema SHALL permitir a organizaciones definir políticas y perfiles aprobados (proveedores, estándares, seguridad).

---

# 7. NON-FUNCTIONAL REQUIREMENTS (Requisitos No Funcionales)

*Consolidados de los principios arquitectónicos transversales.*

| Categoría | Requisito | Fuente |
|---|---|---|
| **Independencia de proveedor** | El sistema NUNCA debe contener lógica dependiente de un proveedor específico de IA | 02 |
| **Portabilidad/Interoperabilidad** | Toda interfaz debe ser estandarizada y versionada semánticamente | 03, 14 |
| **Modularidad/Desacoplamiento** | Cada subsistema tiene una única responsabilidad; dependencias solo hacia capas inferiores, sin ciclos | 00, 02 |
| **Extensibilidad** | Nueva funcionalidad se agrega por composición, sin rediseño arquitectónico | 17 |
| **Compatibilidad hacia atrás** | Cambios disruptivos requieren aprobación formal de gobernanza | 17, 03 |
| **Explicabilidad** | Toda acción autónoma debe ser explicable en cualquier capa del sistema | 07 |
| **Trazabilidad/Auditoría** | Toda decisión, versión y relación debe quedar registrada y ser recuperable | 14, 16 |
| **Seguridad** | Autenticación, autorización y cumplimiento aplicados a cada llamada del sistema | 16 |
| **Resiliencia/Tolerancia a fallos** | Sesiones y workflows deben sobrevivir interrupciones cuando sea técnicamente posible | 03 |
| **Escalabilidad** | Soporte de ejecución distribuida, paralela y federada | 03, 12 |
| **Portabilidad de hardware** | Independencia total de CPU/GPU/NPU/TPU/nube/edge, incluyendo hardware futuro (cuántico, neuromórfico) | 12 |
| **Accesibilidad** | Soporte de lectores de pantalla, navegación por teclado, voz, multilenguaje, alto contraste | 07 |
| **Eficiencia energética** | Optimización de consumo energético sin comprometer gobernanza | 12 |
| **Determinismo (cuando aplique)** | Llamadas al sistema deben ser deterministas siempre que sea técnicamente viable | 03 |
| **Privacidad** | Perfiles de ejecución deben soportar privacidad y ejecución local/offline | 06, 12 |

---

# 8. MVP (Producto Mínimo Viable)

**[Recomendación de producto — la arquitectura no define un MVP; esto es una propuesta de priorización para tu validación]**

Dado que la especificación completa cubre 17 subsistemas de nivel "sistema operativo", un MVP fiel a toda la arquitectura no es viable de entrada. Propongo acotar el MVP a demostrar el **loop de valor central** con la menor superficie posible, usando como ancla la sección *Reference Implementation* de `17_ExtensibilityRoadmap.md`, que ya identifica el subconjunto mínimo que cualquier implementación de referencia debe demostrar.

## 8.1 Alcance incluido en el MVP

| Incluido | Nivel de profundidad en MVP |
|---|---|
| Engineering Workflow Engine | Solo comandos: Analyze, Implement, Document (los 3 casos de uso de mayor valor percibido) |
| Kernel & Runtime | Sesión única persistente por proyecto; sin ejecución distribuida |
| Resource Management | Selección automática entre 2–3 proveedores de IA soportados (no el ecosistema completo) |
| Applications & SDK | No incluido en MVP (se pospone el SDK para terceros) |
| User Experience | Interfaz conversacional web únicamente; Niveles de Autonomía 0 y 1 solamente; sin voz/AR/VR |
| Intelligence Engine | Comprensión básica de repositorio (estructura + lenguaje + dependencias), sin razonamiento multi-agente avanzado |
| Planning & Execution | Descomposición simple de tareas, sin Dynamic Team Assembly compleja |
| Knowledge & Memory | Memoria persistente por proyecto (sin Knowledge Graph ni Digital Twin todavía) |
| Communication | Event Bus interno básico (sin federación multi-organización) |
| Object Models | Identidad y versionado básico de artefactos generados |
| Governance & Security | Autenticación, autorización básica, registro de auditoría (sin compliance avanzado ni multi-tenant enterprise todavía) |
| Packages & Marketplace | No incluido en MVP |
| Hardware & Virtualization | Solo ejecución cloud gestionada por MufLabs (sin local/edge/federado todavía) |
| Language Specifications (WDL/ADL/CDL/PDL) | No expuestas al usuario en MVP; uso interno simplificado |

## 8.2 Explícitamente fuera del MVP

- Marketplace y paquetes de terceros
- SDK público para desarrolladores externos
- Niveles de Autonomía 2, 3 y 4 (Supervised → Organizacional)
- Ejecución híbrida/federada de hardware
- Organization Profiles multi-equipo (gobernanza enterprise avanzada)
- Digital Twin y Knowledge Graph completo
- Interfaces de voz, AR/VR

## 8.3 Personas cubiertas en el MVP

El MVP prioriza **Sofía (freelance)** y **Daniel (startup)** como personas objetivo iniciales, por ser los perfiles que obtienen valor con la menor superficie de producto (Analyze + Implement + Document, autonomía Nivel 0–1). Laura, Marco y Camila requieren funcionalidad enterprise/avanzada pospuesta a fases posteriores.

## 8.4 Criterio de éxito del MVP **[Recomendación]**

Un usuario nuevo puede, sin soporte humano de MUF Labs:
1. Conectar un repositorio.
2. Pedir en lenguaje natural que se analice.
3. Pedir una implementación pequeña con aprobación paso a paso.
4. Obtener documentación generada automáticamente.
5. Volver al día siguiente y que el sistema recuerde el contexto del proyecto.

---

# 9. PRÓXIMOS PASOS SUGERIDOS

1. **Validar conmigo** las secciones marcadas **[Recomendación de producto]** (métricas, alcance de MVP, journeys) — son juicio experto, no extraídas de la arquitectura.
2. Definir modelo de negocio y pricing (no cubierto por la arquitectura técnica).
3. Priorizar entre las 5 personas cuál se ataca primero según tu estrategia de mercado real (¿enterprise-first para revenue, o freelance-first para volumen/product-led growth?).
4. Si quieres, puedo convertir este documento a Word (.docx) para compartir con stakeholders, o desglosarlo en documentos separados por sección.
