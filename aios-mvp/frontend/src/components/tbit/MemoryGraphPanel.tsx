import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, Plus, Trash2, Eye, Copy, ChevronDown, ChevronUp, Brain, Link, ExternalLink, AlertTriangle, Settings, GitBranch, Layout, Zap, Loader2, Download, Upload, Filter as FilterIcon } from "lucide-react";
import { memoryCoreClient } from "../../api/tbit/memoryCoreClient";

interface MemoryNode {
  id: string;
  type: "concept" | "entity" | "event" | "document" | "code" | "agent" | "task";
  label: string;
  content: string;
  source: "user" | "agent" | "import" | "system" | "derived";
  confidence: number;
  tags: string[];
  links: string[];
  backlinks: string[];
  embedding: number[] | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

interface MemoryGraphState {
  nodes: MemoryNode[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterType: string;
  filterSource: string;
  selectedNode: MemoryNode | null;
  showCreateModal: boolean;
  viewMode: "graph" | "table";
  graphStats: { nodes: number; edges: number; clusters: number };
}

const TYPE_ICONS: Record<MemoryNode["type"], string> = {
  concept: "💡",
  entity: "🏷️",
  event: "⚡",
  document: "📄",
  code: "💻",
  agent: "🤖",
  task: "✅",
};

const TYPE_LABELS: Record<MemoryNode["type"], string> = {
  concept: "Concept",
  entity: "Entity",
  event: "Event",
  document: "Document",
  code: "Code",
  agent: "Agent",
  task: "Task",
};

const SOURCE_LABELS: Record<MemoryNode["source"], string> = {
  user: "User Input",
  agent: "Agent Generated",
  import: "Imported",
  system: "System",
  derived: "Derived",
};

export function MemoryGraphPanel() {
  const [state, setState] = useState<MemoryGraphState>({
    nodes: [],
    loading: true,
    error: null,
    searchQuery: "",
    filterType: "",
    filterSource: "",
    selectedNode: null,
    showCreateModal: false,
    viewMode: "graph",
    graphStats: { nodes: 0, edges: 0, clusters: 0 },
  });

  const fetchNodes = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      // Use the real T-Bit API client
      const response = await memoryCoreClient.graph();
      const nodes = response?.nodes || [];
      const edges = nodes.reduce((sum: number, n: MemoryNode) => sum + (n.links?.length || 0), 0);
      setState((s) => ({
        ...s,
        nodes,
        loading: false,
        graphStats: { nodes: nodes.length, edges, clusters: 0 },
      }));
    } catch (err) {
      console.warn("[MemoryGraphPanel] Failed to fetch graph, will show empty state:", err);
      // Show empty state instead of error - demo graph is seeded elsewhere
      setState((s) => ({ ...s, nodes: [], loading: false, error: null }));
    }
  };

