// Agent types - MufLabs AIOS MVP
// Definiciones del sistema de agentes

import type { EngineeringCommand, EngineeringContext, EngineeringResult } from './index';

export interface AgentCapability {
  command: EngineeringCommand;
  description: string;
  confidence: number;         // 0-1 qué tan bien maneja este comando
  requiredContext: string[];  // Campos de contexto necesarios
}

export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';

export interface ExecutionContext {
  command: EngineeringCommand;
  sessionId: string;
  workflowId: string;
  projectPath: string;
  userPrompt: string;
  engineeringContext: EngineeringContext;
  previousResults: EngineeringResult[];
  config: {
    provider: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface ExecutionResult {
  success: boolean;
  summary: string;
  artifacts: EngineeringResult['artifacts'];
  objects: string[];
  metrics: {
    duration: number;
    tokensUsed?: number;
    cost?: number;
  };
  confidence: number;           // 0-1
  explanation: string;          // Por qué se tomó esta decisión
}

export interface ValidationReport {
  passed: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: string[];
  score: number;                // 0-100
}

export interface IAgent {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AgentCapability[];

  canHandle(command: EngineeringCommand): boolean;
  execute(context: ExecutionContext): Promise<ExecutionResult>;
  validate(result: ExecutionResult): Promise<ValidationReport>;
  getStatus(): AgentStatus;
  reset(): Promise<void>;
}