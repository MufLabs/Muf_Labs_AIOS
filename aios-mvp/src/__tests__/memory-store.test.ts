import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../core/Database.js';
import { MemoryStore } from '../core/MemoryStore.js';
import type { Session } from '../types/session.js';
import type { WorkflowInstance } from '../types/workflow.js';
import type { EngineeringObject } from '../types/memory.js';

let store: MemoryStore;
let sessionId: string;

beforeEach(async () => {
  AppDatabase.resetInstance();
  await AppDatabase.initialize();
  AppDatabase.getInstance().initializeSchema();
  store = new MemoryStore();
  sessionId = uuidv4();

  // Create test session
  const session = createTestSession({ id: sessionId });
  await store.saveSession(session);
});

afterAll(() => {
  AppDatabase.resetInstance();
});

function createTestSession(overrides: Partial<Session> = {}): Session {
  return {
    id: uuidv4(),
    userId: 'test-user',
    status: 'active',
    context: { projectName: 'test-project', projectPath: '/tmp/test' },
    config: { autonomyLevel: 'suggest', preferredProvider: 'auto' },
    metadata: { version: '0.1.0' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createTestWorkflow(sid: string, overrides: Partial<WorkflowInstance> = {}): WorkflowInstance {
  return {
    id: uuidv4(),
    sessionId: sid,
    command: 'analyze',
    state: 'created',
    steps: [
      { index: 0, name: 'context_assembly', status: 'pending', handler: 'assemblyContext' },
      { index: 1, name: 'repository_scan', status: 'pending', handler: 'scanRepository' },
    ],
    currentStepIndex: 0,
    context: { projectName: 'test-project', projectPath: '/tmp/test' },
    result: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('MemoryStore — Sessions', () => {
  it('should save and retrieve a session', async () => {
    const session = createTestSession();
    await store.saveSession(session);

    const retrieved = await store.getSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(session.id);
    expect(retrieved!.userId).toBe('test-user');
    expect(retrieved!.status).toBe('active');
    expect(retrieved!.context.projectName).toBe('test-project');
  });

  it('should return null for non-existent session', async () => {
    const result = await store.getSession('nonexistent');
    expect(result).toBeNull();
  });

  it('should update session status', async () => {
    const session = createTestSession();
    await store.saveSession(session);

    await store.updateSessionStatus(session.id, 'paused');
    const updated = await store.getSession(session.id);
    expect(updated!.status).toBe('paused');
  });

  it('should list sessions for a user', async () => {
    const s1 = createTestSession({ userId: 'user-1' });
    const s2 = createTestSession({ userId: 'user-1' });
    const s3 = createTestSession({ userId: 'user-2' });

    await store.saveSession(s1);
    await store.saveSession(s2);
    await store.saveSession(s3);

    const user1Sessions = await store.listSessions('user-1');
    expect(user1Sessions.length).toBe(2);

    const user2Sessions = await store.listSessions('user-2');
    expect(user2Sessions.length).toBe(1);
  });

  it('should replace existing session on save', async () => {
    const session = createTestSession({ status: 'active' });
    await store.saveSession(session);

    session.status = 'paused';
    await store.saveSession(session);

    const retrieved = await store.getSession(session.id);
    expect(retrieved!.status).toBe('paused');
  });
});

describe('MemoryStore — Workflows', () => {
  it('should save and retrieve a workflow', async () => {
    const workflow = createTestWorkflow(sessionId);
    await store.saveWorkflow(workflow);

    const retrieved = await store.getWorkflow(workflow.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(workflow.id);
    expect(retrieved!.command).toBe('analyze');
    expect(retrieved!.state).toBe('created');
  });

  it('should return null for non-existent workflow', async () => {
    const result = await store.getWorkflow('nonexistent');
    expect(result).toBeNull();
  });

  it('should update workflow state', async () => {
    const workflow = createTestWorkflow(sessionId);
    await store.saveWorkflow(workflow);

    workflow.state = 'executing';
    await store.saveWorkflow(workflow);

    const updated = await store.getWorkflow(workflow.id);
    expect(updated!.state).toBe('executing');
  });

  it('should store error information', async () => {
    const workflow = createTestWorkflow(sessionId, {
      state: 'failed',
      error: { code: 'EXECUTION_ERROR', message: 'Something went wrong', step: 1 },
    });
    await store.saveWorkflow(workflow);

    const retrieved = await store.getWorkflow(workflow.id);
    expect(retrieved!.error).toBeDefined();
    expect(retrieved!.error!.code).toBe('EXECUTION_ERROR');
    expect(retrieved!.error!.step).toBe(1);
  });

  it('should store result information', async () => {
    const workflow = createTestWorkflow(sessionId, {
      state: 'completed',
      result: {
        summary: 'Analysis complete',
        objects: ['obj-1'],
        metrics: { duration: 1000, stepsCompleted: 2, tokensUsed: 500, cost: 0.02 },
        artifacts: [],
      },
    });
    await store.saveWorkflow(workflow);

    const retrieved = await store.getWorkflow(workflow.id);
    expect(retrieved!.result).toBeDefined();
    expect(retrieved!.result!.summary).toBe('Analysis complete');
    expect(retrieved!.result!.metrics.cost).toBe(0.02);
  });

  it('should list workflows by session', async () => {
    const w1 = createTestWorkflow(sessionId, { command: 'analyze' });
    const w2 = createTestWorkflow(sessionId, { command: 'implement' });
    await store.saveWorkflow(w1);
    await store.saveWorkflow(w2);

    const workflows = await store.listWorkflows(sessionId);
    expect(workflows.length).toBe(2);
  });
});

describe('MemoryStore — Engineering Objects', () => {
  it('should save and retrieve an object', async () => {
    const workflow = createTestWorkflow(sessionId);
    await store.saveWorkflow(workflow);

    const obj: EngineeringObject = {
      id: uuidv4(),
      type: 'analysis',
      version: 1,
      content: '{"result": "ok"}',
      hash: 'abc123',
      owner: 'developer-agent-001',
      workflowId: workflow.id,
      sessionId: sessionId,
      tags: ['test'],
      relations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await store.saveObject(obj);

    const retrieved = await store.getObjectById(obj.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.type).toBe('analysis');
    expect(retrieved!.content).toBe('{"result": "ok"}');
  });

  it('should list objects by session', async () => {
    const workflow = createTestWorkflow(sessionId);
    await store.saveWorkflow(workflow);

    const obj1: EngineeringObject = {
      id: uuidv4(), type: 'analysis', version: 1, content: '{}', hash: 'h1',
      owner: 'dev', workflowId: workflow.id, sessionId: sessionId,
      tags: [], relations: [], createdAt: new Date(), updatedAt: new Date(),
    };
    const obj2: EngineeringObject = {
      id: uuidv4(), type: 'design', version: 1, content: '{}', hash: 'h2',
      owner: 'dev', workflowId: workflow.id, sessionId: sessionId,
      tags: [], relations: [], createdAt: new Date(), updatedAt: new Date(),
    };

    await store.saveObject(obj1);
    await store.saveObject(obj2);

    const objects = await store.getObjectsBySession(sessionId);
    expect(objects.length).toBe(2);
  });

  it('should list objects by workflow', async () => {
    const wf1 = createTestWorkflow(sessionId);
    const wf2 = createTestWorkflow(sessionId);
    await store.saveWorkflow(wf1);
    await store.saveWorkflow(wf2);

    const obj: EngineeringObject = {
      id: uuidv4(), type: 'analysis', version: 1, content: '{}', hash: 'h3',
      owner: 'dev', workflowId: wf1.id, sessionId: sessionId,
      tags: [], relations: [], createdAt: new Date(), updatedAt: new Date(),
    };
    await store.saveObject(obj);

    const byWf1 = await store.getObjectsByWorkflow(wf1.id);
    expect(byWf1.length).toBe(1);

    const byWf2 = await store.getObjectsByWorkflow(wf2.id);
    expect(byWf2.length).toBe(0);
  });
});

describe('MemoryStore — Context', () => {
  it('should get context from session', async () => {
    const session = createTestSession({
      context: { projectName: 'my-project', projectPath: '/my/path', projectLanguage: 'typescript' },
    });
    await store.saveSession(session);

    const ctx = await store.getContext(session.id);
    expect(ctx).toBeDefined();
    expect(ctx!.projectName).toBe('my-project');
    expect(ctx!.projectLanguage).toBe('typescript');
  });

  it('should return null if session not found', async () => {
    const ctx = await store.getContext('nonexistent');
    expect(ctx).toBeNull();
  });

  it('should update context partially', async () => {
    const session = createTestSession({
      context: { projectName: 'original', projectPath: '/original' },
    });
    await store.saveSession(session);

    await store.updateContext(session.id, { projectName: 'updated' });

    const ctx = await store.getContext(session.id);
    expect(ctx!.projectName).toBe('updated');
    expect(ctx!.projectPath).toBe('/original');
  });

  it('should throw if updating context for non-existent session', async () => {
    await expect(store.updateContext('ghost', { projectName: 'x' })).rejects.toThrow('Session ghost not found');
  });
});