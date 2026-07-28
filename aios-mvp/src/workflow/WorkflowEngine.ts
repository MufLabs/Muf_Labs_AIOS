// WorkflowEngine - MufLabs AIOS MVP
// Orchestrator del ciclo de vida de workflows: analyze, implement, document

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '../core/EventBus.js';
import { MemoryStore } from '../core/MemoryStore.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';
import type { IWorkflowEngine, IAgent } from '../types/index.js';
import type {
  WorkflowInstance,
  WorkflowStep,
  WorkflowState,
  WorkflowEvent,
  WorkflowEventHandler,
  EngineeringCommand,
  EngineeringResult,
  EngineeringError,
  StepResult,
  CreateWorkflowDTO,
} from '../types/workflow.js';
import type { EngineeringContext } from '../types/session.js';
import type { ExecutionContext, ExecutionResult } from '../types/agent.js';

export class WorkflowEngine implements IWorkflowEngine {
  private memoryStore: MemoryStore;
  private eventBus: EventBus;
  private agentRegistry: AgentRegistry;
  private activeWorkflows: Map<string, AbortController>;

  constructor() {
    this.memoryStore = new MemoryStore();
    this.eventBus = EventBus.getInstance();
    this.agentRegistry = AgentRegistry.getInstance();
    this.activeWorkflows = new Map();
  }

