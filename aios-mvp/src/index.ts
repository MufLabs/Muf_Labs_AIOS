// AIOS MVP - Server Entry Point
// MufLabs AI System - Core Loop Implementation

import { AppDatabase } from './core/Database.js';
import { createApp } from './api/index.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const DB_PATH = process.env.DB_PATH || './data/aios-mvp.db';

async function startServer(): Promise<void> {
  try {
    // Initialize database (async: loads sql.js WASM)
    await AppDatabase.initialize();

    const app = createApp(DB_PATH);

    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════╗');
      console.log('║      MufLabs AIOS MVP - Running         ║');
      console.log('╠══════════════════════════════════════════╣');
      console.log(`║  Server:   http://localhost:${PORT}        ║`);
      console.log(`║  Health:   http://localhost:${PORT}/api/health ║`);
      console.log(`║  DB Path:  ${DB_PATH.padEnd(27)}║`);
      console.log('╚══════════════════════════════════════════╝');
      console.log('');
      console.log('Available Endpoints:');
      console.log('  POST /api/sessions              Create session');
      console.log('  GET  /api/sessions/:id          Get session');
      console.log('  GET  /api/sessions              List sessions (requires ?userId=)');
      console.log('  POST /api/workflows             Execute workflow');
      console.log('  GET  /api/workflows/:id         Get workflow state');
      console.log('  GET  /api/workflows             List workflows (requires ?sessionId=)');
      console.log('  GET  /api/agents                List agents');
      console.log('  GET  /api/agents/:id            Get agent status');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();