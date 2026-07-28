// API Request/Response DTOs - MufLabs AIOS MVP
// Definiciones para la capa de transporte HTTP

import type { Session, CreateSessionDTO, SessionStatus } from './session.js';
import type { WorkflowInstance, CreateWorkflowDTO, WorkflowState } from './workflow.js';
import type { EngineeringObject, EngineeringObjectType } from './memory.js';

// ─── Session API ───

export interface CreateSessionRequest {
  userId: string;
  projectPath?: string;
  autonomyLevel?: number;
  preferredProvider?: string;
}

export interface CreateSessionResponse {
  session: Session;
}

export interface GetSessionResponse {
  session: Session;
}

export interface ListSessionsResponse {
  sessions: Session[];
}

export interface UpdateSessionStatusRequest {
  status: SessionStatus;
}

// ─── Workflow API ───

export interface ExecuteWorkflowRequest {
  sessionId: string;
  command: 'analyze' | 'implement' | 'document';
  userPrompt: string;
}

export interface ExecuteWorkflowResponse {
  workflow: WorkflowInstance;
}

export interface GetWorkflowResponse {
  workflow: WorkflowInstance;
}

export interface ListWorkflowsResponse {
  workflows: WorkflowInstance[];
}

export interface PauseWorkflowResponse {
  workflow: WorkflowInstance;
}

export interface CancelWorkflowResponse {
  workflow: WorkflowInstance;
}

// ─── Agent API ───

export interface AgentStatusResponse {
  agentId: string;
  name: string;
  status: string;
  capabilities: Array<{
    command: string;
    confidence: number;
  }>;
}

export interface ListAgentsResponse {
  agents: AgentStatusResponse[];
}

// ─── Context API ───

export interface GetContextResponse {
  context: Record<string, unknown>;
}

export interface UpdateContextRequest {
  context: Record<string, unknown>;
}

// ─── Objects API ───

export interface GetObjectsResponse {
  objects: EngineeringObject[];
}

// ─── Error Response ───

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ─── Health ───

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
}