  async createWorkflow(
    sessionId: string,
    command: EngineeringCommand,
    context: EngineeringContext
  ): Promise<WorkflowInstance> {
    const id = uuidv4();
    const steps = this.getStepsForCommand(command);

    const workflow: WorkflowInstance = {
      id,
      sessionId,
      command,
      state: 'created',
      steps,
      currentStepIndex: 0,
      context,
      result: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.memoryStore.saveWorkflow(workflow);
    this.emitEvent('workflow:created', workflow);

    return workflow;
  }

  async executeStep(workflowId: string, stepIndex: number): Promise<StepResult> {
    const workflow = await this.memoryStore.getWorkflow(workflowId);
    if (!workflow) {
      return {
        stepIndex,
        success: false,
        error: { code: 'WORKFLOW_NOT_FOUND', message: `Workflow ${workflowId} not found` },
      };
    }

    const step = workflow.steps[stepIndex];
    if (!step) {
      return {
        stepIndex,
        success: false,
        error: { code: 'STEP_NOT_FOUND', message: `Step ${stepIndex} not found` },
      };
    }

    // Update step status
    step.status = 'running';
    step.startedAt = new Date();
    workflow.currentStepIndex = stepIndex;
    workflow.state = 'executing';
    workflow.updatedAt = new Date();

    await this.memoryStore.saveWorkflow(workflow);
    this.emitEvent('workflow:started', workflow);

    try {
      // Find agent that can handle this command
      const agent = this.agentRegistry.findAgent(workflow.command);
      if (!agent) {
        throw new Error(`No agent available for command: ${workflow.command}`);
      }

      // Build execution context
      const execContext: ExecutionContext = {
        command: workflow.command,
        sessionId: workflow.sessionId,
        workflowId: workflow.id,
        projectPath: workflow.context.projectPath || '',
        userPrompt: step.name,
        engineeringContext: workflow.context,
        previousResults: workflow.result ? [workflow.result] : [],
        config: {
          provider: this.getProviderFromConfig(workflow),
          temperature: 0.3,
        },
      };

      // Execute agent
      const result = await agent.execute(execContext);

      // Update workflow with results
      step.status = 'completed';
      step.completedAt = new Date();
      step.result = result;

      workflow.result = this.buildEngineeringResult(result, workflow);

      // Check if all steps are done or if we need review
      if (stepIndex < workflow.steps.length - 1) {
        workflow.state = 'review';
        workflow.currentStepIndex = stepIndex + 1;
      } else {
        workflow.state = 'completed';
      }

      workflow.updatedAt = new Date();
      await this.memoryStore.saveWorkflow(workflow);

      this.emitEvent('workflow:step_completed', workflow);
      if (workflow.state === 'completed') {
        this.emitEvent('workflow:completed', workflow);
      }

      // Save objects created by agent
      for (const objId of result.objects) {
        const existingObj = await this.memoryStore.getObjectById(objId);
        if (existingObj) {
          await this.memoryStore.saveObject(existingObj);
        }
      }

      return {
        stepIndex,
        success: true,
        data: result,
      };
    } catch (err) {
      const error: EngineeringError = {
        code: 'EXECUTION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error during execution',
        step: stepIndex,
      };

      step.status = 'failed';
      workflow.state = 'failed';
      workflow.error = error;
      workflow.updatedAt = new Date();

      await this.memoryStore.saveWorkflow(workflow);
      this.emitEvent('workflow:failed', workflow);

      return {
        stepIndex,
        success: false,
        error,
      };
    }
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.memoryStore.getWorkflow(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    workflow.state = 'cancelled'; // In MVP, pause is treated as soft cancel
    workflow.updatedAt = new Date();
    await this.memoryStore.saveWorkflow(workflow);
    this.emitEvent('workflow:paused', workflow);
  }

  async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.memoryStore.getWorkflow(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    workflow.state = 'executing';
    workflow.updatedAt = new Date();
    await this.memoryStore.saveWorkflow(workflow);
    this.emitEvent('workflow:started', workflow);
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.memoryStore.getWorkflow(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    workflow.state = 'cancelled';
    workflow.updatedAt = new Date();
    await this.memoryStore.saveWorkflow(workflow);
    this.emitEvent('workflow:cancelled', workflow);

    // Abort any active execution
    const controller = this.activeWorkflows.get(workflowId);
    if (controller) {
      controller.abort();
      this.activeWorkflows.delete(workflowId);
    }
  }

  async getWorkflowState(workflowId: string): Promise<WorkflowInstance> {
    const workflow = await this.memoryStore.getWorkflow(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
    return workflow;
  }

  on(event: WorkflowEvent, handler: WorkflowEventHandler): void {
    this.eventBus.subscribe(event as any, (message: any) => {
      if (message.payload?.workflow) {
        handler(message.payload.workflow);
      }
    });
  }

  // ─── Private Helpers ───

  private getStepsForCommand(command: EngineeringCommand): WorkflowStep[] {
    const baseSteps: WorkflowStep[] = [
      { index: 0, name: 'context_assembly', status: 'pending', handler: 'assemblyContext' },
    ];

    switch (command) {
      case 'analyze':
        baseSteps.push(
          { index: 1, name: 'repository_scan', status: 'pending', handler: 'scanRepository' },
          { index: 2, name: 'codebase_analysis', status: 'pending', handler: 'analyzeCodebase' },
          { index: 3, name: 'report_generation', status: 'pending', handler: 'generateReport' }
        );
        break;

      case 'implement':
        baseSteps.push(
          { index: 1, name: 'requirement_analysis', status: 'pending', handler: 'analyzeRequirements' },
          { index: 2, name: 'implementation', status: 'pending', handler: 'writeCode' },
          { index: 3, name: 'code_review', status: 'pending', handler: 'reviewCode' }
        );
        break;

      case 'document':
        baseSteps.push(
          { index: 1, name: 'code_understanding', status: 'pending', handler: 'understandCode' },
          { index: 2, name: 'doc_generation', status: 'pending', handler: 'generateDocs' },
          { index: 3, name: 'doc_review', status: 'pending', handler: 'reviewDocs' }
        );
        break;
    }

    return baseSteps;
  }

  private buildEngineeringResult(
    execResult: ExecutionResult,
    workflow: WorkflowInstance
  ): EngineeringResult {
    return {
      summary: execResult.summary,
      objects: execResult.objects,
      metrics: {
        duration: execResult.metrics.duration,
        stepsCompleted: workflow.currentStepIndex + 1,
        tokensUsed: execResult.metrics.tokensUsed,
        cost: execResult.metrics.cost,
      },
      artifacts: execResult.artifacts,
    };
  }

  private getProviderFromConfig(workflow: WorkflowInstance): string {
    return workflow.config?.preferredProvider || 'auto';
  }

  private emitEvent(event: WorkflowEvent, workflow: WorkflowInstance): void {
    const message = EventBus.createMessage(
      'event',
      'workflow-engine',
      'ui',
      { workflow, event, state: workflow.state },
      workflow.id
    );
    this.eventBus.publish(event as any, message);
  }
}