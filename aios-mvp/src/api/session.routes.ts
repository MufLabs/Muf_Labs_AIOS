// Session Routes - MufLabs AIOS MVP
// REST endpoints para gestión de sesiones

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MemoryStore } from '../core/MemoryStore.js';
import type { Session, SessionConfig, EngineeringContext, SessionStatus } from '../types/session.js';
import type { CreateSessionRequest, CreateSessionResponse, GetSessionResponse, ListSessionsResponse, ApiError } from '../types/api.js';

const router: Router = Router();
const memoryStore = new MemoryStore();

// POST /api/sessions - Create a new session
router.post('/', async (req: Request<{}, {}, CreateSessionRequest>, res: Response<CreateSessionResponse | ApiError>) => {
  try {
    const { userId, projectPath, autonomyLevel, preferredProvider } = req.body;

    if (!userId) {
      res.status(400).json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } });
      return;
    }

    const config: SessionConfig = {
      autonomyLevel: (autonomyLevel ?? 2) as 0 | 1 | 2 | 3 | 4,
      preferredProvider: preferredProvider || 'auto',
      executionProfile: 'quality',
      projectPath: projectPath || '',
    };

    const context: EngineeringContext = {
      projectName: projectPath?.split(/[/\\]/).pop() || 'untitled',
      projectPath: projectPath || '',
      projectDescription: '',
      languageDetected: [],
      frameworkDetected: [],
      dependencies: {},
      previousCommands: [],
      engineeringMemory: [],
    };

    const session: Session = {
      id: uuidv4(),
      userId,
      status: 'active',
      context,
      config,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await memoryStore.saveSession(session);

    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' } });
  }
});

// GET /api/sessions/:id - Get session by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response<GetSessionResponse | ApiError>) => {
  try {
    const session = await memoryStore.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: `Session ${req.params.id} not found` } });
      return;
    }
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get session' } });
  }
});

// GET /api/sessions - List sessions for a user
router.get('/', async (req: Request<{}, {}, {}, { userId?: string }>, res: Response<ListSessionsResponse | ApiError>) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      res.status(400).json({ error: { code: 'MISSING_USER_ID', message: 'userId query parameter is required' } });
      return;
    }
    const sessions = await memoryStore.listSessions(userId);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list sessions' } });
  }
});

// PATCH /api/sessions/:id/status - Update session status
router.patch('/:id/status', async (req: Request<{ id: string }, {}, { status: SessionStatus }>, res: Response<GetSessionResponse | ApiError>) => {
  try {
    const { status } = req.body;
    const session = await memoryStore.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: `Session ${req.params.id} not found` } });
      return;
    }
    await memoryStore.updateSessionStatus(req.params.id, status);
    const updated = await memoryStore.getSession(req.params.id);
    res.json({ session: updated! });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update session status' } });
  }
});

export default router;