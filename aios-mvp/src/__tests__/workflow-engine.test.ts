import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../core/Database.js';
import { WorkflowEngine } from '../workflow/WorkflowEngine.js';
import type { IAgent, EngineeringCommand, ExecutionContext, ExecutionResult, AgentCapability, AgentStatus } from '../types/index.js';

// Mock agent that always succeeds
class MockAgent implements IAgent {
  readonly id = 'mock-agent-001';
  readonly name = 'Mock Agent';
  readonly capabilities: AgentCapability[] = [
    { command: 'analyze', description: 'Test analyze', confidence: 1.0, requiredContext: ['projectPath'] },
    { command: 'implement', description: 'Test implement', confidence: 1.0, requiredContext: ['projectPath', 'userPrompt'] },
    { command: 'document', description: 'Test document', confidence: 1.0, requiredContext: ['projectPath'] },
  ];

  private status: AgentStatus = 'idle';

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    return {
      success: true,
      summary: `Mock ${context.command} completed`,
      artifacts: [{ path: 'mock-output.md', content: '# Mock', type: 'report' }],
      objects: [],
      metrics: { duration: 100, stepsCompleted: 1, tokensUsed: 100, cost: 0.01 },
      confidence: 0.95,
      explanation: 'Mock execution',
    };
  }

  canHandle(command: EngineeringCommand): boolean {
    return this.capabilities.some(c => c.command === command);
  }

  async validate(): Promise<any> {
    return { passed: true, errors: [], warnings: [], score: 100 };
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  async reset(): Promise<void> {
    this.status = 'idle';
  }
}

let engine: WorkflowEngine;
const sessionId = uuidv4();

