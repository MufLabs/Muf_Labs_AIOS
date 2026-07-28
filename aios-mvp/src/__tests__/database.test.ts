import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { AppDatabase } from '../core/Database.js';

let db: AppDatabase;

beforeEach(async () => {
  AppDatabase.resetInstance();
  await AppDatabase.initialize();
  db = AppDatabase.getInstance();
  db.initializeSchema();
});

afterAll(() => {
  AppDatabase.resetInstance();
});

describe('AppDatabase', () => {
  it('should be a singleton', () => {
    const db2 = AppDatabase.getInstance();
    expect(db2).toBe(db);
  });

  it('should create sessions table', () => {
    const result = db.get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
    );
    expect(result?.name).toBe('sessions');
  });

  it('should create workflows table', () => {
    const result = db.get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='workflows'"
    );
    expect(result?.name).toBe('workflows');
  });

  it('should create engineering_objects table', () => {
    const result = db.get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='engineering_objects'"
    );
    expect(result?.name).toBe('engineering_objects');
  });

  it('should insert and select a row', () => {
    db.run(
      `INSERT INTO sessions (id, user_id, status, context_json, config_json, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['test-id', 'test-user', 'active', '{}', '{}', '{}']
    );

    const row = db.get<{ id: string; user_id: string }>(
      'SELECT id, user_id FROM sessions WHERE id = ?',
      ['test-id']
    );

    expect(row).toBeDefined();
    expect(row?.id).toBe('test-id');
    expect(row?.user_id).toBe('test-user');
  });

  it('should return undefined for missing row', () => {
    const row = db.get<{ id: string }>('SELECT id FROM sessions WHERE id = ?', ['nonexistent']);
    expect(row).toBeUndefined();
  });

  it('should select multiple rows', () => {
    for (const id of ['id-1', 'id-2']) {
      db.run(
        `INSERT INTO sessions (id, user_id, status, context_json, config_json, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, 'user', 'active', '{}', '{}', '{}']
      );
    }

    const rows = db.all<{ id: string }>('SELECT id FROM sessions ORDER BY id');
    expect(rows.length).toBe(2);
    expect(rows[0].id).toBe('id-1');
    expect(rows[1].id).toBe('id-2');
  });

  it('should support transactions', () => {
    const result = db.transaction(() => {
      db.run(
        `INSERT INTO sessions (id, user_id, status, context_json, config_json, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['tx-id', 'tx-user', 'active', '{}', '{}', '{}']
      );
      return 'done';
    });

    expect(result).toBe('done');

    const row = db.get<{ id: string }>('SELECT id FROM sessions WHERE id = ?', ['tx-id']);
    expect(row?.id).toBe('tx-id');
  });

  it('should rollback transaction on error', () => {
    expect(() => {
      db.transaction(() => {
        db.run(
          `INSERT INTO sessions (id, user_id, status, context_json, config_json, metadata_json)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['rollback-id', 'rollback-user', 'active', '{}', '{}', '{}']
        );
        throw new Error('force rollback');
      });
    }).toThrow('force rollback');

    const row = db.get<{ id: string }>('SELECT id FROM sessions WHERE id = ?', ['rollback-id']);
    expect(row).toBeUndefined();
  });
});