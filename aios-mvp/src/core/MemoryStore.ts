// MemoryStore - MufLabs AIOS MVP
// Implementación de IMemoryStore sobre SQLite

import { AppDatabase } from './Database.js';
import type { IMemoryStore, EngineeringObject, EngineeringObjectType, EngineeringRelation } from '../types/index.js';
import type { Session, SessionStatus, SessionConfig, EngineeringContext } from '../types/session.js';
import type { WorkflowInstance, WorkflowState } from '../types/workflow.js';

export class MemoryStore implements IMemoryStore {
  private db: AppDatabase | null = null;

  private getDb(): AppDatabase {
    if (!this.db) {
      this.db = AppDatabase.getInstance();
    }
    return this.db;
  }

  // ─── Session Operations ───

  async saveSession(session: Session): Promise<void> {
    this.getDb().run(
      `INSERT OR REPLACE INTO sessions (id, user_id, status, context_json, config_json, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.userId,
        session.status,
        JSON.stringify(session.context),
        JSON.stringify(session.config),
        JSON.stringify(session.metadata),
        session.createdAt.toISOString(),
        session.updatedAt.toISOString(),
      ]
    );
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const row = this.getDb().get<SessionRow>('SELECT * FROM sessions WHERE id = ?', [sessionId]);
    if (!row) return null;
    return this.mapSessionRow(row);
  }

  async listSessions(userId: string): Promise<Session[]> {
    const rows = this.getDb().all<SessionRow>(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return rows.map(r => this.mapSessionRow(r));
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
    this.getDb().run(
      'UPDATE sessions SET status = ?, updated_at = datetime("now") WHERE id = ?',
      [status, sessionId]
    );
  }

  // ─── Workflow Operations ───

  async saveWorkflow(workflow: WorkflowInstance): Promise<void> {
    this.getDb().run(
      `INSERT OR REPLACE INTO workflows (id, session_id, command, state, steps_json, current_step_index, context_json, result_json, error_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflow.id,
        workflow.sessionId,
        workflow.command,
        workflow.state,
        JSON.stringify(workflow.steps),
        workflow.currentStepIndex,
        JSON.stringify(workflow.context),
        workflow.result ? JSON.stringify(workflow.result) : null,
        workflow.error ? JSON.stringify(workflow.error) : null,
        workflow.createdAt.toISOString(),
        workflow.updatedAt.toISOString(),
      ]
    );
  }

  async getWorkflow(workflowId: string): Promise<WorkflowInstance | null> {
    const row = this.getDb().get<WorkflowRow>('SELECT * FROM workflows WHERE id = ?', [workflowId]);
    if (!row) return null;
    return this.mapWorkflowRow(row);
  }

  async listWorkflows(sessionId: string): Promise<WorkflowInstance[]> {
    const rows = this.getDb().all<WorkflowRow>(
      'SELECT * FROM workflows WHERE session_id = ? ORDER BY created_at DESC',
      [sessionId]
    );
    return rows.map(r => this.mapWorkflowRow(r));
  }

  // ─── Object Operations ───

  async saveObject(obj: EngineeringObject): Promise<void> {
    this.getDb().run(
      `INSERT OR REPLACE INTO engineering_objects (id, type, version, content, hash, owner, workflow_id, session_id, tags_json, relations_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        obj.id,
        obj.type,
        obj.version,
        obj.content,
        obj.hash,
        obj.owner,
        obj.workflowId,
        obj.sessionId,
        JSON.stringify(obj.tags),
        JSON.stringify(obj.relations),
        obj.createdAt.toISOString(),
        obj.updatedAt.toISOString(),
      ]
    );
  }

  async getObjectsBySession(sessionId: string): Promise<EngineeringObject[]> {
    const rows = this.getDb().all<ObjectRow>(
      'SELECT * FROM engineering_objects WHERE session_id = ? ORDER BY created_at DESC',
      [sessionId]
    );
    return rows.map(r => this.mapObjectRow(r));
  }

  async getObjectsByWorkflow(workflowId: string): Promise<EngineeringObject[]> {
    const rows = this.getDb().all<ObjectRow>(
      'SELECT * FROM engineering_objects WHERE workflow_id = ? ORDER BY created_at DESC',
      [workflowId]
    );
    return rows.map(r => this.mapObjectRow(r));
  }

  async getObjectById(id: string): Promise<EngineeringObject | null> {
    const row = this.getDb().get<ObjectRow>('SELECT * FROM engineering_objects WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapObjectRow(row);
  }

  // ─── Context Operations ───

  async getContext(sessionId: string): Promise<EngineeringContext | null> {
    const session = await this.getSession(sessionId);
    return session?.context || null;
  }

  async updateContext(sessionId: string, context: Partial<EngineeringContext>): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const merged = { ...session.context, ...context };
    this.getDb().run(
      'UPDATE sessions SET context_json = ?, updated_at = datetime("now") WHERE id = ?',
      [JSON.stringify(merged), sessionId]
    );
  }

  // ─── Lifecycle ───

  async init(): Promise<void> {
    // Schema is initialized by AppDatabase.initializeSchema()
  }

  async close(): Promise<void> {
    // Connection managed by AppDatabase singleton
  }

  // ─── Mapping Helpers ───

  private mapSessionRow(row: SessionRow): Session {
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status as SessionStatus,
      context: JSON.parse(row.context_json),
      config: JSON.parse(row.config_json),
      metadata: JSON.parse(row.metadata_json),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapWorkflowRow(row: WorkflowRow): WorkflowInstance {
    return {
      id: row.id,
      sessionId: row.session_id,
      command: row.command as WorkflowInstance['command'],
      state: row.state as WorkflowState,
      steps: JSON.parse(row.steps_json),
      currentStepIndex: row.current_step_index,
      context: JSON.parse(row.context_json),
      result: row.result_json ? JSON.parse(row.result_json) : null,
      error: row.error_json ? JSON.parse(row.error_json) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapObjectRow(row: ObjectRow): EngineeringObject {
    return {
      id: row.id,
      type: row.type as EngineeringObjectType,
      version: row.version,
      content: row.content,
      hash: row.hash,
      owner: row.owner,
      workflowId: row.workflow_id,
      sessionId: row.session_id,
      tags: JSON.parse(row.tags_json),
      relations: JSON.parse(row.relations_json),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// ─── Row Types (internal) ───

interface SessionRow {
  id: string;
  user_id: string;
  status: string;
  context_json: string;
  config_json: string;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowRow {
  id: string;
  session_id: string;
  command: string;
  state: string;
  steps_json: string;
  current_step_index: number;
  context_json: string;
  result_json: string | null;
  error_json: string | null;
  created_at: string;
  updated_at: string;
}

interface ObjectRow {
  id: string;
  type: string;
  version: number;
  content: string;
  hash: string;
  owner: string;
  workflow_id: string;
  session_id: string;
  tags_json: string;
  relations_json: string;
  created_at: string;
  updated_at: string;
}