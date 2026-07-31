import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, Plus, Trash2, Eye, Copy, ChevronDown, ChevronUp, Database, Key, AlertTriangle, Settings, FileText, Download, Upload, Edit, Hash } from "lucide-react";

interface KVEntry {
  key: string;
  value: string;
  valuePreview: string;
  type: "string" | "number" | "boolean" | "json" | "binary";
  ttl: number | null;
  expiresAt: string | null;
  size: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

interface KVState {
  entries: KVEntry[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterType: string;
  filterTTL: string;
  selectedEntry: KVEntry | null;
  showCreateModal: boolean;
  showEditModal: string | null;
  viewMode: "grid" | "list";
}

const TYPE_LABELS: Record<KVEntry["type"], string> = {
  string: "String",
  number: "Number",
  boolean: "Boolean",
  json: "JSON",
  binary: "Binary",
};

const TYPE_ICONS: Record<KVEntry["type"], string> = {
  string: "📝",
  number: "🔢",
  boolean: "✅",
  json: "📋",
  binary: "💾",
};

export function KVStorePanel() {
  const [state, setState] = useState<KVState>({
    entries: [],
    loading: true,
    error: null,
    searchQuery: "",
    filterType: "",
    filterTTL: "",
    selectedEntry: null,
    showCreateModal: false,
    showEditModal: null,
    viewMode: "grid",
  });

  const fetchEntries = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch("/api/tbit/kv");
      if (!response.ok) throw new Error("Failed to fetch KV entries");
      const entries = await response.json();
      setState((s) => ({ ...s, entries, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const createEntry = async (data: Omit<KVEntry, "key" | "createdAt" | "updatedAt" | "size" | "valuePreview">) => {
    try {
      const response = await fetch("/api/tbit/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create entry");
      await fetchEntries();
      setState((s) => ({ ...s, showCreateModal: false }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Create failed" }));
    }
  };

  const updateEntry = async (key: string, updates: Partial<KVEntry>) => {
    try {
      const response = await fetch(`/api/tbit/kv/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update entry");
      await fetchEntries();
      setState((s) => ({ ...s, showEditModal: null }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Update failed" }));
    }
  };

  const deleteEntry = async (key: string) => {
    if (!confirm(`Delete key "${key}"?`)) return;
    try {
      const response = await fetch(`/api/tbit/kv/${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await fetchEntries();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Delete failed" }));
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
  };

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const filteredEntries = state.entries.filter((entry) => {
    const matchesSearch =
      entry.key.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      entry.valuePreview.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesType = !state.filterType || entry.type === state.filterType;
    const matchesTTL = !state.filterTTL ||
      (state.filterTTL === "ttl" ? !!entry.ttl : !entry.ttl);
    return matchesSearch && matchesType && matchesTTL;
  });

  const types = [...new Set(state.entries.map((e) => e.type))].sort();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isExpired = (entry: KVEntry) => {
    if (!entry.expiresAt) return false;
    return new Date(entry.expiresAt) < new Date();
  };

  return (
    <div className="tbit-panel kv-store-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <Database className="panel-icon" size={20} />
          <h2 className="panel-title">KV Store</h2>
        </div>
        <div className="panel-actions">
          <input
            type="text"
            placeholder="Search keys, values..."
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
            value={state.filterTTL}
            onChange={(e) => setState((s) => ({ ...s, filterTTL: e.target.value }))}
            className="panel-filter"
          >
            <option value="">All TTL</option>
            <option value="ttl">With TTL</option>
            <option value="none">No TTL</option>
          </select>
          <div className="view-toggle">
            <button
              className={`view-btn ${state.viewMode === "grid" ? "active" : ""}`}
              onClick={() => setState((s) => ({ ...s, viewMode: "grid" }))}
              title="Grid View"
            >
              <div className="grid-icon" />
            </button>
            <button
              className={`view-btn ${state.viewMode === "list" ? "active" : ""}`}
              onClick={() => setState((s) => ({ ...s, viewMode: "list" }))}
              title="List View"
            >
              <div className="list-icon" />
            </button>
          </div>
          <button className="btn btn-secondary" onClick={fetchEntries} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setState((s) => ({ ...s, showCreateModal: true }))}>
            <Plus size={14} /> Set Key
          </button>
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
          <div className="panel-loading">Loading KV store...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="panel-empty">
            <Database size={48} className="empty-icon" />
            <p>{state.entries.length === 0 ? "KV store is empty" : "No entries match your filters"}</p>
            {state.entries.length === 0 && (
              <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showCreateModal: true }))}>
                <Plus size={14} /> Create First Entry
              </button>
            )}
          </div>
        ) : state.viewMode === "grid" ? (
          <div className="kv-grid">
            {filteredEntries.map((entry) => (
              <div
                key={entry.key}
                className={`kv-card ${state.selectedEntry?.key === entry.key ? "selected" : ""} ${isExpired(entry) ? "expired" : ""}`}
                onClick={() => setState((s) => ({ ...s, selectedEntry: entry }))}
              >
                <div className="kv-header">
                  <div className="kv-key">
                    <Hash size={14} style={{ color: "var(--accent-primary)" }} />
                    <code>{entry.key}</code>
                  </div>
                  <span className="type-badge" style={{ color: "var(--accent-primary)" }}>
                    {TYPE_ICONS[entry.type]} {TYPE_LABELS[entry.type]}
                  </span>
                </div>
                <div className="kv-value" title={entry.valuePreview}>{entry.valuePreview}</div>
                <div className="kv-meta">
                  <span>{formatSize(entry.size)}</span>
                  {entry.ttl && (
                    <span className={isExpired(entry) ? "ttl-expired" : "ttl-active"}>
                      {isExpired(entry) ? "⏰ Expired" : `⏳ ${Math.round((new Date(entry.expiresAt!).getTime() - Date.now()) / 1000 / 60)}m left`}
                    </span>
                  )}
                  {!entry.ttl && <span style={{ color: "var(--text-muted)", fontSize: 10 }}>No TTL</span>}
                </div>
                <div className="kv-actions">
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyKey(entry.key); }} title="Copy Key">
                    <Copy size={14} />
                  </button>
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyValue(entry.value); }} title="Copy Value">
                    <FileText size={14} />
                  </button>
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setState((s) => ({ ...s, showEditModal: entry.key })); }} title="Edit">
                    <Edit size={14} />
                  </button>
                  <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteEntry(entry.key); }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="kv-table-wrapper">
            <table className="kv-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Type</th>
                  <th>Value Preview</th>
                  <th>Size</th>
                  <th>TTL</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.key} className={`${state.selectedEntry?.key === entry.key ? "selected" : ""} ${isExpired(entry) ? "expired" : ""}`}
                    onClick={() => setState((s) => ({ ...s, selectedEntry: entry }))}>
                    <td>
                      <div className="kv-key-cell">
                        <Hash size={14} style={{ color: "var(--accent-primary)", marginRight: 6 }} />
                        <code>{entry.key}</code>
                      </div>
                    </td>
                    <td>
                      <span className="type-badge" style={{ color: "var(--accent-primary)" }}>
                        {TYPE_ICONS[entry.type]} {TYPE_LABELS[entry.type]}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: 11, maxWidth: 300, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.valuePreview}
                      </code>
                    </td>
                    <td>{formatSize(entry.size)}</td>
                    <td>
                      {entry.ttl ? (
                        <span className={isExpired(entry) ? "ttl-expired" : "ttl-active"}>
                          {isExpired(entry) ? "⏰ Expired" : `⏳ ${Math.round((new Date(entry.expiresAt!).getTime() - Date.now()) / 1000 / 60)}m`}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>No TTL</span>
                      )}
                    </td>
                    <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(entry.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyKey(entry.key); }} title="Copy Key">
                          <Copy size={14} />
                        </button>
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyValue(entry.value); }} title="Copy Value">
                          <FileText size={14} />
                        </button>
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setState((s) => ({ ...s, showEditModal: entry.key })); }} title="Edit">
                          <Edit size={14} />
                        </button>
                        <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteEntry(entry.key); }} title="Delete">
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

      {state.selectedEntry && (
        <div className="detail-panel">
          <div className="detail-header">
            <h3><code>{state.selectedEntry.key}</code></h3>
            <button className="detail-close" onClick={() => setState((s) => ({ ...s, selectedEntry: null }))}>✕</button>
          </div>
          <div className="detail-content">
            <div className="detail-grid">
              <div className="detail-item"><strong>Key:</strong> <code>{state.selectedEntry.key}</code></div>
              <div className="detail-item"><strong>Type:</strong> <span className="type-badge" style={{ color: "var(--accent-primary)" }}>{TYPE_ICONS[state.selectedEntry.type]} {TYPE_LABELS[state.selectedEntry.type]}</span></div>
              <div className="detail-item"><strong>Size:</strong> {formatSize(state.selectedEntry.size)}</div>
              <div className="detail-item"><strong>TTL:</strong> {state.selectedEntry.ttl ? `${state.selectedEntry.ttl}s` : "None"}</div>
              <div className="detail-item"><strong>Expires:</strong> {state.selectedEntry.expiresAt ? new Date(state.selectedEntry.expiresAt).toLocaleString() : "Never"}</div>
              <div className="detail-item"><strong>Created:</strong> {new Date(state.selectedEntry.createdAt).toLocaleString()}</div>
              <div className="detail-item"><strong>Updated:</strong> {new Date(state.selectedEntry.updatedAt).toLocaleString()}</div>
            </div>
            <div className="detail-section">
              <h4>Value</h4>
              <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{state.selectedEntry.value}</pre>
            </div>
            <div className="detail-section"><h4>Metadata</h4><pre>{JSON.stringify(state.selectedEntry.metadata, null, 2)}</pre></div>
            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={() => copyKey(state.selectedEntry.key)}>
                <Copy size={14} /> Copy Key
              </button>
              <button className="btn btn-secondary" onClick={() => copyValue(state.selectedEntry.value)}>
                <FileText size={14} /> Copy Value
              </button>
              <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showEditModal: state.selectedEntry!.key }))}>
                <Edit size={14} /> Edit
              </button>
              <button className="btn btn-danger" onClick={() => deleteEntry(state.selectedEntry.key)}>
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
              <h3>Create KV Entry</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showCreateModal: false }))}>✕</button>
            </div>
            <KVForm onSubmit={createEntry} onCancel={() => setState((s) => ({ ...s, showCreateModal: false }))} />
          </div>
        </div>
      )}

      {state.showEditModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showEditModal: null }))}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit KV Entry</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showEditModal: null }))}>✕</button>
            </div>
            <KVForm
              initialData={state.entries.find((e) => e.key === state.showEditModal)!}
              onSubmit={(data) => updateEntry(state.showEditModal!, data)}
              onCancel={() => setState((s) => ({ ...s, showEditModal: null }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function KVForm({ onSubmit, onCancel, initialData }: { onSubmit: (data: Omit<KVEntry, "key" | "createdAt" | "updatedAt" | "size" | "valuePreview">) => void; onCancel: () => void; initialData?: KVEntry }) {
  const [formData, setFormData] = useState({
    key: initialData?.key || "",
    value: initialData?.value || "",
    type: initialData?.type || "string" as KVEntry["type"],
    ttl: initialData?.ttl || null,
    metadata: initialData?.metadata || {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="kv-form">
      <div className="form-group">
        <label>Key *</label>
        <input
          type="text"
          value={formData.key}
          onChange={(e) => setFormData((d) => ({ ...d, key: e.target.value }))}
          placeholder="my-key-name"
          required
          disabled={!!initialData}
        />
        {initialData && <span className="form-hint">Key cannot be changed after creation</span>}
      </div>
      <div className="form-group">
        <label>Value *</label>
        <textarea
          value={formData.value}
          onChange={(e) => setFormData((d) => ({ ...d, value: e.target.value }))}
          rows={6}
          placeholder="Enter value..."
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData((d) => ({ ...d, type: e.target.value as KVEntry["type"] }))}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="json">JSON</option>
            <option value="binary">Binary (Base64)</option>
          </select>
        </div>
        <div className="form-group">
          <label>TTL (seconds, optional)</label>
          <input
            type="number"
            min="1"
            max="31536000"
            value={formData.ttl || ""}
            onChange={(e) => setFormData((d) => ({ ...d, ttl: e.target.value ? parseInt(e.target.value) : null }))}
            placeholder="3600 (1 hour)"
          />
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
          placeholder='{"source": "user", "project": "aios"}'
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          <Key size={14} /> {initialData ? "Update" : "Create"} Entry
        </button>
      </div>
    </form>
  );
}

export default KVStorePanel;