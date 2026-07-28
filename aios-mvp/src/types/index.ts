import type { EngineeringContext, CreateSessionDTO, Session, SessionConfig, SessionStatus } from './session.js';
import type { EngineeringCommand, WorkflowState, WorkflowStep, WorkflowInstance, EngineeringResult, EngineeringError, StepResult, CreateWorkflowDTO, WorkflowEvent, WorkflowEventHandler } from './workflow.js';
import type { IAgent, AgentCapability, AgentStatus, ExecutionContext, ExecutionResult, ValidationReport } from './agent.js';
import type { IMemoryStore, EngineeringObject, EngineeringObjectType, EngineeringRelation } from './memory.js';
import type { IEventBus, Message, MessageType, EventChannel, EventHandler } from './events.js';

export type {
  EngineeringContext,
  CreateSessionDTO,
  Session,
  SessionConfig,
  SessionStatus,
};
export type {
  EngineeringCommand,
  WorkflowState,
  WorkflowStep,
  WorkflowInstance,
  EngineeringResult,
  EngineeringError,
  StepResult,
  CreateWorkflowDTO,
  WorkflowEvent,
  WorkflowEventHandler,
};
export type {
  IAgent,
  AgentCapability,
  AgentStatus,
  ExecutionContext,
  ExecutionResult,
  ValidationReport,
};
export type {
  IMemoryStore,
  EngineeringObject,
  EngineeringObjectType,
  EngineeringRelation,
};
export type {
  IEventBus,
  Message,
  MessageType,
  EventChannel,
  EventHandler,
};

export type IWorkflowEngine = {
  createWorkflow(sessionId: string, command: EngineeringCommand, context: EngineeringContext): Promise<WorkflowInstance>;
  executeStep(workflowId: string, stepIndex: number): Promise<StepResult>;
  pauseWorkflow(workflowId: string): Promise<void>;
  resumeWorkflow(workflowId: string): Promise<void>;
  cancelWorkflow(workflowId: string): Promise<void>;
  getWorkflowState(workflowId: string): Promise<WorkflowInstance>;
  on(event: WorkflowEvent, handler: WorkflowEventHandler): void;
};