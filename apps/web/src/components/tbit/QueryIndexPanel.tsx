import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, ChevronDown, ChevronUp, Database, Zap, Loader2, AlertTriangle, History, Play, Trash2, Copy, Code, FileText, Settings, Filter as FilterIcon, Brain, GitBranch } from "lucide-react";

interface SearchResult {
  id: string;
  query: string;
  results: Array<{
    nodeId: string;
    score: number;
    content: string;
    metadata: Record<string, unknown>;
  }>;
  timestamp: string;
  executionTime: number;
  totalHits: number;
}

interface QueryState {
  query: string;
  results: SearchResult | null;
  history: SearchResult[];
  loading: boolean;
  error: string | null;
  searchType: "semantic" | "keyword" | "hybrid" | "graph";
  limit: number;
  threshold: number;
  includeMetadata: boolean;
}

const SEARCH_TYPES = [
  { value: "semantic", label: "Semantic Search", icon: Brain, description: "Vector similarity search" },
  { value: "keyword", label: "Keyword Search", icon: Search, description: "Full-text keyword matching" },
  { value: "hybrid", label: "Hybrid Search", icon: Zap, description: "Combined semantic + keyword" },
  { value: "graph", label: "Graph Traversal", icon: GitBranch, description: "Follow memory links" },
] as const;

export function QueryIndexPanel() {
  const [state, setState] = useState<QueryState>({
    query: "",
    results: null,
    history: [],
    loading: false,
    error: null,
    searchType: "hybrid",
    limit: 10,
    threshold: 0.7,
    includeMetadata: true,
  });

  const executeSearch = async () => {
    if (!state.query.trim()) return;
    
    setState((s) => ({ ...s, loading: true, error: null }));
    const startTime = Date.now();
    
    try {
      const response = await fetch("/api/tbit/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: state.query,
          type: state.searchType,
          limit: state.limit,
          threshold: state.threshold,
          includeMetadata: state.includeMetadata,
        }),
      });
      
      if (!response.ok) throw new Error("Search failed");
      const results = await response.json();
      
      const searchResult: SearchResult = {
        id: crypto.randomUUID(),
        query: state.query,
        results: results.nodes || results,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        totalHits: results.total || (results.nodes?.length || results.length || 0),
      };
      
      setState((s) => ({
        ...s,
        results: searchResult,
        loading: false,
        history: [searchResult, ...s.history.slice(0, 49)],
      }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Search failed" }));
    }
  };

  const rerunHistory = (item: SearchResult) => {
    setState((s) => ({ ...s, query: item.query, searchType: "hybrid" }));
    executeSearch();
  };

  const clearHistory = () => {
    if (confirm("Clear search history?")) {
      setState((s) => ({ ...s, history: [] }));
    }
  };

  const copyQuery = async (query: string) => {
    await navigator.clipboard.writeText(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      executeSearch();
    }
  };

  return (
    <div className="tbit-panel query-index-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <Database className="panel-icon" size={20} />
          <h2 className="panel-title">Query Indexes</h2>
        </div>
        <div className="panel-actions">
          <div className="view-toggle">
            {SEARCH_TYPES.map((type) => (
              <button
                key={type.value}
                className={`view-btn ${state.searchType === type.value ? "active" : ""}`}
                onClick={() => setState((s) => ({ ...s, searchType: type.value }))}
                title={type.description}
              >
                <type.icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.error && (
        <div className="panel-error">
          <AlertTriangle size={14} /> {state.error}
          <button onClick={() => setState((s) => ({ ...s, error: null }))}>✕</button>
        </div>
      )}

      <div className="query-panel">
        <div className="query-form">
          <textarea
            className="query-textarea"
            value={state.query}
            onChange={(e) => setState((s) => ({ ...s, query: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Enter your query... (Ctrl+Enter to search)"
            rows={4}
          />
          <div className="query-options">
            <div className="query-option">
              <label>
                <input
                  type="checkbox"
                  checked={state.includeMetadata}
                  onChange={(e) => setState((s) => ({ ...s, includeMetadata: e.target.checked }))}
                />
                Include Metadata
              </label>
            </div>
            <div className="query-option">
              <label>
                Limit:
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={state.limit}
                  onChange={(e) => setState((s) => ({ ...s, limit: parseInt(e.target.value) || 10 }))}
                  style={{ width: 60, marginLeft: 8 }}
                />
              </label>
            </div>
            <div className="query-option">
              <label>
                Threshold:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={state.threshold}
                  onChange={(e) => setState((s) => ({ ...s, threshold: parseFloat(e.target.value) }))}
                  style={{ width: 120, marginLeft: 8 }}
                />
                <span style={{ marginLeft: 8, fontSize: 12 }}>{(state.threshold * 100).toFixed(0)}%</span>
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={executeSearch} disabled={state.loading || !state.query.trim()}>
              {state.loading ? <Loader2 className="spin" size={14} /> : <Play size={14} />} Search
            </button>
            <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, query: "", results: null }))}>
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {state.results && (
          <div className="query-results">
            <div className="query-results-header">
              <span>
                <strong>{state.results.totalHits}</strong> results in <strong>{state.results.executionTime}ms</strong>
              </span>
              <span>{new Date(state.results.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Node ID</th>
                    <th>Content Preview</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {state.results.results.map((result, i) => (
                    <tr key={`${result.nodeId}-${i}`}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "var(--bg-tertiary)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${result.score * 100}%`, height: "100%", background: result.score > 0.8 ? "var(--accent-success)" : result.score > 0.5 ? "var(--accent-warning)" : "var(--accent-danger)" }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, minWidth: 40 }}>{(result.score * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>
                        <code className="checksum" onClick={() => copyQuery(result.nodeId)} style={{ cursor: "pointer" }}>{result.nodeId}</code>
                      </td>
                      <td>
                        <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 11, whiteSpace: "pre-wrap", wordWrap: "break-word", maxWidth: 400 }}>
                          {result.content.slice(0, 300)}{result.content.length > 300 ? "..." : ""}
                        </pre>
                      </td>
                      <td>
                        {state.includeMetadata && result.metadata && Object.keys(result.metadata).length > 0 ? (
                          <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 10, whiteSpace: "pre-wrap", maxWidth: 200 }}>
                            {JSON.stringify(result.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{state.includeMetadata ? "No metadata" : "Disabled"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="query-history">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
              Search History ({state.history.length})
            </h4>
            {state.history.length > 0 && (
              <button className="btn btn-sm btn-secondary" onClick={clearHistory}>
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          {state.history.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>No search history yet</p>
          ) : (
            <div className="history-list">
              {state.history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-query" onClick={() => rerunHistory(item)} style={{ cursor: "pointer" }}>
                    {item.query}
                  </div>
                  <div className="history-meta">
                    <span>{item.totalHits} results</span>
                    <span>{item.executionTime}ms</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span className="type-badge" style={{ color: "var(--accent-primary)" }}>{item.query.split(" ").length > 10 ? "hybrid" : "semantic"}</span>
                  </div>
                  <div className="history-actions">
                    <button className="icon-btn" onClick={() => rerunHistory(item)} title="Rerun"><Play size={12} /></button>
                    <button className="icon-btn" onClick={() => copyQuery(item.query)} title="Copy"><Copy size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueryIndexPanel;