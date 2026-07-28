// Database - MufLabs AIOS MVP
// Capa de base de datos SQLite vía sql.js (pure JS/WASM, no native dependencies)
// Replaces better-sqlite3 which requires native compilation unavailable on Node v24.x without VS Build Tools

import initSqlJs from 'sql.js';
import type { SqlJsStatic, Database as SqlJsDatabase } from 'sql.js';

// ─── Types matching better-sqlite3 interface ───

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface DatabaseConfig {
  dbPath?: string;
  migrationsDir?: string;
}

// ─── AppDatabase Singleton ───

export class AppDatabase {
  private db: SqlJsDatabase;
  private static instance: AppDatabase | null = null;
  private static SQL: SqlJsStatic | null = null;
  private static initPromise: Promise<void> | null = null;

  // ─── Lifecycle ───

  /**
   * Initialize the SQL.js WASM runtime.
   * Must be awaited before any call to getInstance().
   * Safe to call multiple times.
   */
  static async initialize(): Promise<void> {
    if (AppDatabase.SQL) return;
    if (AppDatabase.initPromise) return AppDatabase.initPromise;

    AppDatabase.initPromise = (async () => {
      AppDatabase.SQL = await initSqlJs();
    })();

    return AppDatabase.initPromise;
  }

  /**
   * Returns the singleton instance. The first call must happen after initialize().
   * All subsequent calls are synchronous.
   */
  static getInstance(_config?: DatabaseConfig): AppDatabase {
    if (!AppDatabase.instance) {
      if (!AppDatabase.SQL) {
        throw new Error(
          'AppDatabase not initialized. Call AppDatabase.initialize() before getInstance().'
        );
      }
      AppDatabase.instance = new AppDatabase(AppDatabase.SQL);
    }
    return AppDatabase.instance;
  }

  /**
   * Reset singleton (useful in tests between cases).
   */
  static resetInstance(): void {
    if (AppDatabase.instance) {
      AppDatabase.instance.db.close();
      AppDatabase.instance = null;
    }
  }

  private constructor(SQL: SqlJsStatic) {
    // Always in-memory for MVP. Later: load from file if dbPath provided.
    this.db = new SQL.Database();
    this.db.run('PRAGMA journal_mode = WAL');
    this.db.run('PRAGMA foreign_keys = ON');
  }

  // ─── Public API ───

  getDb(): SqlJsDatabase {
    return this.db;
  }

  /**
   * Run a SQL statement (INSERT, UPDATE, DELETE, CREATE, etc.)
   */
  run(sql: string, params?: unknown[]): RunResult {
    this.db.run(sql, params);
    return {
      changes: this.db.getRowsModified(),
      lastInsertRowid: 0, // sql.js does not expose lastInsertRowid trivially
    };
  }

  /**
   * Get a single row from a SELECT query.
   * Returns undefined if no rows match.
   */
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | undefined {
    const stmt = this.db.prepare(sql);
    if (params) stmt.bind(params as any);
    const result: T | undefined = stmt.step() ? (stmt.getAsObject() as T) : undefined;
    stmt.free();
    return result;
  }

  /**
   * Get all rows from a SELECT query.
   */
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
    const stmt = this.db.prepare(sql);
    if (params) stmt.bind(params as any);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  /**
   * Execute a function within a transaction.
   */
  transaction<T>(fn: () => T): T {
    this.db.run('BEGIN TRANSACTION');
    try {
      const result = fn();
      this.db.run('COMMIT');
      return result;
    } catch (err) {
      this.db.run('ROLLBACK');
      throw err;
    }
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }

  // ─── Schema ───

  initializeSchema(): void {
    this.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        context_json TEXT NOT NULL DEFAULT '{}',
        config_json TEXT NOT NULL DEFAULT '{}',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    this.run(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        command TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'created',
        steps_json TEXT NOT NULL DEFAULT '[]',
        current_step_index INTEGER NOT NULL DEFAULT 0,
        context_json TEXT NOT NULL DEFAULT '{}',
        result_json TEXT,
        error_json TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    this.run(`
      CREATE TABLE IF NOT EXISTS engineering_objects (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        content TEXT NOT NULL,
        hash TEXT NOT NULL,
        owner TEXT NOT NULL,
        workflow_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        relations_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (workflow_id) REFERENCES workflows(id),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    this.run(`CREATE INDEX IF NOT EXISTS idx_workflows_session ON workflows(session_id)`);
    this.run(`CREATE INDEX IF NOT EXISTS idx_objects_session ON engineering_objects(session_id)`);
    this.run(`CREATE INDEX IF NOT EXISTS idx_objects_workflow ON engineering_objects(workflow_id)`);
  }
}