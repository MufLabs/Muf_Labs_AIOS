// Workflow types - MufLabs AIOS MVP
// Definiciones del Workflow Engine

export type EngineeringCommand = 'analyze' | 'implement' | 'document';

export type WorkflowState = 'created' | 'context_assembly' | 'executing' | 'review' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowStep {
  index: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  handler: string;
  result?: unknown;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowInstance {
  id: string;
  sessionId: string;
  command: EngineeringCommand;
  state: WorkflowState;
  steps: WorkflowStep[];
  currentStepIndex: number;
  context: import('./session.js').EngineeringContext;
  result: EngineeringResult | null;
  error: EngineeringError | null;
  config?: import('./session.js').SessionConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngineeringResult {
  summary: string;
  objects: string[];
  metrics: {
    duration: number;
    stepsCompleted: number;
    tokensUsed?: number;
    cost?: number;
  };
  artifacts: Array<{
    path: string;
    content: string;
    type: 'file' | 'report' | 'snippet' | 'doc';
  }>;
}

export interface EngineeringError {
  code: string;
  message: string;
  details?: unknown;
  step?: number;
}

export interface StepResult {
  stepIndex: number;
  success: boolean;
  data?: unknown;
  error?: EngineeringError;
}

export interface CreateWorkflowDTO {
  sessionId: string;
  command: EngineeringCommand;
  context?: Partial<import('./session.js').EngineeringContext>;
}

export type WorkflowEvent =
  | 'workflow:created'
  | 'workflow:started'
  | 'workflow:step_completed'
  | 'workflow:completed'
  | 'workflow:failed'
  | 'workflow:paused'
  | 'workflow:cancelled';

export type WorkflowEventHandler = (workflow: WorkflowInstance) => void;