#!/usr/bin/env node
/**
 * T-Bit Local Secret Bootstrap
 * ---------------------------------------------------------------------------
 * Restores the original T-Bit behavior inside the MUF Labs monorepo:
 * the T-Bit local API key is an *installation-level* credential, generated
 * automatically, persisted in the canonical root `.env`, and shared verbatim
 * between the API (`TBIT_API_KEY`) and the web app (`VITE_TBIT_API_KEY`).
 *
 * The user is NEVER asked to create, enter, copy, paste or configure the key.
 *
 * Guarantees:
 *  - Dependency-free, Node-native, deterministic and idempotent.
 *  - TBIT_API_KEY and VITE_TBIT_API_KEY always carry the SAME value.
 *  - Existing values are preserved; only missing secrets are generated.
 *  - HMAC and encryption secrets are generated independently.
 *  - Unknown variables and comments in an existing `.env` are preserved.
 *  - No secret value is ever printed to stdout or stderr.
 *  - Fail-closed on conflicting API-key values.
 *
 * Run directly:  node scripts/setup-tbit-secret.mjs
 * Or import:     import { runBootstrap } from "./setup-tbit-secret.mjs";
 */
import { existsSync, readFileSync, writeFileSync, renameSync, mkdtempSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Number of random bytes for TBIT_API_KEY (hex encoded -> 64 chars). */
const API_KEY_BYTES = 32;
/** Number of random bytes for the HMAC and encryption secrets (hex -> 64 chars). */
const SECRET_BYTES = 32;

/** The keys whose values are required for a complete local installation. */
const REQUIRED_KEYS = [
  "TBIT_API_KEY",
  "VITE_TBIT_API_KEY",
  "TBIT_HMAC_SECRET",
  "TBIT_HMAC_KEY_ID",
  "TBIT_ENCRYPTION_SECRET",
  "TBIT_ENCRYPTION_KEY_ID",
];

/**
 * Parse a `.env` string into entries, preserving whitespace, comments and order.
 *
 * @param {string} content
 * @returns {Array<{kind:"comment"|"blank"|"assign", raw:string, key?:string, value?:string}>}
 */
function parseEnv(content) {
  // Split preserving internal blank lines, but drop the trailing empty strings
  // produced by a final newline so a round-trip does not accumulate newlines.
  const lines = content.split(/\r?\n/);
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  const entries = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      entries.push({ kind: "blank", raw });
      continue;
    }
    if (trimmed.startsWith("#")) {
      entries.push({ kind: "comment", raw });
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      // Not a valid assignment; keep it verbatim so nothing is lost.
      entries.push({ kind: "comment", raw });
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      if (value.length >= 2) {
        value = value.slice(1, -1);
      }
    }
    entries.push({ kind: "assign", raw, key, value });
  }
  return entries;
}

/**
 * Build the canonical new content for the root `.env`.
 * Pure function: no filesystem side effects, easy to unit-test.
 *
 * Strategy: keep every existing entry in its original position, updating the
 * value of the six T-Bit keys in place; append only keys that are missing.
 * This makes the transform order-stable and idempotent across runs.
 *
 * @param {string} existingContent existing `.env` content, or "" if none
 * @returns {{content:string, created:boolean}} new content and whether it is a fresh file
 */
