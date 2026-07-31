import { useCallback, useState, useSyncExternalStore, useMemo } from "react";
import { tbitCognitiveStore, type TBitCognitiveState } from "../../store/useTBitCognitiveStore";
import { QVaultScene3D } from "./QVaultScene3D";
import { QVaultMap2D } from "./QVaultMap2D";
import { useMemoryGraph } from "../../hooks/useMemoryGraph";
import { memoryCoreClient } from "../../api/tbit/memoryCoreClient";

type ViewMode = "scene3d" | "map2d";

function useStore(): TBitCognitiveState {
  return useSyncExternalStore(
    tbitCognitiveStore.subscribe,
    tbitCognitiveStore.getState,
  );
}

export function QVaultView() {
  const {
    memoryGraph,
    selectedMemoryNodeKey,
    showMemoryLinks,
    showMemoryAntiVits,
  } = useStore();

  const [mode, setMode] = useState<ViewMode>("scene3d");
  const [showTags] = useState(false); // future feature
  const [searchQuery, setSearchQuery] = useState("");
  const [detailNodeKey, setDetailNodeKey] = useState<string | null>(null);

  // Phase 2: populate memory graph from backend (with demo fallback)
  useMemoryGraph("user-001", true);

  const selectNode = useCallback((key: string | null) => {
    tbitCognitiveStore.setSelectedMemoryNodeKey(key);
    setDetailNodeKey(key);
  }, []);

  // Phase 3: filtered nodes based on search
  const filteredGraph = useMemo(() => {
    if (!memoryGraph || !searchQuery.trim()) return memoryGraph;
    const q = searchQuery.toLowerCase();
    const matchingNodes = memoryGraph.nodes.filter((n) =>
      n.key.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q)),
    );
    const matchingKeys = new Set(matchingNodes.map((n) => n.key));
    const matchingLinks = memoryGraph.links.filter(
      (l) => matchingKeys.has(l.sourceKey) && matchingKeys.has(l.targetKey),
    );
    return { ...memoryGraph, nodes: matchingNodes, links: matchingLinks };
  }, [memoryGraph, searchQuery]);

  // Phase 3: selected node detail
  const selectedNode = useMemo(() => {
    if (!memoryGraph || !detailNodeKey) return null;
    return memoryGraph.nodes.find((n) => n.key === detailNodeKey) ?? null;
  }, [memoryGraph, detailNodeKey]);

  const [recallLoading, setRecallLoading] = useState(false);
  const [recallResult, setRecallResult] = useState<string | null>(null);

  const handleRecall = useCallback(async () => {
    if (!detailNodeKey) return;
    setRecallLoading(true);
    setRecallResult(null);
    try {
      const result = await memoryCoreClient.recall(detailNodeKey);
      setRecallResult(typeof result === "string" ? result : JSON.stringify(result, null, 2));
    } catch (err) {
      setRecallResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRecallLoading(false);
    }
  }, [detailNodeKey]);

  const hasNodes = memoryGraph && memoryGraph.nodes.length > 0;

  return (
    <div className="qvault-view">
      {/* Header bar with toggles */}
      <div className="qvault-toolbar">
        <div className="qvault-toolbar-left">
          <span className="qvault-title">Q·Vault — Memory Topology</span>
          <span className="qvault-badge">
            {memoryGraph ? `${memoryGraph.nodes.length} nodes` : "—"}
          </span>
        </div>

        <div className="qvault-toolbar-right">
          {/* Phase 3: Search/Filter */}
          <input
            className="qvault-search"
            type="text"
            placeholder="Filter by key or tag…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Mode toggle: 3D / 2D */}
          <div className="qvault-toggle-group">
            <button
              className={`qvault-btn ${mode === "scene3d" ? "active" : ""}`}
              onClick={() => setMode("scene3d")}
              title="3D Interactive Scene"
            >
              ⬡ 3D
            </button>
            <button
              className={`qvault-btn ${mode === "map2d" ? "active" : ""}`}
              onClick={() => setMode("map2d")}
              title="2D Projection Map"
            >
              ◻ Map
            </button>
          </div>

          <div className="qvault-divider" />

          {/* Memory Links toggle */}
          <button
            className={`qvault-btn ${showMemoryLinks ? "active" : ""}`}
            onClick={() => tbitCognitiveStore.setShowMemoryLinks(!showMemoryLinks)}
          >
            {showMemoryLinks ? "✦ Links ON" : "✧ Links OFF"}
          </button>

          {/* Anti-Vits toggle */}
          <button
            className={`qvault-btn ${showMemoryAntiVits ? "active" : ""}`}
            onClick={() => tbitCognitiveStore.setShowMemoryAntiVits(!showMemoryAntiVits)}
          >
            {showMemoryAntiVits ? "¬ Anti-V ON" : "¬ Anti-V OFF"}
          </button>
        </div>
      </div>

      {/* Main canvas area */}
      <div className="qvault-canvas-area">
        {!hasNodes && (
          <div className="qvault-empty">
            <div className="qvault-empty-icon">◈</div>
            <p>No memory graph available</p>
            <span className="qvault-empty-hint">
              Create markdown or chat memories via the T-Bit canvas or WikiLinks to populate Q-Vault.
            </span>
          </div>
        )}

        {hasNodes && mode === "scene3d" && filteredGraph && (
          <QVaultScene3D
            memoryGraph={filteredGraph}
            selectedNodeKey={selectedMemoryNodeKey}
            showLinks={showMemoryLinks}
            showAntiVits={showMemoryAntiVits}
            onSelectNode={selectNode}
          />
        )}

        {hasNodes && mode === "map2d" && filteredGraph && (
          <QVaultMap2D
            memoryGraph={filteredGraph}
            selectedNodeKey={selectedMemoryNodeKey}
            showLinks={showMemoryLinks}
            showAntiVits={showMemoryAntiVits}
            onSelectNode={selectNode}
          />
        )}

        {/* Phase 3: Node detail panel */}
        {selectedNode && (
          <div className="qvault-detail-panel glass">
            <div className="qvault-detail-header">
              <span className="qvault-detail-title">{selectedNode.key}</span>
              <button className="qvault-detail-close" onClick={() => { setDetailNodeKey(null); tbitCognitiveStore.setSelectedMemoryNodeKey(null); }}>
                ✕
              </button>
            </div>
            <div className="qvault-detail-meta">
              <div><strong>Source:</strong> {selectedNode.source}</div>
              <div><strong>Updated:</strong> {selectedNode.updatedAt}</div>
              <div><strong>Checksum:</strong> <code>{selectedNode.checksum || "—"}</code></div>
              {selectedNode.tags.length > 0 && (
                <div className="qvault-detail-tags">
                  {selectedNode.tags.map((t) => (
                    <span key={t} className="qvault-tag-chip">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="qvault-detail-links">
              {selectedNode.links.length > 0 && (
                <div><strong>Links ({selectedNode.links.length}):</strong>
                  <ul>{selectedNode.links.map((l) => <li key={l} className="qvault-link-item" onClick={() => selectNode(l)}>{l}</li>)}</ul>
                </div>
              )}
              {selectedNode.backlinks.length > 0 && (
                <div><strong>Backlinks ({selectedNode.backlinks.length}):</strong>
                  <ul>{selectedNode.backlinks.map((l) => <li key={l} className="qvault-link-item" onClick={() => selectNode(l)}>{l}</li>)}</ul>
                </div>
              )}
            </div>
            <div className="qvault-detail-actions">
              <button className="qvault-btn" onClick={handleRecall} disabled={recallLoading}>
                {recallLoading ? "Recalling…" : "⟳ Recall Content"}
              </button>
            </div>
            {recallResult && (
              <pre className="qvault-recall-output">{recallResult}</pre>
            )}
          </div>
        )}
      </div>

      {/* Footer info strip */}
      {hasNodes && (
        <div className="qvault-footer">
          <span>
            {memoryGraph!.nodes.length} nodes · {memoryGraph!.links.length} links
          </span>
          {selectedMemoryNodeKey && (
            <span className="qvault-selected-label">
              ➤ {selectedMemoryNodeKey}
            </span>
          )}
        </div>
      )}
    </div>
  );
}