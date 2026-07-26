/**
 * TaskIntent — resultado del análisis de una solicitud del usuario.
 *
 * El Kernel cognitivo clasifica cada solicitud antes de seleccionar
 * agentes, proveedores de IA y workflows.
 */

export type TaskCategory =
  | "conversation"
  | "programming"
  | "architecture"
  | "review"
  | "documentation"
  | "research"
  | "design"
  | "analysis"
  | "automation"
  | "devops"
  | "ui-ux"
  | "multimodal"
  | "reasoning"
  | "consensus-multi";

export type Complexity = "low" | "medium" | "high";
export type TechnicalLevel = "basic" | "intermediate" | "advanced" | "expert";
export type Urgency = "low" | "normal" | "high" | "critical";

export interface TaskIntent {
  /** Categoría automática asignada a la solicitud. */
  category: TaskCategory;
  /** Intención declarada o inferida del usuario. */
  intention: string;
  /** Nivel de complejidad estimado. */
  complexity: Complexity;
  /** Dominio técnico del problema. */
  domain: string;
  /** Nivel técnico esperado del respondedor. */
  technicalLevel: TechnicalLevel;
  /** Urgencia reportada o inferida. */
  urgency: Urgency;
  /** Riesgos identificados (seguridad, rendimiento, deuda, etc.). */
  risks: string[];
  /** Dependencias detectadas (otros sistemas, módulos, archivos). */
  dependencies: string[];
  /** Herramientas que probablemente se necesitarán. */
  toolsNeeded: string[];
  /** Conocimiento requerido para resolver la tarea. */
  knowledgeRequired: string[];
  /** Agentes especialistas sugeridos (nombres del catálogo de 15). */
  agentsNeeded: string[];
}