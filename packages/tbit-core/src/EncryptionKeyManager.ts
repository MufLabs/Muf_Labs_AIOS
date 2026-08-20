import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { resolveActiveTBitDataPath } from "./tbitRuntimePaths.js";

export type EncryptionKeyMaterial = {
  id: string;
  secret: string;
  key: Buffer;
  active: boolean;
};

type StoredKeyRecord = {
  id: string;
  secret: string;
  active: boolean;
  createdAt: string;
};

type StoredKeyRing = {
  version: "encryption-keyring-v1";
  keys: StoredKeyRecord[];
};

function normalizeKeyId(value: string | undefined): string {
  return (value ?? "primary")
    .normalize("NFC")
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]+/g, "_")
    .slice(0, 48) || "primary";
}

function deriveKey(secret: string): Buffer {
  if (!secret || secret.length < 32) {
    throw new Error("CIFRADO_NO_DISPONIBLE: cada llave AES-GCM requiere un secreto de al menos 32 caracteres.");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

function parsePreviousSecrets(): EncryptionKeyMaterial[] {
  const raw = process.env.TBIT_ENCRYPTION_PREVIOUS_SECRETS?.trim();
  if (!raw) return [];

  return raw
    .split(/[;,]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separator = item.indexOf(":");
      if (separator <= 0) return null;
      const id = normalizeKeyId(item.slice(0, separator));
      const secret = item.slice(separator + 1);
      if (!secret || secret.length < 32) return null;
      return { id, secret, key: deriveKey(secret), active: false };
    })
    .filter((item): item is EncryptionKeyMaterial => Boolean(item));
}

const KEYRING_FILENAME = "encryption-keyring.json";

function keyringPath(): string {
  return resolveActiveTBitDataPath(KEYRING_FILENAME);
}

async function loadStoredKeyRing(): Promise<StoredKeyRing> {
  try {
    const text = await readFile(keyringPath(), "utf8");
    const parsed = JSON.parse(text) as StoredKeyRing;
    return { version: "encryption-keyring-v1", keys: parsed.keys ?? [] };
  } catch {
    return { version: "encryption-keyring-v1", keys: [] };
  }
}

async function saveStoredKeyRing(ring: StoredKeyRing): Promise<void> {
  const path = keyringPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(ring, null, 2), "utf8");
}

/**
 * Generate a new AES-256-GCM secret (48 url-safe chars) without touching env vars.
 * Used by the first-run setup flow when no env-provided key is configured.
 * Does NOT activate the key — call `activateStoredKey` afterwards.
 */
export async function generateEncryptionKey(keyId?: string): Promise<EncryptionKeyMaterial> {
  const id = normalizeKeyId(keyId ?? `key-${Date.now().toString(36)}`);
  const secret = randomBytes(36).toString("base64url");
  const ring = await loadStoredKeyRing();

  // Mark any existing keys as inactive, then append the new one as active.
  ring.keys = ring.keys.map((record) => ({ ...record, active: false }));
  ring.keys.push({ id, secret, active: true, createdAt: new Date().toISOString() });
  await saveStoredKeyRing(ring);

  return { id, secret, key: deriveKey(secret), active: true };
}

/**
 * Activate a previously stored key by id (deactivates the rest).
 */
export async function activateStoredKey(keyId: string): Promise<void> {
  const id = normalizeKeyId(keyId);
  const ring = await loadStoredKeyRing();
  if (!ring.keys.some((record) => record.id === id)) {
    throw new Error(`CIFRADO_LLAVE_NO_DISPONIBLE: no existe llave '${id}' en el keyring persistido.`);
  }
  ring.keys = ring.keys.map((record) => ({ ...record, active: record.id === id }));
  await saveStoredKeyRing(ring);
}

/**
 * Resolve the active encryption key, preferring a persisted (file) key over env vars.
 * Throws `CIFRADO_NO_DISPONIBLE` if neither source is configured.
 */
export async function getActiveEncryptionKeyAsync(): Promise<EncryptionKeyMaterial> {
  // 1) Try persisted keyring first (created by first-run setup)
  const ring = await loadStoredKeyRing();
  const activeStored = ring.keys.find((record) => record.active);
  if (activeStored && activeStored.secret.length >= 32) {
    return { id: activeStored.id, secret: activeStored.secret, key: deriveKey(activeStored.secret), active: true };
  }

  // 2) Fall back to env-var configured key (operator-managed deployments)
  const secret = process.env.TBIT_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CIFRADO_NO_DISPONIBLE: configura TBIT_ENCRYPTION_SECRET con al menos 32 caracteres o ejecuta el setup inicial.");
  }

  return {
    id: normalizeKeyId(process.env.TBIT_ENCRYPTION_KEY_ID ?? process.env.TBIT_ENCRYPTION_ACTIVE_KEY_ID),
    secret,
    key: deriveKey(secret),
    active: true,
  };
}

/**
 * Whether ANY encryption key is configured (env var or persisted keyring).
 * Used by the setup-status endpoint to decide if the wizard must run.
 */
export async function isEncryptionConfigured(): Promise<boolean> {
  const stored = await loadStoredKeyRing();
  if (stored.keys.some((record) => record.active && record.secret.length >= 32)) return true;
  const secret = process.env.TBIT_ENCRYPTION_SECRET;
  return Boolean(secret && secret.length >= 32);
}

export function getActiveEncryptionKey(): EncryptionKeyMaterial {
  const secret = process.env.TBIT_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CIFRADO_NO_DISPONIBLE: configura TBIT_ENCRYPTION_SECRET con al menos 32 caracteres.");
  }

  return {
    id: normalizeKeyId(process.env.TBIT_ENCRYPTION_KEY_ID ?? process.env.TBIT_ENCRYPTION_ACTIVE_KEY_ID),
    secret,
    key: deriveKey(secret),
    active: true,
  };
}

export function getEncryptionKeyRing(): EncryptionKeyMaterial[] {
  const active = getActiveEncryptionKey();
  const byId = new Map<string, EncryptionKeyMaterial>();
  byId.set(active.id, active);

  for (const previous of parsePreviousSecrets()) {
    if (!byId.has(previous.id)) byId.set(previous.id, previous);
  }

  return [...byId.values()];
}

export function getEncryptionKeyById(keyId: string): EncryptionKeyMaterial {
  const normalized = normalizeKeyId(keyId);
  const key = getEncryptionKeyRing().find((candidate) => candidate.id === normalized);
  if (!key) {
    throw new Error(`CIFRADO_LLAVE_NO_DISPONIBLE: no existe llave AES-GCM '${normalized}' en el keyring local.`);
  }
  return key;
}

export function getEncryptionKeyStatus() {
  const active = getActiveEncryptionKey();
  const ring = getEncryptionKeyRing();

  return {
    enabled: true,
    algorithm: "AES-256-GCM",
    activeKeyId: active.id,
    previousKeyIds: ring.filter((key) => !key.active).map((key) => key.id),
    keyCount: ring.length,
  };
}