export function buildSecretEnv(existingContent) {
  const entries = existingContent ? parseEnv(existingContent) : [];
  const entryByKey = new Map(
    entries.filter((e) => e.kind === "assign").map((e) => [e.key, e])
  );

  const getValue = (key) => (entryByKey.has(key) ? entryByKey.get(key).value : undefined);

  // ---- Resolve the shared API key pair (single-key invariant) ----
  const apiKeyOnDisk = getValue("TBIT_API_KEY");
  const viteKeyOnDisk = getValue("VITE_TBIT_API_KEY");

  if (
    apiKeyOnDisk !== undefined &&
    viteKeyOnDisk !== undefined &&
    apiKeyOnDisk !== viteKeyOnDisk
  ) {
    throw new Error(
      "setup-tbit-secret: TBIT_API_KEY and VITE_TBIT_API_KEY are BOTH present in .env but DIFFER. " +
        "Refusing to proceed so a second API key is never silently created. " +
        "Resolve the conflict (they must be identical) and re-run."
    );
  }

  // Never generate a second API key; promote whichever exists, else create fresh.
  let apiKey;
  if (apiKeyOnDisk !== undefined) {
    apiKey = apiKeyOnDisk;
  } else if (viteKeyOnDisk !== undefined) {
    apiKey = viteKeyOnDisk;
  } else {
    apiKey = randomBytes(API_KEY_BYTES).toString("hex");
  }

  // ---- Independent HMAC and encryption secrets ----
  const hmacSecret =
    getValue("TBIT_HMAC_SECRET") ?? randomBytes(SECRET_BYTES).toString("hex");
  const hmacKeyId = getValue("TBIT_HMAC_KEY_ID") ?? "primary";
  const encSecret =
    getValue("TBIT_ENCRYPTION_SECRET") ?? randomBytes(SECRET_BYTES).toString("hex");
  const encKeyId = getValue("TBIT_ENCRYPTION_KEY_ID") ?? "primary";

  // ---- Desired values for every T-Bit key ----
  const desired = new Map([
    ["TBIT_HMAC_SECRET", hmacSecret],
    ["TBIT_HMAC_KEY_ID", hmacKeyId],
    ["TBIT_ENCRYPTION_SECRET", encSecret],
    ["TBIT_ENCRYPTION_KEY_ID", encKeyId],
    ["TBIT_API_KEY", apiKey],
    ["VITE_TBIT_API_KEY", apiKey],
  ]);
  const desiredKeys = [...desired.keys()];

  // ---- Emit entries in original order, updating T-Bit keys in place ----
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    if (entry.kind === "assign" && desired.has(entry.key)) {
      out.push(`${entry.key}=${desired.get(entry.key)}`);
      seen.add(entry.key);
    } else {
      out.push(entry.raw);
    }
  }

  // ---- Append any desired keys not present ----
  const missing = desiredKeys.filter((k) => !seen.has(k));
  if (missing.length > 0) {
    // Separate the appended block from existing content with a blank line only
    // if there is real non-blank content before it.
    const hasContent = out.some((l) => l.trim().length > 0 && !l.trim().startsWith("#"));
    if (hasContent && out.length > 0) {
      out.push("");
    }
    for (const key of missing) {
      out.push(`${key}=${desired.get(key)}`);
    }
  }

  return { content: out.join("\n") + "\n", created: !existingContent };
}

/**
 * Run the bootstrap against a specific canonical `.env` path.
 * Writes atomically (temp file + rename, with a guarded fallback for Windows).
 *
 * @param {string} envPath absolute path to the canonical `.env`
 * @returns {{created:boolean, wrote:boolean, required:string[]}}
 */
export function runBootstrap(envPath) {
  const existingContent = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const { content, created } = buildSecretEnv(existingContent);

  const dir = dirname(envPath);
  if (!existsSync(dir)) {
    throw new Error(
      `setup-tbit-secret: directory does not exist: ${dir}. Cannot write the canonical .env.`
    );
  }

  const onDiskNormalized = existingContent.replace(/\r\n/g, "\n");
  let wrote = onDiskNormalized !== content;

  if (existsSync(envPath) && onDiskNormalized === content) {
    // Nothing to change on an existing, already-complete file.
    wrote = false;
  }

  // Atomic write: temp file in same dir, then rename into place.
  if (wrote || created) {
    const tmpDir = mkdtempSync(join(dir, ".env-setup-"));
    const tmpPath = join(tmpDir, basename(envPath));
    writeFileSync(tmpPath, content, "utf8");
    try {
      renameSync(tmpPath, envPath);
    } catch {
      // On Windows renameSync over an existing file may throw; guarded direct write.
      writeFileSync(envPath, content, "utf8");
    } finally {
      // Best-effort cleanup of the temp directory.
      import("node:fs")
        .then((fs) => {
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch {}
        })
        .catch(() => {});
    }
  }

  return { created, wrote, required: REQUIRED_KEYS.slice() };
}

/**
 * CLI entrypoint (runs only when executed directly).
 */
function main() {
  const envPath = resolve(__dirname, "..", ".env");
  const result = runBootstrap(envPath);

  if (result.created) {
    console.log("setup-tbit-secret: created .env with generated T-Bit local secrets.");
  } else if (result.wrote) {
    console.log("setup-tbit-secret: updated .env (missing secrets filled; existing preserved).");
  } else {
    console.log("setup-tbit-secret: .env already complete; all secrets preserved.");
  }
  // No secret value is ever printed.
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(join(__dirname, "setup-tbit-secret.mjs"));

if (isDirectRun) {
  main();
}