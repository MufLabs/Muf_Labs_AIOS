/**
 * HMAC Secret Resolution — `@muf/tbit-core`
 *
 * Centralizes the derivation of the HMAC secret used by `TBitStorageConfig`.
 *
 * Resolution order:
 *  1. If an active encryption key is available, derive the secret from that
 *     key's `secret` value (existing behavior, unchanged).
 *  2. Otherwise, fall back to the `TBIT_HMAC_SECRET` environment variable.
 *     This keeps local development working without a configured key while
 *     preventing the hardcoded `"dev-hmac-secret"` string from reaching
 *     production.
 *  3. If neither is available AND `NODE_ENV === "production"`, throw so that
 *     a misconfigured production deployment fails loudly instead of
 *     silently using an insecure default.
 *  4. As a last-resort dev-only fallback (non-production), use
 *     `"dev-hmac-secret"`. This preserves the historical behavior for local
 *     development and tests.
 */

import { createHash } from "crypto";
import { getActiveEncryptionKeyAsync } from "./EncryptionKeyManager.js";

/** Legacy dev-only fallback secret — must NEVER be used in production. */
const DEV_HMAC_SECRET_FALLBACK = "dev-hmac-secret";

/**
 * Environment variable name that may provide an HMAC secret when no
 * encryption key has been configured.
 */
const TBIT_HMAC_SECRET_ENV = "TBIT_HMAC_SECRET";

/**
 * Resolve the HMAC key id and derived HMAC secret for a `TBitStorageConfig`.
 *
 * Prefer the active encryption key; fall back to the `TBIT_HMAC_SECRET`
 * environment variable; only use the dev fallback in non-production.
 *
 * @returns A tuple of `[hmacKeyId, hmacSecret]` where `hmacSecret` is the
 * SHA-256 hex digest of the resolved raw secret.
 */
export async function resolveHmacSecret(): Promise<[string, string]> {
  const activeKey = await getActiveEncryptionKeyAsync();

  if (activeKey?.secret) {
    const hmacKeyId = activeKey.id;
    const hmacSecret = createHash("sha256").update(activeKey.secret).digest("hex");
    return [hmacKeyId, hmacSecret];
  }

  const envSecret = process.env[TBIT_HMAC_SECRET_ENV];

  if (envSecret) {
    const hmacKeyId = "env";
    const hmacSecret = createHash("sha256").update(envSecret).digest("hex");
    return [hmacKeyId, hmacSecret];
  }

  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    throw new Error(
      "TBIT_HMAC_SECRET is not set and no encryption key is configured. " +
        "Refusing to use the insecure dev fallback in production."
    );
  }

  // Dev/test only: preserve historical behavior for local development.
  const hmacKeyId = activeKey?.id ?? "hmac-v1";
  const hmacSecret = createHash("sha256").update(DEV_HMAC_SECRET_FALLBACK).digest("hex");
  return [hmacKeyId, hmacSecret];
}
