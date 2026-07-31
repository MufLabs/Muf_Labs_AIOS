import { buildTBitApiHeaders } from "./tbitApiHeaders";

export interface MemoryGraphNode {
  key: string;
  userId: string;
  tags: string[];
  links: string[];
  backlinks: string[];
  source: string;
  checksum: string;
  updatedAt: string;
}

export interface MemoryGraphLink {
  sourceKey: string;
  targetKey: string;
  type: "quantum-link" | "backlink";
}

const API_BASE_URL = import.meta.env.VITE_TBIT_API_BASE_URL ?? "http://localhost:3000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildTBitApiHeaders(true),
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Fallo en Memory Core.");
  return payload;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildTBitApiHeaders(),
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Fallo en Memory Core.");
  return payload;
}

/** Resolve or create the user's T-Bit container ID on first call */
function resolveContainerId(): string {
  let cid = localStorage.getItem("tbit:activeContainerId");
  if (!cid) {
    cid = `tbit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    localStorage.setItem("tbit:activeContainerId", cid);
  }
  return cid;
}

/** Get the container ID, creating if needed */
export function getContainerId(): string {
  return resolveContainerId();
}

export const memoryCoreClient = {
  /** Store a memory record into the T-Bit container */
  remember(body: {
    userId?: string;
    text?: string;
    payload?: unknown;
    key?: string;
    domain?: string;
    collection?: string;
    tags?: string[];
    source?: string;
    links?: string[];
  }) {
    const containerId = resolveContainerId();
    return postJson(`/api/v1/tbit/containers/${containerId}/memos`, {
      content: body.text ?? JSON.stringify(body.payload ?? ""),
      tags: body.tags,
      sourceUrl: body.source,
    });
  },

  /** Recall memories matching a query */
  recall(key: string) {
    const containerId = resolveContainerId();
    return getJson(`/api/v1/tbit/containers/${containerId}/memos?q=${encodeURIComponent(key)}`);
  },

  /** Semantic context for a user query */
  context(userId: string, query: string, limit = 8) {
    const containerId = resolveContainerId();
    return getJson(
      `/api/v1/tbit/containers/${containerId}/memos?q=${encodeURIComponent(query)}&topK=${limit}`,
    );
  },

  /** Get links / graph for a specific memory record */
  links(key: string) {
    const containerId = resolveContainerId();
    return getJson(`/api/v1/tbit/containers/${containerId}/memos/${encodeURIComponent(key)}/context`);
  },

  /** Get the full memory graph for this container */
  graph(userId?: string) {
    const containerId = resolveContainerId();
    return getJson<{ nodes: MemoryGraphNode[]; links: MemoryGraphLink[]; tags: Record<string, string[]> }>(`/api/v1/tbit/containers/${containerId}/memos/graph`);
  },

  /** Delete a memory record */
  delete(key: string) {
    const containerId = resolveContainerId();
    return postJson(`/api/v1/tbit/containers/${containerId}/memos/delete`, { key });
  },
};
