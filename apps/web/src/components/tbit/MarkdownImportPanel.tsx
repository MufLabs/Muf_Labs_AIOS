import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, Upload, Download, Trash2, Eye, Copy, ChevronDown, ChevronUp, FileText, Plus, AlertTriangle, CheckCircle, XCircle, Clock, RotateCcw, Settings, FileCheck, FileX } from "lucide-react";

interface MarkdownDocument {
  key: string;
  title: string;
  content: string;
  contentPreview: string;
  wordCount: number;
  charCount: number;
  tags: string[];
  source: string;
  checksum: string;
  status: "indexed" | "pending" | "failed" | "processing";
  chunks: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

interface ImportState {
  documents: MarkdownDocument[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterStatus: string;
  filterSource: string;
  selectedDoc: MarkdownDocument | null;
  showImportModal: boolean;
  viewMode: "grid" | "list";
}

const STATUS_COLORS: Record<MarkdownDocument["status"], string> = {
  indexed: "var(--accent-success)",
  pending: "var(--accent-warning)",
  failed: "var(--accent-danger)",
  processing: "var(--accent-info)",
};

const STATUS_ICONS: Record<MarkdownDocument["status"], React.ReactNode> = {
  indexed: <CheckCircle size={14} />,
  pending: <Clock size={14} />,
  failed: <XCircle size={14} />,
  processing: <RotateCcw className="spin" size={14} />,
};

const STATUS_LABELS: Record<MarkdownDocument["status"], string> = {
  indexed: "Indexed",
  pending: "Pending",
  failed: "Failed",
  processing: "Processing",
};

export function MarkdownImportPanel() {
  const [state, setState] = useState<ImportState>({
    documents: [],
    loading: true,
    error: null,
    searchQuery: "",
    filterStatus: "",
    filterSource: "",
    selectedDoc: null,
    showImportModal: false,
    viewMode: "grid",
  });

  const fetchDocuments = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch("/api/tbit/markdown");
      if (!response.ok) throw new Error("Failed to fetch markdown documents");
      const documents = await response.json();
      setState((s) => ({ ...s, documents, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const importDocuments = async (files: File[], options: { source: string; tags: string[]; splitChunks: boolean; maxChunkSize: number }) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("source", options.source);
    formData.append("tags", JSON.stringify(options.tags));
    formData.append("splitChunks", String(options.splitChunks));
    formData.append("maxChunkSize", String(options.maxChunkSize));

    try {
      const response = await fetch("/api/tbit/markdown/import", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Import failed");
      await fetchDocuments();
      setState((s) => ({ ...s, showImportModal: false }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Import failed" }));
    }
  };

  const reindexDocument = async (key: string) => {
    try {
      const response = await fetch(`/api/tbit/markdown/${encodeURIComponent(key)}/reindex`, { method: "POST" });
      if (!response.ok) throw new Error("Reindex failed");
      await fetchDocuments();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Reindex failed" }));
    }
  };

  const deleteDocument = async (key: string) => {
    if (!confirm(`Delete document "${key}"?`)) return;
    try {
      const response = await fetch(`/api/tbit/markdown/${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await fetchDocuments();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Delete failed" }));
    }
  };

  const updateDocumentStatus = async (key: string, status: "indexed" | "pending") => {
    try {
      const response = await fetch(`/api/tbit/markdown/${encodeURIComponent(key)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Status update failed");
      await fetchDocuments();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Status update failed" }));
    }
  };

  const copyContent = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const downloadDocument = async (key: string, title: string) => {
    try {
      const response = await fetch(`/api/tbit/markdown/${encodeURIComponent(key)}/download`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Download failed" }));
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = state.documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      doc.key.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(state.searchQuery.toLowerCase()));
    const matchesStatus = !state.filterStatus || doc.status === state.filterStatus;
    const matchesSource = !state.filterSource || doc.source === state.filterSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const sources = [...new Set(state.documents.map((d) => d.source))].sort();
  const statuses = ["indexed", "pending", "failed", "processing"] as const;

  const formatNumber = (n: number) => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="tbit-panel markdown-import-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <FileText className="panel-icon" size={20} />
          <h2 className="panel-title">Markdown Import</h2>
        </div>
        <div className="panel-actions">
          <input
            type="text"
            placeholder="Search documents..."
            value={state.searchQuery}
            onChange={(e) => setState((s) => ({ ...s, searchQuery: e.target.value }))}
            className="panel-search"
          />
          <select
            value={state.filterStatus}
            onChange={(e) => setState((s) => ({ ...s, filterStatus: e.target.value }))}
            className="panel-filter"
          >
            <option value="">All Status</option>
            {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select
            value={state.filterSource}
            onChange={(e) => setState((s) => ({ ...s, filterSource: e.target.value }))}
            className="panel-filter"
          >
            <option value="">All Sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
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
          <button className="btn btn-secondary" onClick={fetchDocuments} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setState((s) => ({ ...s, showImportModal: true }))}>
            <Upload size={14} /> Import Markdown
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
          <div className="panel-loading">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="panel-empty">
            <FileText size={48} className="empty-icon" />
            <p>{state.documents.length === 0 ? "No markdown documents imported" : "No documents match your filters"}</p>
            {state.documents.length === 0 && (
              <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showImportModal: true }))}>
                <Upload size={14} /> Import First Document
              </button>
            )}
          </div>
        ) : state.viewMode === "grid" ? (
          <div className="documents-grid">
            {filteredDocs.map((doc) => (
              <div
                key={doc.key}
                className={`doc-card ${state.selectedDoc?.key === doc.key ? "selected" : ""}`}
                onClick={() => setState((s) => ({ ...s, selectedDoc: doc }))}
              >
                <div className="doc-header">
                  <div className="doc-type">
                    <FileText size={16} style={{ color: "var(--accent-primary)" }} />
                    <span className="doc-type-label">{doc.status === "indexed" ? "Indexed" : doc.status}</span>
                  </div>
                  <div className="doc-source">{doc.source}</div>
                </div>
                <div className="doc-title" title={doc.title}>{doc.title}</div>
                <div className="doc-preview">{doc.contentPreview}</div>
                <div className="doc-meta">
                  <div className="doc-stat">
                    <span className="stat-value">{formatNumber(doc.wordCount)}</span>
                    <span className="stat-label">Words</span>
                  </div>
                  <div className="doc-stat">
                    <span className="stat-value">{doc.chunks}</span>
                    <span className="stat-label">Chunks</span>
                  </div>
                  <div className="doc-stat">
                    <span className="stat-value" style={{ color: STATUS_COLORS[doc.status] }}>
                      {STATUS_ICONS[doc.status]}
                    </span>
                    <span className="stat-label">{STATUS_LABELS[doc.status]}</span>
                  </div>
                </div>
                <div className="doc-tags">
                  {doc.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  {doc.tags.length > 4 && <span className="tag">+{doc.tags.length - 4}</span>}
                </div>
                <div className="doc-footer">
                  <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{doc.checksum.slice(0, 8)}...</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Words</th>
                  <th>Chunks</th>
                  <th>Tags</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.key} className={state.selectedDoc?.key === doc.key ? "selected" : ""}
                    onClick={() => setState((s) => ({ ...s, selectedDoc: doc }))}>
                    <td>
                      <div className="doc-title-cell">
                        <FileText size={14} style={{ color: "var(--accent-primary)", marginRight: 6 }} />
                        {doc.title}
                      </div>
                    </td>
                    <td><span className="source-badge">{doc.source}</span></td>
                    <td>
                      <span className="status-badge" style={{ background: `${STATUS_COLORS[doc.status]}20`, color: STATUS_COLORS[doc.status], borderColor: `${STATUS_COLORS[doc.status]}40` }}>
                        {STATUS_ICONS[doc.status]} {STATUS_LABELS[doc.status]}
                      </span>
                    </td>
                    <td>{formatNumber(doc.wordCount)}</td>
                    <td>{doc.chunks}</td>
                    <td>
                      <div className="doc-tags">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                        {doc.tags.length > 3 && <span className="tag">+{doc.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); downloadDocument(doc.key, doc.title); }} title="Download">
                          <Download size={14} />
                        </button>
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyContent(doc.content); }} title="Copy Content">
                          <Copy size={14} />
                        </button>
                        {doc.status === "failed" && (
                          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); reindexDocument(doc.key); }} title="Reindex">
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteDocument(doc.key); }} title="Delete">
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

      {state.selectedDoc && (
        <div className="detail-panel">
          <div className="detail-header">
            <h3>{state.selectedDoc.title}</h3>
            <button className="detail-close" onClick={() => setState((s) => ({ ...s, selectedDoc: null }))}>✕</button>
          </div>
          <div className="detail-content">
            <div className="detail-grid">
              <div className="detail-item"><strong>Key:</strong> <code>{state.selectedDoc.key}</code></div>
              <div className="detail-item"><strong>Source:</strong> <span className="source-badge">{state.selectedDoc.source}</span></div>
              <div className="detail-item">
                <strong>Status:</strong>
                <span className="status-badge" style={{ background: `${STATUS_COLORS[state.selectedDoc.status]}20`, color: STATUS_COLORS[state.selectedDoc.status], borderColor: `${STATUS_COLORS[state.selectedDoc.status]}40` }}>
                  {STATUS_ICONS[state.selectedDoc.status]} {STATUS_LABELS[state.selectedDoc.status]}
                </span>
              </div>
              <div className="detail-item"><strong>Words:</strong> {formatNumber(state.selectedDoc.wordCount)}</div>
              <div className="detail-item"><strong>Characters:</strong> {formatNumber(state.selectedDoc.charCount)}</div>
              <div className="detail-item"><strong>Chunks:</strong> {state.selectedDoc.chunks}</div>
              <div className="detail-item"><strong>Checksum:</strong> <code>{state.selectedDoc.checksum}</code></div>
              <div className="detail-item"><strong>Created:</strong> {new Date(state.selectedDoc.createdAt).toLocaleString()}</div>
              <div className="detail-item"><strong>Updated:</strong> {new Date(state.selectedDoc.updatedAt).toLocaleString()}</div>
              <div className="detail-item full-width"><strong>Tags:</strong>
                <div className="detail-tags">
                  {state.selectedDoc.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="detail-section">
              <h4>Content Preview</h4>
              <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: 200, overflow: "auto" }}>{state.selectedDoc.content.slice(0, 2000)}{state.selectedDoc.content.length > 2000 ? "..." : ""}</pre>
            </div>
            <div className="detail-section"><h4>Metadata</h4><pre>{JSON.stringify(state.selectedDoc.metadata, null, 2)}</pre></div>
            <div className="detail-actions">
              {state.selectedDoc && (() => {
                const doc = state.selectedDoc;
                return (
                  <>
                    <button className="btn btn-secondary" onClick={() => downloadDocument(doc.key, doc.title)}>
                      <Download size={14} /> Download
                    </button>
                    <button className="btn btn-secondary" onClick={() => copyContent(doc.content)}>
                      <Copy size={14} /> Copy Content
                    </button>
                    {doc.status === "failed" && (
                      <button className="btn btn-secondary" onClick={() => reindexDocument(doc.key)}>
                        <RotateCcw size={14} /> Reindex
                      </button>
                    )}
                    {doc.status === "indexed" && (
                      <button className="btn btn-secondary" onClick={() => updateDocumentStatus(doc.key, "pending")}>
                        <Clock size={14} /> Mark Pending
                      </button>
                    )}
                    {doc.status === "pending" && (
                      <button className="btn btn-secondary" onClick={() => updateDocumentStatus(doc.key, "indexed")}>
                        <CheckCircle size={14} /> Mark Indexed
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={() => deleteDocument(doc.key)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {state.showImportModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showImportModal: false }))}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Markdown Documents</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showImportModal: false }))}>✕</button>
            </div>
            <MarkdownImportForm onSubmit={importDocuments} onCancel={() => setState((s) => ({ ...s, showImportModal: false }))} />
          </div>
        </div>
      )}
    </div>
  );
}

function MarkdownImportForm({ onSubmit, onCancel }: { onSubmit: (files: File[], options: { source: string; tags: string[]; splitChunks: boolean; maxChunkSize: number }) => void; onCancel: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [source, setSource] = useState("manual-import");
  const [tags, setTags] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [splitChunks, setSplitChunks] = useState(true);
  const [maxChunkSize, setMaxChunkSize] = useState(1000);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files).filter(f => f.type === "text/markdown" || f.name.endsWith(".md")));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).filter(f => f.type === "text/markdown" || f.name.endsWith(".md")));
    }
  };

  const addTag = () => {
    const trimmed = tags.trim();
    if (trimmed && !tagList.includes(trimmed)) {
      setTagList([...tagList, trimmed]);
      setTags("");
    }
  };

  const removeTag = (tag: string) => {
    setTagList(tagList.filter((t) => t !== tag));
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    onSubmit(files, { source, tags: tagList, splitChunks, maxChunkSize });
  };

  return (
    <form onSubmit={handleSubmit} className="import-form">
      <div className={`drop-zone ${dragActive ? "active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("markdown-file-input")?.click()}>
        <input id="markdown-file-input" type="file" accept=".md,.markdown" multiple hidden onChange={handleFileSelect} />
        {files.length > 0 ? (
          <div className="selected-files">
            <FileText size={32} />
            <p>{files.length} file(s) selected</p>
            <ul>
              {files.map((file, i) => (
                <li key={i}>
                  <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                  <button type="button" onClick={() => removeFile(i)}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <FileText size={32} />
            <p>Drag & drop .md files or click to browse</p>
            <span className="hint">Multiple files supported • Max 50MB each</span>
          </>
        )}
      </div>

      <div className="form-group">
        <label>Source</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g., manual-import, documentation, notes"
        />
        <span className="form-hint">Used to categorize imported documents</span>
      </div>

      <div className="form-group">
        <label>Tags</label>
        <div className="tag-input">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add tag..."
          />
          <button type="button" onClick={addTag} className="btn btn-sm btn-secondary">Add</button>
        </div>
        <div className="tag-list">
          {tagList.map((tag) => (
            <span key={tag} className="tag">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>✕</button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={splitChunks}
              onChange={(e) => setSplitChunks(e.target.checked)}
            />
            Split into chunks
          </label>
        </div>
        <div className="form-group">
          <label>Max Chunk Size (words)</label>
          <input
            type="number"
            min="100"
            max="5000"
            value={maxChunkSize}
            onChange={(e) => setMaxChunkSize(parseInt(e.target.value) || 1000)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={files.length === 0}>
          <Upload size={14} /> Import {files.length} Document{files.length !== 1 ? "s" : ""}
        </button>
      </div>
    </form>
  );
}

export default MarkdownImportPanel;