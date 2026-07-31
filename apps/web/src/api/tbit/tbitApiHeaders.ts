/**
 * Build headers for T-Bit API requests.
 * If includeContentType is true, sets Content-Type to application/json.
 * Attaches an Authorization header from a stored token if available.
 */
export function buildTBitApiHeaders(includeContentType = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("tbit:authToken");
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