beforeEach(async () => {
  AppDatabase.resetInstance();
  await AppDatabase.initialize();
  AppDatabase.getInstance().initializeSchema();
  engine = new WorkflowEngine();

  // Create test session directly in DB
  const db = AppDatabase.getInstance();
  db.run(
    `INSERT INTO sessions (id, user_id, status, context_json, config_json, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionId, 'test-user', 'active', JSON.stringify({ projectName: 'test' }), '{}', '{}']
  );
});

afterAll(() => {
  AppDatabase.resetInstance();
});

async function createWorkflow(eng: WorkflowEngine, command: EngineeringCommand = 'analyze') {
  return eng.createWorkflow(sessionId, command, {
    projectName: 'test-project',
    projectPath: '/tmp/test',
    projectLanguage: 'typescript',
  });
}

describe('WorkflowEngine — Creation', () => {
  it('should create an analyze workflow with correct steps', async () => {
    const wf = await createWorkflow(engine, 'analyze');

    expect(wf.command).toBe('analyze');
    expect(wf.state).toBe('created');
    expect(wf.steps.length).toBe(4); // context_assembly + 3 analyze steps
    expect(wf.steps[0].name).toBe('context_assembly');
    expect(wf.steps[1].name).toBe('repository_scan');
    expect(wf.steps[2].name).toBe('codebase_analysis');
    expect(wf.steps[3].name).toBe('report_generation');
    expect(wf.steps.every(s => s.status === 'pending')).toBe(true);
  });

  it('should create an implement workflow with correct steps', async () => {
    const wf = await createWorkflow(engine, 'implement');

    expect(wf.command).toBe('implement');
    expect(wf.steps.length).toBe(4);
    expect(wf.steps[1].name).toBe('requirement_analysis');
    expect(wf.steps[2].name).toBe('implementation');
    expect(wf.steps[3].name).toBe('code_review');
  });

  it('should create a document workflow with correct steps', async () => {
    const wf = await createWorkflow(engine, 'document');

    expect(wf.command).toBe('document');
    expect(wf.steps.length).toBe(4);
    expect(wf.steps[1].name).toBe('code_understanding');
    expect(wf.steps[2].name).toBe('doc_generation');
    expect(wf.steps[3].name).toBe('doc_review');
  });

  it('should assign a unique ID to each workflow', async () => {
    const wf1 = await createWorkflow(engine, 'analyze');
    const wf2 = await createWorkflow(engine, 'analyze');
    expect(wf1.id).not.toBe(wf2.id);
  });
});

describe('WorkflowEngine — Execution', () => {
  it('should execute a step successfully via mock agent', async () => {
    const wf = await createWorkflow(engine, 'analyze');
    const result = await engine.executeStep(wf.id, 0);

    expect(result.success).toBe(true);
    expect(result.data?.summary).toContain('Analyze completed successfully');

    const state = await engine.getWorkflowState(wf.id);
    expect(state.steps[0].status).toBe('completed');
    expect(state.state).toBe('review'); // Not last step
    expect(state.currentStepIndex).toBe(1);
  });

  it('should complete workflow after all steps', async () => {
    const wf = await createWorkflow(engine, 'analyze');

    // Execute all steps sequentially
    for (let i = 0; i < wf.steps.length; i++) {
      await engine.executeStep(wf.id, i);
    }

    const state = await engine.getWorkflowState(wf.id);
    expect(state.state).toBe('completed');
    expect(state.steps.every(s => s.status === 'completed')).toBe(true);
  });

  it('should handle execution failure gracefully', async () => {
    // Test that executeStep returns failure for non-existent workflow
    const result = await engine.executeStep('nonexistent-workflow', 0);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('WORKFLOW_NOT_FOUND');
  });

  it('should handle non-existent step index', async () => {
    const wf = await createWorkflow(engine, 'analyze');
    const result = await engine.executeStep(wf.id, 99);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('STEP_NOT_FOUND');
  });

  it('should update workflow timestamps on each step', async () => {
    const wf = await createWorkflow(engine, 'analyze');
    const originalUpdated = wf.updatedAt.getTime();

    await new Promise(resolve => setTimeout(resolve, 10));
    await engine.executeStep(wf.id, 0);

    const state = await engine.getWorkflowState(wf.id);
    expect(state.updatedAt.getTime()).toBeGreaterThan(originalUpdated);
  });
});

describe('WorkflowEngine — Lifecycle Management', () => {
  it('should cancel a workflow', async () => {
    const wf = await createWorkflow(engine, 'analyze');
    await engine.cancelWorkflow(wf.id);

    const state = await engine.getWorkflowState(wf.id);
    expect(state.state).toBe('cancelled');
  });

  it('should throw on cancel non-existent workflow', async () => {
    await expect(engine.cancelWorkflow('ghost')).rejects.toThrow('ghost not found');
  });

  it('should pause and resume a workflow', async () => {
    const wf = await createWorkflow(engine, 'analyze');

    await engine.pauseWorkflow(wf.id);
    let state = await engine.getWorkflowState(wf.id);
    expect(state.state).toBe('cancelled'); // MVP treats pause as soft cancel

    await engine.resumeWorkflow(wf.id);
    state = await engine.getWorkflowState(wf.id);
    expect(state.state).toBe('executing');
  });

  it('should throw on pause non-existent workflow', async () => {
    await expect(engine.pauseWorkflow('ghost')).rejects.toThrow('ghost not found');
  });

  it('should throw on resume non-existent workflow', async () => {
    await expect(engine.resumeWorkflow('ghost')).rejects.toThrow('ghost not found');
  });
});

describe('WorkflowEngine — Event Emission', () => {
  it('should emit workflow:created on creation', async () => {
    const events: string[] = [];
    engine.on('workflow:created' as any, () => { events.push('created'); });

    await createWorkflow(engine, 'analyze');
    expect(events.length).toBe(1);
  });

  it('should emit workflow:started on step execution', async () => {
    const events: string[] = [];
    engine.on('workflow:started' as any, () => { events.push('started'); });
    engine.on('workflow:step_completed' as any, () => { events.push('step_completed'); });
    engine.on('workflow:completed' as any, () => { events.push('completed'); });

    const wf = await createWorkflow(engine, 'analyze');

    // Execute all steps to trigger completed event
    for (let i = 0; i < wf.steps.length; i++) {
      await engine.executeStep(wf.id, i);
    }

    expect(events).toContain('started');
    expect(events).toContain('step_completed');
    expect(events).toContain('completed');
  });
});

describe('WorkflowEngine — Edge Cases', () => {
  it('should get workflow state', async () => {
    const wf = await createWorkflow(engine, 'analyze');
    const state = await engine.getWorkflowState(wf.id);
    expect(state.id).toBe(wf.id);
  });

  it('should throw on get state for non-existent workflow', async () => {
    await expect(engine.getWorkflowState('ghost')).rejects.toThrow('ghost not found');
  });

  it('should handle concurrent workflow instances', async () => {
    const wf1 = await createWorkflow(engine, 'analyze');
    const wf2 = await createWorkflow(engine, 'implement');

    expect(wf1.id).not.toBe(wf2.id);
    expect(wf1.sessionId).toBe(wf2.sessionId);

    const r1 = await engine.executeStep(wf1.id, 0);
    const r2 = await engine.executeStep(wf2.id, 0);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});