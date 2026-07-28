// Express App Setup - MufLabs AIOS MVP
// Configuración del servidor Express con middleware y rutas

import express from 'express';
import cors from 'cors';
import sessionRoutes from './session.routes.js';
import workflowRoutes from './workflow.routes.js';
import agentRoutes from './agent.routes.js';
import { AppDatabase } from '../core/Database.js';
import { EventBus } from '../core/EventBus.js';
import type { HealthResponse } from '../types/api.js';

export function createApp(dbPath?: string): express.Application {
  const app = express();

  // ─── Middleware ───
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── Request Logging ───
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // ─── Initialize Database ───
  try {
    const dbConfig = { dbPath: dbPath || './data/aios-mvp.db' };
    AppDatabase.getInstance(dbConfig);
    AppDatabase.getInstance().initializeSchema();
    console.log('[DB] SQLite database initialized');
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }

  // ─── Initialize EventBus ───
  EventBus.getInstance();
  console.log('[EventBus] System initialized');

  // ─── Routes ───
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/workflows', workflowRoutes);
  app.use('/api/agents', agentRoutes);

  // ─── Health Check ───
  app.get('/api/health', (_req, res) => {
    const health: HealthResponse = {
      status: 'ok',
      version: '0.1.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
    res.json(health);
  });

  // ─── 404 Handler ───
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist' },
    });
  });

  // ─── Error Handler ───
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred' },
    });
  });

  return app;
}