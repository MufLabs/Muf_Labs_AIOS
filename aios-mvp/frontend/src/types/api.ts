// Shared types matching the backend API DTOs

export interface SessionConfig {
  autonomyLevel: 0 | 1 | 2 | 3 | 4;
  preferredProvider: string;
  executionProfile: 'quality' | 'cost' | 'speed' | 'privacy';
  projectPath: string;
}

export interface EngineeringMemory {
  type: 'decision' | 'lesson' | 'preference' | 'standard';
  content: string;
  timestamp: string;
}

export interface EngineeringContext {
  projectName: string;
  projectPath: string;
  projectDescription: string;
  languageDetected: string[];
  frameworkDetected: string[];
  dependencies: Record<string, string>;
  previousCommands: string[];
  engineeringMemory: EngineeringMemory[];
}

export interface Session {
  id: string;
  userId: string;
  status: 'inactive' | 'active' | 'paused' | 'completed' | 'failed';
  context: EngineeringContext;
  config: SessionConfig;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Workflow types
export type EngineeringCommand = 'analyze' | 'implement' | 'document';
export type WorkflowState = 'created' | 'context_assembly' | 'executing' | 'review' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowStep {
  index: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  handler: string;
  result?: unknown;
  startedAt?: string;
  completedAt?: string;
}

export interface Artifact {
  path: string;
  content: string;
  type: 'file' | 'report' | 'snippet' | 'doc';
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
  artifacts: Artifact[];
}

export interface WorkflowInstance {
  id: string;
  sessionId: string;
  command: EngineeringCommand;
  state: WorkflowState;
  steps: WorkflowStep[];
  currentStepIndex: number;
  context: EngineeringContext;
  result: EngineeringResult | null;
  error: { code: string; message: string; details?: unknown } | null;
  config?: SessionConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCapability {
  command: string;
  confidence: number;
}

export interface AgentStatus {
  agentId: string;
  name: string;
  status: string;
  capabilities: AgentCapability[];
}

export interface ExecuteWorkflowRequest {
  sessionId: string;
  command: EngineeringCommand;
  userPrompt: string;
}