// Memory types - MufLabs AIOS MVP
// Definiciones del almacenamiento persistente

export type EngineeringObjectType = 'file' | 'decision' | 'report' | 'code_snippet' | 'doc' | 'architecture';

export interface EngineeringRelation {
  targetId: string;
  type: 'depends_on' | 'derived_from' | 'replaces' | 'references' | 'validates';
}

export interface EngineeringObject {
  id: string;
  type: EngineeringObjectType;
  version: number;
  content: string;
  hash: string;                  // SHA256 del contenido
  owner: string;                 // Agent ID or 'user' or 'system'
  workflowId: string;
  sessionId: string;
  tags: string[];
  relations: EngineeringRelation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMemoryStore {
  // Session operations
  saveSession(session: import('./session').Session): Promise<void>;
  getSession(sessionId: string): Promise<import('./session').Session | null>;
  listSessions(userId: string): Promise<import('./session').Session[]>;
  updateSessionStatus(sessionId: string, status: import('./session').SessionStatus): Promise<void>;

  // Workflow operations
  saveWorkflow(workflow: import('./workflow').WorkflowInstance): Promise<void>;
  getWorkflow(workflowId: string): Promise<import('./workflow').WorkflowInstance | null>;
  listWorkflows(sessionId: string): Promise<import('./workflow').WorkflowInstance[]>;
  
  // Object operations
  saveObject(obj: EngineeringObject): Promise<void>;
  getObjectsBySession(sessionId: string): Promise<EngineeringObject[]>;
  getObjectsByWorkflow(workflowId: string): Promise<EngineeringObject[]>;
  getObjectById(id: string): Promise<EngineeringObject | null>;

  // Context operations
  getContext(sessionId: string): Promise<import('./session').EngineeringContext | null>;
  updateContext(sessionId: string, context: Partial<import('./session').EngineeringContext>): Promise<void>;

  // Lifecycle
  init(): Promise<void>;
  close(): Promise<void>;
}