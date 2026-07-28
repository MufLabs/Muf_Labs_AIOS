// Workflow Routes - MufLabs AIOS MVP
// REST endpoints para ejecución de workflows

import { Router, Request, Response } from 'express';
import { WorkflowEngine } from '../workflow/WorkflowEngine.js';
import { MemoryStore } from '../core/MemoryStore.js';
import type { EngineeringCommand } from '../types/workflow.js';
import type { ExecuteWorkflowRequest, ExecuteWorkflowResponse, GetWorkflowResponse, ListWorkflowsResponse, ApiError } from '../types/api.js';

const router: Router = Router();
const workflowEngine = new WorkflowEngine();
const memoryStore = new MemoryStore();

// POST /api/workflows - Execute a workflow command
router.post('/', async (req: Request<{}, {}, ExecuteWorkflowRequest>, res: Response<ExecuteWorkflowResponse | ApiError>) => {
  try {
    const { sessionId, command, userPrompt } = req.body;

    if (!sessionId || !command || !userPrompt) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'sessionId, command, and userPrompt are required' } });
      return;
    }

    if (!['analyze', 'implement', 'document'].includes(command)) {
      res.status(400).json({ error: { code: 'INVALID_COMMAND', message: `Invalid command '${command}'. Must be analyze, implement, or document` } });
      return;
    }

    // Get session context
    const session = await memoryStore.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: `Session ${sessionId} not found` } });
      return;
    }

    // Create workflow
    const workflow = await workflowEngine.createWorkflow(
      sessionId,
      command as EngineeringCommand,
      session.context
    );

    // Execute first step
    const stepResult = await workflowEngine.executeStep(workflow.id, 0);

    // Get updated workflow state
    const updatedWorkflow = await workflowEngine.getWorkflowState(workflow.id);

    // Record command in session context
    const prevCommands = session.context.previousCommands || [];
    prevCommands.push(`${command}: ${userPrompt}`);
    await memoryStore.updateContext(sessionId, { previousCommands: prevCommands });

    res.status(201).json({ workflow: updatedWorkflow });
  } catch (error) {
    res.status(500).json({ error: { code: 'EXECUTION_ERROR', message: error instanceof Error ? error.message : 'Workflow execution failed' } });
  }
});

// GET /api/workflows/:id - Get workflow state
router.get('/:id', async (req: Request<{ id: string }>, res: Response<GetWorkflowResponse | ApiError>) => {
  try {
    const workflow = await workflowEngine.getWorkflowState(req.params.id);
    res.json({ workflow });
  } catch (error) {
    res.status(404).json({ error: { code: 'WORKFLOW_NOT_FOUND', message: `Workflow ${req.params.id} not found` } });
  }
});

// GET /api/workflows - List workflows for a session
router.get('/', async (req: Request<{}, {}, {}, { sessionId?: string }>, res: Response<ListWorkflowsResponse | ApiError>) => {
  try {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: { code: 'MISSING_SESSION_ID', message: 'sessionId query parameter is required' } });
      return;
    }
    const workflows = await memoryStore.listWorkflows(sessionId);
    res.json({ workflows });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list workflows' } });
  }
});

// POST /api/workflows/:id/pause - Pause a workflow
router.post('/:id/pause', async (req: Request<{ id: string }>, res: Response<GetWorkflowResponse | ApiError>) => {
  try {
    await workflowEngine.pauseWorkflow(req.params.id);
    const workflow = await workflowEngine.getWorkflowState(req.params.id);
    res.json({ workflow });
  } catch (error) {
    res.status(404).json({ error: { code: 'WORKFLOW_NOT_FOUND', message: `Workflow ${req.params.id} not found` } });
  }
});

// POST /api/workflows/:id/cancel - Cancel a workflow
router.post('/:id/cancel', async (req: Request<{ id: string }>, res: Response<GetWorkflowResponse | ApiError>) => {
  try {
    await workflowEngine.cancelWorkflow(req.params.id);
    const workflow = await workflowEngine.getWorkflowState(req.params.id);
    res.json({ workflow });
  } catch (error) {
    res.status(404).json({ error: { code: 'WORKFLOW_NOT_FOUND', message: `Workflow ${req.params.id} not found` } });
  }
});

export default router;