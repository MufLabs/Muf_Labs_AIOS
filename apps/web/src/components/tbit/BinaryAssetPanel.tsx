import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, Upload, Download, Trash2, Copy, Eye, EyeOff, FileText, Box, Plus, Settings, AlertTriangle, Check, X, ChevronDown, ChevronUp, Archive, HardDrive } from "lucide-react";

interface BinaryAsset {
  key: string;
  name: string;
  size: number;
  mimeType: string;
  checksum: string;
  encryptionKeyId: string | null;
  compression: "none" | "gzip" | "zstd" | "lz4";
  chunks: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

interface BinaryAssetState {
  assets: BinaryAsset[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterCompression: string;
  filterEncryption: string;
  selectedAsset: BinaryAsset | null;
  showUploadModal: boolean;
  viewMode: "grid" | "list";
}

const COMPRESSION_LABELS: Record<BinaryAsset["compression"], string> = {
  none: "None",
  gzip: "GZIP",
  zstd: "Zstandard",
  lz4: "LZ4",
};

const COMPRESSION_COLORS: Record<BinaryAsset["compression"], string> = {
  none: "var(--text-muted)",
  gzip: "var(--accent-info)",
  zstd: "var(--accent-primary)",
  lz4: "var(--accent-success)",
};

export function BinaryAssetPanel() {
  const [state, setState] = useState<BinaryAssetState>({
    assets: [],
    loading: true,
    error: null,
    searchQuery: "",
    filterCompression: "",
    filterEncryption: "",
    selectedAsset: null,
    showUploadModal: false,
    viewMode: "grid",
  });

  const fetchAssets = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch("/api/tbit/assets?type=binary");
      if (!response.ok) throw new Error("Failed to fetch binary assets");
      const assets = await response.json();
      setState((s) => ({ ...s, assets, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const uploadAsset = async (file: File, options: { compression: BinaryAsset["compression"]; encryptionKeyId: string | null; tags: string[] }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("compression", options.compression);
    if (options.encryptionKeyId) formData.append("encryptionKeyId", options.encryptionKeyId);
    if (options.tags.length) formData.append("tags", JSON.stringify(options.tags));

    try {
      const response = await fetch("/api/tbit/assets/import/binary", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      await fetchAssets();
      setState((s) => ({ ...s, showUploadModal: false }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Upload failed" }));
    }
  };

  const deleteAsset = async (key: string) => {
    if (!confirm(`Delete binary asset "${key}"?`)) return;
    try {
      const response = await fetch(`/api/tbit/assets/${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await fetchAssets();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Delete failed" }));
    }
  };

  const downloadAsset = async (key: string, name: string) => {
    try {
      const response = await fetch(`/api/tbit/assets/${encodeURIComponent(key)}/download`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Download failed" }));
    }
  };

  const copyChecksum = async (checksum: string) => {
    await navigator.clipboard.writeText(checksum);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = state.assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      asset.key.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      asset.checksum.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(state.searchQuery.toLowerCase()));
    const matchesCompression = !state.filterCompression || asset.compression === state.filterCompression;
    const matchesEncryption = !state.filterEncryption ||
      (state.filterEncryption === "encrypted" ? !!asset.encryptionKeyId : !asset.encryptionKeyId);
    return matchesSearch && matchesCompression && matchesEncryption;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="tbit-panel binary-asset-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <HardDrive className="panel-icon" size={20} />
          <h2 className="panel-title">Binary Assets</h2>
        </div>
        <div className="panel-actions">
          <input
            type="text"
            placeholder="Search binary assets..."
            value={state.searchQuery}
            onChange={(e) => setState((s) => ({ ...s, searchQuery: e.target.value }))}
            className="panel-search"
          />
          <select
            value={state.filterCompression}
            onChange={(e) => setState((s) => ({ ...s, filterCompression: e.target.value }))}
            className="panel-filter"
          >
            <option value="">All Compression</option>
            <option value="none">None</option>
            <option value="gzip">GZIP</option>
            <option value="zstd">Zstandard</option>
            <option value="lz4">LZ4</option>
          </select>
          <select
            value={state.filterEncryption}
            onChange={(e) => setState((s) => ({ ...s, filterEncryption: e.target.value }))}
            className="panel-filter"
          >
            <option value="">All Encryption</option>
            <option value="encrypted">Encrypted</option>
            <option value="plain">Unencrypted</option>
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
          <button className="btn btn-secondary" onClick={fetchAssets} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setState((s) => ({ ...s, showUploadModal: true }))}>
            <Upload size={14} /> Import Binary
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
          <div className="panel-loading">Loading binary assets...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="panel-empty">
            <HardDrive size={48} className="empty-icon" />
            <p>{state.assets.length === 0 ? "No binary assets stored" : "No assets match your filters"}</p>
            {state.assets.length === 0 && (
              <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showUploadModal: true }))}>
                <Upload size={14} /> Import First Binary
              </button>
            )}
          </div>
        ) : state.viewMode === "grid" ? (
          <div className="assets-grid">
            {filteredAssets.map((asset) => (
              <div
                key={asset.key}
                className={`asset-card ${state.selectedAsset?.key === asset.key ? "selected" : ""}`}
                onClick={() => setState((s) => ({ ...s, selectedAsset: asset }))}
              >
                <div className="asset-icon">💾</div>
                <div className="asset-info">
                  <div className="asset-name" title={asset.name}>{asset.name}</div>
                  <div className="asset-meta">
                    <span>{formatSize(asset.size)}</span>
                    <span className="compression-badge" style={{ borderColor: COMPRESSION_COLORS[asset.compression], color: COMPRESSION_COLORS[asset.compression] }}>
                      {COMPRESSION_LABELS[asset.compression]}
                    </span>
                  </div>
                  <div className="asset-meta" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {asset.chunks} chunk{asset.chunks !== 1 ? "s" : ""} • {asset.mimeType}
                  </div>
                  <div className="asset-tags">
                    {asset.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {asset.tags.length > 3 && <span className="tag">+{asset.tags.length - 3}</span>}
                  </div>
                  <div className="asset-compression" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                    {asset.encryptionKeyId ? "🔒 Encrypted" : "🔓 Plain"}
                  </div>
                </div>
                <div className="asset-actions">
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); downloadAsset(asset.key, asset.name); }} title="Download">
                    <Download size={14} />
                  </button>
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyChecksum(asset.checksum); }} title="Copy Checksum">
                    <Copy size={14} />
                  </button>
                  <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteAsset(asset.key); }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="assets-table-wrapper">
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>MIME Type</th>
                  <th>Compression</th>
                  <th>Encryption</th>
                  <th>Chunks</th>
                  <th>Checksum</th>
                  <th>Tags</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.key} className={state.selectedAsset?.key === asset.key ? "selected" : ""}
                    onClick={() => setState((s) => ({ ...s, selectedAsset: asset }))}>
                    <td>
                      <div className="asset-row-name">
                        <span className="asset-icon">💾</span>
                        <span>{asset.name}</span>
                      </div>
                    </td>
                    <td>{formatSize(asset.size)}</td>
                    <td>{asset.mimeType}</td>
                    <td>
                      <span className="compression-badge" style={{ borderColor: COMPRESSION_COLORS[asset.compression], color: COMPRESSION_COLORS[asset.compression] }}>
                        {COMPRESSION_LABELS[asset.compression]}
                      </span>
                    </td>
                    <td>
                      {asset.encryptionKeyId ? (
                        <span className="status-badge" style={{ background: "rgba(124, 58, 237, 0.15)", color: "var(--accent-info)", borderColor: "rgba(124, 58, 237, 0.3)" }}>
                          🔒 Encrypted
                        </span>
                      ) : (
                        <span className="status-badge disabled">🔓 Plain</span>
                      )}
                    </td>
                    <td>{asset.chunks}</td>
                    <td><code className="checksum">{asset.checksum.slice(0, 24)}...</code></td>
                    <td>
                      <div className="asset-tags">
                        {asset.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                        {asset.tags.length > 3 && <span className="tag">+{asset.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td>{new Date(asset.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); downloadAsset(asset.key, asset.name); }} title="Download">
                          <Download size={14} />
                        </button>
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyChecksum(asset.checksum); }} title="Copy Checksum">
                          <Copy size={14} />
                        </button>
                        <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteAsset(asset.key); }} title="Delete">
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

      {state.selectedAsset && (
        <div className="detail-panel">
          <div className="detail-header">
            <h3>{state.selectedAsset.name}</h3>
            <button className="detail-close" onClick={() => setState((s) => ({ ...s, selectedAsset: null }))}>✕</button>
          </div>
          <div className="detail-content">
            <div className="detail-grid">
              <div className="detail-item"><strong>Key:</strong> <code>{state.selectedAsset.key}</code></div>
              <div className="detail-item"><strong>Size:</strong> {formatSize(state.selectedAsset.size)}</div>
              <div className="detail-item"><strong>MIME Type:</strong> {state.selectedAsset.mimeType}</div>
              <div className="detail-item"><strong>Compression:</strong>
                <span className="compression-badge" style={{ borderColor: COMPRESSION_COLORS[state.selectedAsset.compression], color: COMPRESSION_COLORS[state.selectedAsset.compression] }}>
                  {COMPRESSION_LABELS[state.selectedAsset.compression]}
                </span>
              </div>
              <div className="detail-item"><strong>Encryption:</strong> {state.selectedAsset.encryptionKeyId ? "🔒 Encrypted" : "🔓 Plain"}</div>
              <div className="detail-item"><strong>Encryption Key:</strong> {state.selectedAsset.encryptionKeyId ? <code>{state.selectedAsset.encryptionKeyId}</code> : "N/A"}</div>
              <div className="detail-item"><strong>Chunks:</strong> {state.selectedAsset.chunks}</div>
              <div className="detail-item"><strong>Checksum:</strong> <code>{state.selectedAsset.checksum}</code></div>
              <div className="detail-item"><strong>Created:</strong> {new Date(state.selectedAsset.createdAt).toLocaleString()}</div>
              <div className="detail-item"><strong>Updated:</strong> {new Date(state.selectedAsset.updatedAt).toLocaleString()}</div>
              <div className="detail-item full-width"><strong>Tags:</strong>
                <div className="detail-tags">
                  {state.selectedAsset.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="detail-section"><h4>Metadata</h4><pre>{JSON.stringify(state.selectedAsset.metadata, null, 2)}</pre></div>
            <div className="detail-actions">
              {state.selectedAsset && (() => {
                const asset = state.selectedAsset;
                return (
                  <>
                    <button className="btn btn-secondary" onClick={() => downloadAsset(asset.key, asset.name)}>
                      <Download size={14} /> Download
                    </button>
                    <button className="btn btn-secondary" onClick={() => copyChecksum(asset.checksum)}>
                      <Copy size={14} /> Copy Checksum
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteAsset(asset.key)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {state.showUploadModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showUploadModal: false }))}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Binary Asset</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showUploadModal: false }))}>✕</button>
            </div>
            <BinaryUploadForm onSubmit={uploadAsset} onCancel={() => setState((s) => ({ ...s, showUploadModal: false }))} />
          </div>
        </div>
      )}
    </div>
  );
}

function BinaryUploadForm({ onSubmit, onCancel }: { onSubmit: (file: File, options: { compression: BinaryAsset["compression"]; encryptionKeyId: string | null; tags: string[] }) => void; onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [compression, setCompression] = useState<BinaryAsset["compression"]>("zstd");
  const [encryptionKeyId, setEncryptionKeyId] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    onSubmit(file, { compression, encryptionKeyId, tags: tagList });
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div className={`drop-zone ${dragActive ? "active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("binary-file-input")?.click()}>
        <input id="binary-file-input" type="file" hidden onChange={handleFileSelect} />
        {file ? (
          <div className="selected-file">
            <FileText size={32} /> {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        ) : (
          <>
            <FileText size={32} />
            <p>Drag & drop a binary file or click to browse</p>
            <span className="hint">Max size: 500MB • Any binary format supported</span>
          </>
        )}
      </div>

      <div className="form-group">
        <label>Compression</label>
        <select
          value={compression}
          onChange={(e) => setCompression(e.target.value as BinaryAsset["compression"])}
        >
          <option value="zstd">Zstandard (Recommended - Best Ratio)</option>
          <option value="lz4">LZ4 (Fastest Compression/Decompression)</option>
          <option value="gzip">GZIP (Maximum Compatibility)</option>
          <option value="none">None (Raw Binary)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Encryption Key (Optional)</label>
        <select
          value={encryptionKeyId || ""}
          onChange={(e) => setEncryptionKeyId(e.target.value || null)}
        >
          <option value="">No Encryption</option>
          <option value="auto">Auto-Generate New Key</option>
          <option value="binary-key">binary-asset-key</option>
          <option value="storage-key">storage-encryption-key</option>
          <option value="archive-key">archive-encryption-key</option>
        </select>
        <span className="form-hint">Binary assets are encrypted at rest when a key is selected</span>
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

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!file}>
          <Upload size={14} /> Import Binary
        </button>
      </div>
    </form>
  );
}

export default BinaryAssetPanel;