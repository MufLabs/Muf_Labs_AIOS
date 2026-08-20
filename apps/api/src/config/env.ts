/**
 * ECR-Phase10-0001 — Stage 10.4: Production Secrets & Environment Validation
 * Runtime environment validation at API startup.
 * Rejects startup if critical secrets are missing or use insecure default values.
 */

/* Production mode detection */
const isProduction = process.env.NODE_ENV === "production";

/* Required production secrets — must be set via secret management.
 * Insecure placeholder values (e.g., "changeme") are rejected in production.
 */
const requiredSecrets = [
  "TBIT_API_KEY",
  "TBIT_HMAC_SECRET",
  "TBIT_ENCRYPTION_SECRET",
  "TBIT_VAULT_ROOT",
];

/* Validate that required secrets are present and not insecure defaults.
 * In production, exits process with code 1 if validation fails.
 * In development, returns validation result without exiting.
 */
function validateRequiredSecrets(): boolean {
  const errors: string[] = [];

  for (const secret of requiredSecrets) {
    const value = process.env[secret];
    if (!value || value.trim() === "") {
      errors.push(`${secret} is missing`);
    }
    // In production, reject insecure defaults
    if (isProduction && value && value === "changeme") {
      errors.push(`${secret} must not be the insecure default value 'changeme'`);
    }
  }

  if (isProduction && errors.length > 0) {
    console.error("[AIOS API] FATAL: Environment validation failed:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  return errors.length === 0;
}

/* Validated environment variables. */
export interface EnvVars {
  TBIT_API_KEY: string | undefined;
  TBIT_HMAC_SECRET: string | undefined;
  TBIT_ENCRYPTION_SECRET: string | undefined;
  TBIT_VAULT_ROOT: string | undefined;
  NODE_ENV: string;
  PORT: number;
  CORS_ALLOWED_ORIGINS: string;
  LOG_LEVEL: string;
  ENABLE_METRICS: boolean;
}

/* Get validated environment variables. */
export function getEnv(): EnvVars {
  const valid = validateRequiredSecrets();

  const port = parseInt(process.env.PORT ?? "3001", 10);

  return {
    TBIT_API_KEY: process.env.TBIT_API_KEY,
    TBIT_HMAC_SECRET: process.env.TBIT_HMAC_SECRET,
    TBIT_ENCRYPTION_SECRET: process.env.TBIT_ENCRYPTION_SECRET,
    TBIT_VAULT_ROOT: process.env.TBIT_VAULT_ROOT,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: isNaN(port) ? 3001 : port,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost,http://localhost:5173",
    LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
    ENABLE_METRICS: process.env.ENABLE_METRICS === "true",
  };
}

/* Run validation on import (production mode will exit if secrets are missing) */
const valid = validateRequiredSecrets();
if (!valid && isProduction) {
  process.exit(1);
}