/**
 * Tests for scripts/setup-tbit-secret.mjs (T-Bit local secret bootstrap).
 *
 * Focus is on the deterministic, idempotent, single-key-invariant behavior
 * plus the "never print a secret" guarantee.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSecretEnv, runBootstrap } from '../scripts/setup-tbit-secret.mjs';

const REQUIRED = [
  'TBIT_API_KEY',
  'VITE_TBIT_API_KEY',
  'TBIT_HMAC_SECRET',
  'TBIT_HMAC_KEY_ID',
  'TBIT_ENCRYPTION_SECRET',
  'TBIT_ENCRYPTION_KEY_ID',
];

function parseVars(content) {
  const map = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    map[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return map;
}

describe('setup-tbit-secret', () => {
  let dir;
  const envPath = () => join(dir, '.env');

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'tbit-secret-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('1. first run generates all required secrets with TBIT_API_KEY === VITE_TBIT_API_KEY', () => {
    const { content, created } = buildSecretEnv('');
    expect(created).toBe(true);
    const vars = parseVars(content);
    for (const key of REQUIRED) {
      expect(vars[key], `missing ${key}`).toBeTruthy();
    }
    expect(vars.TBIT_API_KEY).toBe(vars.VITE_TBIT_API_KEY);
    expect(vars.TBIT_HMAC_KEY_ID).toBe('primary');
    expect(vars.TBIT_ENCRYPTION_KEY_ID).toBe('primary');
    // 32 bytes hex -> 64 chars.
    expect(vars.TBIT_API_KEY.length).toBe(64);
    expect(vars.TBIT_HMAC_SECRET.length).toBe(64);
    expect(vars.TBIT_ENCRYPTION_SECRET.length).toBe(64);
    // Independent secrets must differ from each other and from the API key.
    expect(vars.TBIT_HMAC_SECRET).not.toBe(vars.TBIT_ENCRYPTION_SECRET);
    expect(vars.TBIT_HMAC_SECRET).not.toBe(vars.TBIT_API_KEY);
    expect(vars.TBIT_ENCRYPTION_SECRET).not.toBe(vars.TBIT_API_KEY);
  });

  it('2. second run preserves all secrets', () => {
    const first = buildSecretEnv('').content;
    const varsFirst = parseVars(first);
    const second = buildSecretEnv(first).content;
    const varsSecond = parseVars(second);
    for (const key of REQUIRED) {
      expect(varsSecond[key]).toBe(varsFirst[key]);
    }
  });

  it('3. only TBIT_API_KEY exists -> VITE_TBIT_API_KEY is synchronized without another key generation', () => {
    const prefix = 'TBIT_API_KEY=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef\n';
    const { content } = buildSecretEnv(prefix);
    const vars = parseVars(content);
    expect(vars.TBIT_API_KEY).toBe('deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    expect(vars.VITE_TBIT_API_KEY).toBe(vars.TBIT_API_KEY);
  });

  it('4. only VITE_TBIT_API_KEY exists -> TBIT_API_KEY is synchronized', () => {
    const prefix = 'VITE_TBIT_API_KEY=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef\n';
    const { content } = buildSecretEnv(prefix);
    const vars = parseVars(content);
    expect(vars.VITE_TBIT_API_KEY).toBe('deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    expect(vars.TBIT_API_KEY).toBe(vars.VITE_TBIT_API_KEY);
  });

  it('5. both exist and match -> preserved', () => {
    const same =
      'TBIT_API_KEY=same123same123same123same123same123same123same123same\n' +
      'VITE_TBIT_API_KEY=same123same123same123same123same123same123same123same\n';
    const { content } = buildSecretEnv(same);
    const vars = parseVars(content);
    // In-place update keeps the (identical) values and both keys present.
    expect(vars.TBIT_API_KEY).toBe('same123same123same123same123same123same123same123same');
    expect(vars.VITE_TBIT_API_KEY).toBe(vars.TBIT_API_KEY);
  });

  it('6. both exist and differ -> fail without changing either', () => {
    const conflict =
      'TBIT_API_KEY=aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa11\n' +
      'VITE_TBIT_API_KEY=bbbb2222bbbb2222bbbb2222bbbb2222bbbb2222bbbb2222bbbb\n';
    expect(() => buildSecretEnv(conflict)).toThrow(/DIFFER/);
    // runBootstrap should throw too and leave the file untouched.
    writeFileSync(envPath(), conflict, 'utf8');
    expect(() => runBootstrap(envPath())).toThrow(/DIFFER/);
    expect(readFileSync(envPath(), 'utf8')).toBe(conflict);
  });

  it('7. missing HMAC secret -> generated while preserving the rest', () => {
    const incomplete =
      'TBIT_API_KEY=abc123abc123abc123abc123abc123abc123abc123abc123abc1\n' +
      'VITE_TBIT_API_KEY=abc123abc123abc123abc123abc123abc123abc123abc123abc1\n' +
      'TBIT_HMAC_KEY_ID=primary\n' +
      'TBIT_ENCRYPTION_SECRET=encSecretEncSecretEncSecretEncSecretEncSecretx\n' +
      'TBIT_ENCRYPTION_KEY_ID=primary\n';
    const { content } = buildSecretEnv(incomplete);
    const vars = parseVars(content);
    expect(vars.TBIT_HMAC_SECRET).toBeTruthy();
    expect(vars.TBIT_HMAC_SECRET.length).toBe(64);
    // Existing ENCRYPTION secret preserved.
    expect(vars.TBIT_ENCRYPTION_SECRET).toBe('encSecretEncSecretEncSecretEncSecretEncSecretx');
    // API key pair preserved and identical.
    expect(vars.TBIT_API_KEY).toBe(vars.VITE_TBIT_API_KEY);
  });

  it('8. missing encryption secret -> generated while preserving the rest', () => {
    const incomplete =
      'TBIT_API_KEY=abc123abc123abc123abc123abc123abc123abc123abc123abc1\n' +
      'VITE_TBIT_API_KEY=abc123abc123abc123abc123abc123abc123abc123abc123abc1\n' +
      'TBIT_HMAC_SECRET=hmacSecretHmacSecretHmacSecretHmacSecretHmacSecretz\n' +
      'TBIT_HMAC_KEY_ID=primary\n' +
      'TBIT_ENCRYPTION_KEY_ID=primary\n';
    const { content } = buildSecretEnv(incomplete);
    const vars = parseVars(content);
    expect(vars.TBIT_ENCRYPTION_SECRET).toBeTruthy();
    expect(vars.TBIT_ENCRYPTION_SECRET.length).toBe(64);
    // Existing HMAC secret preserved.
    expect(vars.TBIT_HMAC_SECRET).toBe('hmacSecretHmacSecretHmacSecretHmacSecretHmacSecretz');
  });

  it('9. unrelated .env variables and comments are preserved', () => {
    const existing =
      '# a header comment\n' +
      'PORT=3001\n' +
      'CORS_ORIGIN=http://localhost:3000\n' +
      'TBIT_VAULT_ROOT=/data/spaces\n' +
      '# trailing comment\n';
    const { content } = buildSecretEnv(existing);
    const vars = parseVars(content);
    expect(vars.PORT).toBe('3001');
    expect(vars.CORS_ORIGIN).toBe('http://localhost:3000');
    expect(vars.TBIT_VAULT_ROOT).toBe('/data/spaces');
    expect(content).toContain('# a header comment');
    expect(content).toContain('# trailing comment');
    // And it still produced the T-Bit block.
    expect(vars.TBIT_API_KEY).toBeTruthy();
    expect(vars.TBIT_API_KEY).toBe(vars.VITE_TBIT_API_KEY);
  });

  it('10. no secret values are printed (runBootstrap on a fresh file)', () => {
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => logs.push(args.join(' '));
    console.error = (...args) => logs.push(args.join(' '));
    try {
      runBootstrap(envPath());
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
    expect(existsSync(envPath())).toBe(true);
    const vars = parseVars(readFileSync(envPath(), 'utf8'));
    const joined = logs.join('\n');
    for (const key of REQUIRED) {
      const value = vars[key];
      if (value) {
        expect(joined).not.toContain(value);
      }
    }
  });
});