  const createNode = async (data: Omit<MemoryNode, "id" | "createdAt" | "updatedAt" | "links" | "backlinks" | "embedding">) => {
    try {
      // Use the real T-Bit API client
      await memoryCoreClient.remember({
        text: data.content,
        tags: data.tags,
        source: data.source,
      });
      await fetchNodes();
      setState((s) => ({ ...s, showCreateModal: false }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Create failed" }));
    }
  };

  const deleteNode = async (id: string) => {
    if (!confirm("Delete this memory node?")) return;
    try {
      // Use the real T-Bit API client
      await memoryCoreClient.delete(id);
      await fetchNodes();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Delete failed" }));
    }
  };

  const copyNodeId = async (id: string) => {
    await navigator.clipboard.writeText(id);
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const filteredNodes = state.nodes.filter((node) => {
    const matchesSearch =
      node.label.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      node.content.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      node.id.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      node.tags.some((tag) => tag.toLowerCase().includes(state.searchQuery.toLowerCase()));
    const matchesType = !state.filterType || node.type === state.filterType;
    const matchesSource = !state.filterSource || node.source === state.filterSource;
    return matchesSearch && matchesType && matchesSource;
  });

  const types = [...new Set(state.nodes.map((n) => n.type))].sort();
  const sources = [...new Set(state.nodes.map((n) => n.source))].sort();

  return (
    <div className="tbit-panel memory-graph-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <Brain className="panel-icon" size={20} />
          <h2 className="panel-title">Memory Graph</h2>
        </div>
        <div className="panel-actions">
          <input
            type="text"
            placeholder="Search nodes, content, tags..."
            value={state.searchQuery}
            onChange={(e) => setState((s) => ({ ...s, searchQuery: e.target.value }))}
            className="panel-search"
          />
          <select
            value={state.filterType}
            onChange={(e) => setState((s) => ({ ...s, filterType: e.target.value }))}
            className="panel-filter"
          >
            <option value="">All Types</option>
            {types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <select
            value={state.filterSource}
            onChange={(e) => setState((s) => ({ ...s, filterSource: e.target.value }))}
            className="panel-filter"
          >
            <option value="">All Sources</option>
            {sources.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </select>
          <div className="view-toggle">
            <button
              className={`view-btn ${state.viewMode === "graph" ? "active" : ""}`}
              onClick={() => setState((s) => ({ ...s, viewMode: "graph" }))}
              title="Graph View"
            >
              <GitBranch size={14} />
            </button>
            <button
              className={`view-btn ${state.viewMode === "table" ? "active" : ""}`}
              onClick={() => setState((s) => ({ ...s, viewMode: "table" }))}
              title="Table View"
            >
              <Layout size={14} />
            </button>
          </div>
          <button className="btn btn-secondary" onClick={fetchNodes} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setState((s) => ({ ...s, showCreateModal: true }))}>
            <Plus size={14} /> Add Node
          </button>
        </div>
      </div>

      <div className="graph-stats">
        <div className="stat-card">
          <strong>{state.graphStats.nodes}</strong>
          <span>Nodes</span>
        </div>
        <div className="stat-card">
          <strong>{state.graphStats.edges}</strong>
          <span>Edges</span>
        </div>
        <div className="stat-card">
          <strong>{state.graphStats.clusters}</strong>
          <span>Clusters</span>
        </div>
      </div>

      {state.error && (
        <div className="panel-error">
          <AlertTriangle size={14} /> {state.error}
          <button onClick={() => setState((s) => ({ ...s, error: null }))}>✕</button>
        </div>
      )}

      <div className="panel-content">
        {state.loading ? (
          <div className="panel-loading">
            <Loader2 className="spin" size={24} /> Loading memory graph...
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="panel-empty">
            <Brain size={48} className="empty-icon" />
            <p>{state.nodes.length === 0 ? "Memory graph is empty" : "No nodes match your filters"}</p>
            {state.nodes.length === 0 && (
              <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showCreateModal: true }))}>
                <Plus size={14} /> Create First Node
              </button>
            )}
          </div>
        ) : state.viewMode === "graph" ? (
          <div className="canvas-view" style={{ height: 500 }}>
            <div className="canvas-placeholder">
              <GitBranch size={64} style={{ color: "var(--accent-primary)", opacity: 0.3, marginBottom: 16 }} />
              <h3>Graph Visualization</h3>
              <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
                Interactive force-directed graph view coming soon. 
                Use Table View for now to explore nodes.
              </p>
              <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
                <button className="btn btn-secondary"><Zap size={14} /> Layout</button>
                <button className="btn btn-secondary"><FilterIcon size={14} /> Filter</button>
                <button className="btn btn-secondary"><Settings size={14} /> Settings</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="nodes-table-wrapper">
            <table className="nodes-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Label</th>
                  <th>Source</th>
                  <th>Confidence</th>
                  <th>Links</th>
                  <th>Backlinks</th>
                  <th>Tags</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((node) => (
                  <tr key={node.id} className={state.selectedNode?.id === node.id ? "selected" : ""}
                    onClick={() => setState((s) => ({ ...s, selectedNode: node }))}>
                    <td>
                      <div className="node-type-cell">
                        <span className="node-type-icon">{TYPE_ICONS[node.type]}</span>
                        <span className="type-badge" style={{ color: "var(--accent-primary)" }}>{TYPE_LABELS[node.type]}</span>
                      </div>
                    </td>
                    <td>
                      <div className="doc-title-cell">{node.label}</div>
                    </td>
                    <td>
                      <span className="source-badge">{SOURCE_LABELS[node.source]}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--bg-tertiary)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${node.confidence * 100}%`, height: "100%", background: node.confidence > 0.8 ? "var(--accent-success)" : node.confidence > 0.5 ? "var(--accent-warning)" : "var(--accent-danger)" }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, minWidth: 40 }}>{(node.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--accent-info)" }}>{node.links.length}</td>
                    <td style={{ color: "var(--accent-secondary)" }}>{node.backlinks.length}</td>
                    <td>
                      <div className="node-tags">
                        {node.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                        {node.tags.length > 3 && <span className="tag">+{node.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td>{new Date(node.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyNodeId(node.id); }} title="Copy ID">
                          <Copy size={14} />
                        </button>
                        <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {state.selectedNode && (
        <div className="detail-panel">
          <div className="detail-header">
            <h3>{state.selectedNode.label}</h3>
            <button className="detail-close" onClick={() => setState((s) => ({ ...s, selectedNode: null }))}>✕</button>
          </div>
          <div className="detail-content">
            <div className="detail-grid">
              <div className="detail-item"><strong>ID:</strong> <code>{state.selectedNode.id}</code></div>
              <div className="detail-item"><strong>Type:</strong> <span className="type-badge" style={{ color: "var(--accent-primary)" }}>{TYPE_ICONS[state.selectedNode.type]} {TYPE_LABELS[state.selectedNode.type]}</span></div>
              <div className="detail-item"><strong>Source:</strong> <span className="source-badge">{SOURCE_LABELS[state.selectedNode.source]}</span></div>
              <div className="detail-item"><strong>Confidence:</strong> {(state.selectedNode.confidence * 100).toFixed(1)}%</div>
              <div className="detail-item"><strong>Links:</strong> {state.selectedNode.links.length}</div>
              <div className="detail-item"><strong>Backlinks:</strong> {state.selectedNode.backlinks.length}</div>
              <div className="detail-item"><strong>Created:</strong> {new Date(state.selectedNode.createdAt).toLocaleString()}</div>
              <div className="detail-item"><strong>Updated:</strong> {new Date(state.selectedNode.updatedAt).toLocaleString()}</div>
              <div className="detail-item full-width"><strong>Tags:</strong>
                <div className="detail-tags">
                  {state.selectedNode.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="detail-section">
              <h4>Content</h4>
              <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{state.selectedNode.content}</pre>
            </div>
            <div className="detail-section">
              <h4>Linked Nodes</h4>
              {state.selectedNode.links.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No outgoing links</p>
              ) : (
                <div className="detail-tags">
                  {state.selectedNode.links.slice(0, 10).map((link) => (
                    <span key={link} className="tag" style={{ cursor: "pointer" }}>{link.slice(0, 12)}...</span>
                  ))}
                  {state.selectedNode.links.length > 10 && <span className="tag tag-more">+{state.selectedNode.links.length - 10} more</span>}
                </div>
              )}
            </div>
            <div className="detail-section">
              <h4>Backlinks</h4>
              {state.selectedNode.backlinks.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No incoming links</p>
              ) : (
                <div className="detail-tags">
                  {state.selectedNode.backlinks.slice(0, 10).map((link) => (
                    <span key={link} className="tag" style={{ cursor: "pointer" }}>{link.slice(0, 12)}...</span>
                  ))}
                  {state.selectedNode.backlinks.length > 10 && <span className="tag tag-more">+{state.selectedNode.backlinks.length - 10} more</span>}
                </div>
              )}
            </div>
            <div className="detail-section"><h4>Metadata</h4><pre>{JSON.stringify(state.selectedNode.metadata, null, 2)}</pre></div>
            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={() => copyNodeId(state.selectedNode.id)}>
                <Copy size={14} /> Copy ID
              </button>
              <button className="btn btn-danger" onClick={() => deleteNode(state.selectedNode.id)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {state.showCreateModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showCreateModal: false }))}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Memory Node</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showCreateModal: false }))}>✕</button>
            </div>
            <NodeCreationForm onSubmit={createNode} onCancel={() => setState((s) => ({ ...s, showCreateModal: false }))} />
          </div>
        </div>
      )}
    </div>
  );
}

function NodeCreationForm({ onSubmit, onCancel }: { onSubmit: (data: Omit<MemoryNode, "id" | "createdAt" | "updatedAt" | "links" | "backlinks" | "embedding">) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    label: "",
    type: "concept" as MemoryNode["type"],
    content: "",
    source: "user" as MemoryNode["source"],
    confidence: 1.0,
    tags: "" as string,
    tagList: [] as string[],
    metadata: {} as Record<string, unknown>,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tagList,
    });
  };

  const addTag = () => {
    const trimmed = formData.tags.trim();
    if (trimmed && !formData.tagList.includes(trimmed)) {
      setFormData((d) => ({ ...d, tagList: [...d.tagList, trimmed], tags: "" }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData((d) => ({ ...d, tagList: d.tagList.filter((t) => t !== tag) }));
  };

  return (
    <form onSubmit={handleSubmit} className="node-creation-form">
      <div className="form-row">
        <div className="form-group">
          <label>Label *</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData((d) => ({ ...d, label: e.target.value }))}
            placeholder="Node label"
            required
          />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData((d) => ({ ...d, type: e.target.value as MemoryNode["type"] }))}
          >
            <option value="concept">Concept</option>
            <option value="entity">Entity</option>
            <option value="event">Event</option>
            <option value="document">Document</option>
            <option value="code">Code</option>
            <option value="agent">Agent</option>
            <option value="task">Task</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Content *</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData((d) => ({ ...d, content: e.target.value }))}
          rows={5}
          placeholder="Node content / description"
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Source</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData((d) => ({ ...d, source: e.target.value as MemoryNode["source"] }))}
          >
            <option value="user">User Input</option>
            <option value="agent">Agent Generated</option>
            <option value="import">Imported</option>
            <option value="system">System</option>
            <option value="derived">Derived</option>
          </select>
        </div>
        <div className="form-group">
          <label>Confidence</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={formData.confidence}
            onChange={(e) => setFormData((d) => ({ ...d, confidence: parseFloat(e.target.value) }))}
          />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{(formData.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="form-group">
        <label>Tags</label>
        <div className="tag-input">
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData((d) => ({ ...d, tags: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add tag..."
          />
          <button type="button" onClick={addTag} className="btn btn-sm btn-secondary">Add</button>
        </div>
        <div className="tag-list">
          {formData.tagList.map((tag) => (
            <span key={tag} className="tag">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>✕</button>
            </span>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Metadata (JSON)</label>
        <textarea
          value={JSON.stringify(formData.metadata, null, 2)}
          onChange={(e) => {
            try {
              setFormData((d) => ({ ...d, metadata: JSON.parse(e.target.value) }));
            } catch {}
          }}
          rows={3}
          placeholder='{"priority": "high", "project": "aios"}'
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          <Brain size={14} /> Create Node
        </button>
      </div>
    </form>
  );
}

export default MemoryGraphPanel;