// Agent Routes - MufLabs AIOS MVP
// REST endpoints para consulta de agentes

import { Router, Request, Response } from 'express';
import { AgentRegistry } from '../agents/AgentRegistry.js';
import type { AgentStatusResponse, ListAgentsResponse, ApiError } from '../types/api.js';

const router: Router = Router();
const agentRegistry = AgentRegistry.getInstance();

// GET /api/agents - List all registered agents
router.get('/', (_req: Request, res: Response<ListAgentsResponse | ApiError>) => {
  try {
    const agents = agentRegistry.listAgents();
    const agentStatuses: AgentStatusResponse[] = agents.map(agent => ({
      agentId: agent.id,
      name: agent.name,
      status: agent.getStatus(),
      capabilities: agent.capabilities.map(c => ({
        command: c.command,
        confidence: c.confidence,
      })),
    }));

    res.json({ agents: agentStatuses });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list agents' } });
  }
});

// GET /api/agents/:id - Get specific agent status
router.get('/:id', (req: Request<{ id: string }>, res: Response<AgentStatusResponse | ApiError>) => {
  try {
    const agent = agentRegistry.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ error: { code: 'AGENT_NOT_FOUND', message: `Agent ${req.params.id} not found` } });
      return;
    }

    res.json({
      agentId: agent.id,
      name: agent.name,
      status: agent.getStatus(),
      capabilities: agent.capabilities.map(c => ({
        command: c.command,
        confidence: c.confidence,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get agent' } });
  }
});

export default router;