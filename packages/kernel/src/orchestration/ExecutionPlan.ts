/**
 * ExecutionPlan — plan producido por el Kernel para resolver una solicitud.
 *
 * Describe los pasos, los agentes especialistas requeridos, los proveedores
 * de IA sugeridos y si la ejecución puede paralelizarse.
 */

import type { TaskIntent, TaskCategory } from "./TaskIntent.js";

export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface PlanStep {
  /** Identificador único del paso dentro del plan. */
  id: string;
  /** Descripción legible de lo que debe hacer el paso. */
  description: string;
  /** Agente especialista responsable del paso. */
  agent: string;
  /** Proveedor de IA sugerido para el paso (opcional). */
  providerId?: string;
  /** Categoría de la subtarea (para re-clasificar dentro del workflow). */
  category?: TaskCategory;
  /** Identificadores de pasos que deben completarse antes de este. */
  dependsOn: string[];
  /** Estado actual del paso. */
  status: StepStatus;
}

export interface ExecutionPlan {
  /** Objetivo de alto nivel extraído de la solicitud. */
  goal: string;
  /** Categoría general de la tarea. */
  category: TaskCategory;
  /** Pasos ordenados que componen el plan. */
  steps: PlanStep[];
  /** Agentes especialistas requeridos por el plan. */
  requiredAgents: string[];
  /** Identificadores de proveedores de IA sugeridos, en orden de preferencia. */
  requiredProviders: string[];
  /** Indica si los pasos pueden ejecutarse en paralelo cuando no hay dependencias. */
  parallelizable: boolean;
  /** Resumen de la intención que originó el plan. */
  intent: TaskIntent;
}
