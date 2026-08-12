/**
 * Build headers for T-Bit API requests.
 * If includeContentType is true, sets Content-Type to application/json.
 * Attaches an Authorization header from a stored token if available.
 *
 * ECR-Phase9-0001 fix: attaches the symbolic x-tbit-api-key header so the
 * backend `requireSymbolicApiKey` middleware can authenticate the request.
 * Resolution order (no hardcoded secret; header omitted if empty):
 *   1. localStorage["tbit:apiKey"]      — optional per-session override,
 *      matches the legacy T-Bit localStorage convention (T-BIT_BOOK.md §API Key
 *      documents `localStorage.tbit_api_key`). Local override wins so a key can
 *      be rotated without rebuilding the web app.
 *   2. import.meta.env.VITE_TBIT_API_KEY — the Vite-injected build-time secret
 *      configured in apps/web/.env (same value as the backend TBIT_API_KEY).
 */
export function buildTBitApiHeaders(includeContentType = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  // Symbolic API key (x-tbit-api-key): localStorage override first, then Vite env.
  const localOverride =
    typeof localStorage !== "undefined" ? localStorage.getItem("tbit:apiKey") : null;
  const envKey =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env.VITE_TBIT_API_KEY as string | undefined)
      : undefined;
  const apiKey = (localOverride && localOverride.trim()) || (envKey && envKey.trim()) || "";
  if (apiKey) {
    headers["x-tbit-api-key"] = apiKey;
  }

  const token =
    typeof localStorage !== "undefined" ? localStorage.getItem("tbit:authToken") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Get the local API key for T-Bit peer-to-peer authentication.
 * Used for direct peer-to-peer requests.
 */
export function getLocalApiKey(): string {
  return localStorage.getItem("tbit:apiKey") ?? "";
}
