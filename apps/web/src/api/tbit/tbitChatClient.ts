import { buildTBitApiHeaders } from "./tbitApiHeaders";
import { enrichPayloadWithFractalProjection } from "../../lib/tbit/fractalProjection";

const API_BASE_URL = import.meta.env.VITE_TBIT_API_BASE_URL?.trim() || "http://localhost:3000";

export type TBitChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type TBitChatRequest = {
  messages: TBitChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  coordinates?: [number, number, number];
  antiCoordinates?: [number, number, number];
};

export type TBitChatResponse = {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  coordinates?: [number, number, number];
  antiCoordinates?: [number, number, number];
  fractalDepth?: number;
  parentKey?: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T & { error?: string }> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    throw new Error(`La API de chat no devolvio JSON. URL: ${response.url}`);
  }
}

export const tbitChatClient = {
  async chat(request: TBitChatRequest): Promise<TBitChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify(request),
    });
    const payload = await parseJsonResponse<{ ok: boolean; response: TBitChatResponse }>(response);
    if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Fallo en chat T-Bit.");
    return payload.response;
  },

  async injectWithCoordinates(
    key: string,
    content: string,
    coordinates: [number, number, number],
    antiCoordinates?: [number, number, number]
  ): Promise<TBitChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai/inject`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify({
        key,
        content,
        coordinates,
        antiCoordinates,
      }),
    });
    const payload = await parseJsonResponse<{ ok: boolean; response: TBitChatResponse }>(response);
    if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Fallo inyectando con coordenadas.");
    return payload.response;
  },

  async oracleWithCoordinates(
    query: string,
    coordinates: [number, number, number],
    antiCoordinates?: [number, number, number]
  ): Promise<TBitChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai/oracle`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify({
        query,
        coordinates,
        antiCoordinates,
      }),
    });
    const payload = await parseJsonResponse<{ ok: boolean; response: TBitChatResponse }>(response);
    if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Fallo en oraculo T-Bit.");
    return payload.response;
  },

  /**
   * Enrich a payload with fractal projection coordinates for UI visualization.
   */
  enrichWithFractalProjection<T extends Record<string, unknown>>(payload: T): T {
    return enrichPayloadWithFractalProjection(payload);
  },
};