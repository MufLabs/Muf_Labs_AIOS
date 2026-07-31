import { useEffect, useCallback, useRef } from "react";
import { tbitCognitiveStore } from "../store/useTBitCognitiveStore";
import { memoryCoreClient } from "../api/tbit/memoryCoreClient";
import type { TBitMemoryGraph } from "../store/useTBitCognitiveStore";

const DEFAULT_USER_ID = "user-001";
const POLL_INTERVAL_MS = 15_000; // refresh every 15s

/**
 * Hook that populates and refreshes the T-Bit memory graph in the cognitive store.
 * Uses the real T-Bit API endpoint `/memos/graph`.
 * Falls back to a seeded demo graph if the API is unreachable.
 */
export function useMemoryGraph(userId: string = DEFAULT_USER_ID, autoRefresh = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGraph = useCallback(async () => {
    try {
      const graph = (await memoryCoreClient.graph(userId)) as TBitMemoryGraph;
      if (graph?.nodes?.length > 0) {
        tbitCognitiveStore.setMemoryGraph(graph);
      } else {
        seedDemoGraph();
      }
    } catch (err) {
      console.warn("[useMemoryGraph] Failed to fetch graph, seeding demo:", err);
      seedDemoGraph();
    }
  }, [userId]);

  useEffect(() => {
    fetchGraph();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchGraph, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchGraph, autoRefresh]);

  return { refresh: fetchGraph };
}

/** Seed a deterministic demo graph so the Q-Vault is never empty during MVP */
function seedDemoGraph() {
  const demoKeys = [
    "chat::memoria-ia::2024-01-15::session-001",
    "chat::memoria-ia::2024-02-03::oracle-query",
    "doc::markdown::architecture-decision-record-001.md",
    "doc::markdown::api-contract-spec.md",
    "doc::book::muf-labs-master-plan.md",
    "chunk::doc::api-contract-spec.md::part:1",
    "chunk::doc::api-contract-spec.md::part:2",
    "chat::memoria-ia::2024-03-10::debug-session",
    "doc::markdown::tbit-cognitive-overview.md",
    "generic::reference::tbit-network",
  ];

  const nodes: TBitMemoryGraph["nodes"] = demoKeys.map((key) => ({
    key,
    userId: DEFAULT_USER_ID,
    tags: key.includes("chat")
      ? ["ai-memory", "chat"]
      : key.includes("chunk")
        ? ["chunk", "partial"]
        : ["documentation"],
    links:
      key === "doc::markdown::api-contract-spec.md"
        ? ["chunk::doc::api-contract-spec.md::part:1", "chunk::doc::api-contract-spec.md::part:2"]
        : key === "doc::markdown::architecture-decision-record-001.md"
          ? ["doc::markdown::api-contract-spec.md"]
          : [],
    backlinks:
      key === "chunk::doc::api-contract-spec.md::part:1" || key === "chunk::doc::api-contract-spec.md::part:2"
        ? ["doc::markdown::api-contract-spec.md"]
        : [],
    source: "demo-seed",
    checksum: "",
    updatedAt: new Date().toISOString(),
  }));

  const links: TBitMemoryGraph["links"] = [
    { sourceKey: "doc::markdown::api-contract-spec.md", targetKey: "chunk::doc::api-contract-spec.md::part:1", type: "quantum-link" },
    { sourceKey: "doc::markdown::api-contract-spec.md", targetKey: "chunk::doc::api-contract-spec.md::part:2", type: "quantum-link" },
    { sourceKey: "doc::markdown::architecture-decision-record-001.md", targetKey: "doc::markdown::api-contract-spec.md", type: "backlink" },
    { sourceKey: "doc::book::muf-labs-master-plan.md", targetKey: "doc::markdown::architecture-decision-record-001.md", type: "backlink" },
    { sourceKey: "chat::memoria-ia::2024-01-15::session-001", targetKey: "doc::markdown::tbit-cognitive-overview.md", type: "quantum-link" },
    { sourceKey: "chat::memoria-ia::2024-02-03::oracle-query", targetKey: "chat::memoria-ia::2024-01-15::session-001", type: "backlink" },
    { sourceKey: "generic::reference::tbit-network", targetKey: "doc::markdown::tbit-cognitive-overview.md", type: "quantum-link" },
  ];

  const tags: Record<string, string[]> = {
    "ai-memory": nodes.filter((n) => n.tags.includes("ai-memory")).map((n) => n.key),
    chat: nodes.filter((n) => n.tags.includes("chat")).map((n) => n.key),
    documentation: nodes.filter((n) => n.tags.includes("documentation")).map((n) => n.key),
    chunk: nodes.filter((n) => n.tags.includes("chunk")).map((n) => n.key),
  };

  tbitCognitiveStore.setMemoryGraph({ nodes, links, tags });
}
