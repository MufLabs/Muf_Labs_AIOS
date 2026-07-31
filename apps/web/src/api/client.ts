// API Client — MufLabs AIOS MVP Frontend
import type { Session, WorkflowInstance, AgentStatus, ExecuteWorkflowRequest } from '../types/api';

const BASE = '/api';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || `Request failed (${res.status})`);
  return body;
}

// ─── Session API ───

export async function createSession(userId: string, projectPath?: string): Promise<Session> {
  const data = await request<{ session: Session }>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ userId, projectPath }),
  });
  return data.session;
}

export async function getSession(id: string): Promise<Session> {
  const data = await request<{ session: Session }>(`/sessions/${id}`);
  return data.session;
}

export async function listSessions(userId: string): Promise<Session[]> {
  const data = await request<{ sessions: Session[] }>(`/sessions?userId=${encodeURIComponent(userId)}`);
  return data.sessions;
}

// ─── Workflow API ───

export async function executeWorkflow(req: ExecuteWorkflowRequest): Promise<WorkflowInstance> {
  const data = await request<{ workflow: WorkflowInstance }>('/workflows', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return data.workflow;
}

export async function getWorkflow(id: string): Promise<WorkflowInstance> {
  const data = await request<{ workflow: WorkflowInstance }>(`/workflows/${id}`);
  return data.workflow;
}

export async function listWorkflows(sessionId: string): Promise<WorkflowInstance[]> {
  const data = await request<{ workflows: WorkflowInstance[] }>(`/workflows?sessionId=${encodeURIComponent(sessionId)}`);
  return data.workflows;
}

export async function pauseWorkflow(id: string): Promise<WorkflowInstance> {
  const data = await request<{ workflow: WorkflowInstance }>(`/workflows/${id}/pause`, { method: 'POST' });
  return data.workflow;
}

export async function cancelWorkflow(id: string): Promise<WorkflowInstance> {
  const data = await request<{ workflow: WorkflowInstance }>(`/workflows/${id}/cancel`, { method: 'POST' });
  return data.workflow;
}

// ─── Agent API ───

export async function listAgents(): Promise<AgentStatus[]> {
  const data = await request<{ agents: AgentStatus[] }>('/agents');
  return data.agents;
}