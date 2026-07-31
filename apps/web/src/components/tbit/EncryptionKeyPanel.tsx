import { useState, useEffect } from "react";
import { Key, RefreshCw, Plus, Copy, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, RotateCcw, Shield } from "lucide-react";
import { encryptionClient } from "../../api/tbit/encryptionClient";

interface EncryptionKey {
  id: string;
  name: string;
  algorithm: "AES-256-GCM" | "ChaCha20-Poly1305" | "XChaCha20-Poly1305";
  keyData: string;
  keyHash: string;
  purpose: "container" | "assets" | "memory" | "backup" | "transport";
  status: "active" | "rotated" | "revoked" | "pending";
  createdAt: string;
  rotatedAt: string | null;
  expiresAt: string | null;
  rotationIntervalDays: number;
  autoRotate: boolean;
}

interface KeyState {
  keys: EncryptionKey[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedKey: EncryptionKey | null;
  showCreateModal: boolean;
  showKeyValue: boolean;
}

const PURPOSE_LABELS: Record<EncryptionKey["purpose"], string> = {
  container: "Container Encryption",
  assets: "Asset Encryption",
  memory: "Memory Encryption",
  backup: "Backup Encryption",
  transport: "Transport Encryption",
};

const STATUS_COLORS: Record<EncryptionKey["status"], string> = {
  active: "#10b981",
  rotated: "#3b82f6",
  revoked: "#ef4444",
  pending: "#f59e0b",
};

export function EncryptionKeyPanel() {
  const [state, setState] = useState<KeyState>({
    keys: [],
    loading: true,
    error: null,
    searchQuery: "",
    selectedKey: null,
    showCreateModal: false,
    showKeyValue: false,
  });

  const fetchKeys = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch("/api/tbit/encryption/keys");
      if (!response.ok) throw new Error("Failed to fetch keys");
      const keys = await response.json();
      setState((s) => ({ ...s, keys, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const createKey = async (key: Omit<EncryptionKey, "id" | "keyHash" | "createdAt" | "rotatedAt">) => {
    try {
      const response = await fetch("/api/tbit/encryption/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(key),
      });
      if (!response.ok) throw new Error("Failed to create key");
      await fetchKeys();
      setState((s) => ({ ...s, showCreateModal: false }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const rotateKey = async (id: string) => {
    if (!confirm("Rotate this key? A new key will be generated and the old one marked as rotated.")) return;
    try {
      const response = await fetch(`/api/tbit/encryption/keys/${id}/rotate`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to rotate key");
      await fetchKeys();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Rotation failed" }));
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Revoke this key? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/tbit/encryption/keys/${id}/revoke`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to revoke key");
      await fetchKeys();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Revocation failed" }));
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Permanently delete this key? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/tbit/encryption/keys/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete key");
      await fetchKeys();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Deletion failed" }));
    }
  };

  const copyKeyValue = async (keyData: string) => {
    await navigator.clipboard.writeText(keyData);
    setState((s) => ({ ...s, showKeyValue: false }));
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const filteredKeys = state.keys.filter(
    (key) =>
      key.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      key.purpose.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      key.algorithm.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="tbit-panel encryption-key-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <Key className="panel-icon" size={20} />
          <h2 className="panel-title">Encryption Keys</h2>
        </div>
        <div className="panel-actions">
          <input
            type="text"
            placeholder="Search keys..."
            value={state.searchQuery}
            onChange={(e) => setState((s) => ({ ...s, searchQuery: e.target.value }))}
            className="panel-search"
          />
          <button className="btn btn-secondary" onClick={fetchKeys}>
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setState((s) => ({ ...s, showCreateModal: true, selectedKey: null }))}>
            <Plus size={14} /> Generate Key
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
          <div className="panel-loading">Loading keys...</div>
        ) : filteredKeys.length === 0 ? (
          <div className="panel-empty">
            <Key size={48} className="empty-icon" />
            <p>No encryption keys found</p>
            <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showCreateModal: true }))}>
              <Plus size={14} /> Generate First Key
            </button>
          </div>
        ) : (
          <div className="keys-table-wrapper">
            <table className="keys-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Purpose</th>
                  <th>Algorithm</th>
                  <th>Status</th>
                  <th>Expires In</th>
                  <th>Auto-Rotate</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((key) => (
                  <tr key={key.id} className={state.selectedKey?.id === key.id ? "selected" : ""}>
                    <td className="key-name">{key.name}</td>
                    <td>
                      <span className="purpose-badge">{PURPOSE_LABELS[key.purpose]}</span>
                    </td>
                    <td><code>{key.algorithm}</code></td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: STATUS_COLORS[key.status] + "20", color: STATUS_COLORS[key.status] }}
                      >
                        {key.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {key.expiresAt ? (
                        <>
                          {getDaysUntilExpiry(key.expiresAt) !== null && (
                            <span className={getDaysUntilExpiry(key.expiresAt)! <= 7 ? "expiry-warning" : ""}>
                              {getDaysUntilExpiry(key.expiresAt)} days
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="no-expiry">Never</span>
                      )}
                    </td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={key.autoRotate}
                          onChange={() => {}} // Would need API call
                          disabled
                        />
                        <span className="slider" />
                      </label>
                    </td>
                    <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-btn"
                          onClick={() => setState((s) => ({ ...s, selectedKey: key }))}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => {
                            setState((s) => ({ ...s, selectedKey: key, showKeyValue: true }));
                          }}
                          title="Copy Key"
                        >
                          <Copy size={14} />
                        </button>
                        {key.status === "active" && (
                          <button
                            className="icon-btn"
                            onClick={() => rotateKey(key.id)}
                            title="Rotate Key"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {key.status === "active" && (
                          <button
                            className="icon-btn danger"
                            onClick={() => revokeKey(key.id)}
                            title="Revoke Key"
                          >
                            <Shield size={14} />
                          </button>
                        )}
                        {key.status !== "active" && (
                          <button
                            className="icon-btn danger"
                            onClick={() => deleteKey(key.id)}
                            title="Delete Key"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {state.showKeyValue && state.selectedKey && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showKeyValue: false }))}>
          <div className="modal modal-warning" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header warning">
              <AlertTriangle size={20} />
              <h3>⚠️ Sensitive Key Material</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showKeyValue: false }))}>✕</button>
            </div>
            <div className="modal-body">
              <p className="warning-text">This key value will only be shown once. Copy it now and store securely.</p>
              <div className="key-value-display">
                <code>{state.selectedKey.keyData}</code>
                <button
                  className="btn btn-primary"
                  onClick={() => copyKeyValue(state.selectedKey!.keyData)}
                >
                  <Copy size={14} /> Copy to Clipboard
                </button>
              </div>
              <div className="key-hash">
                <strong>Key Hash (for verification):</strong>
                <code>{state.selectedKey.keyHash}</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {state.showCreateModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showCreateModal: false }))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate New Encryption Key</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showCreateModal: false }))}>✕</button>
            </div>
            <KeyGenerationForm onSubmit={createKey} onCancel={() => setState((s) => ({ ...s, showCreateModal: false }))} />
          </div>
        </div>
      )}

      {state.selectedKey && !state.showCreateModal && !state.showKeyValue && (
        <div className="detail-panel">
          <div className="detail-header">
            <h3>{state.selectedKey.name}</h3>
            <button className="detail-close" onClick={() => setState((s) => ({ ...s, selectedKey: null }))}>✕</button>
          </div>
          <div className="detail-content">
            <div className="detail-grid">
              <div className="detail-item"><strong>Purpose:</strong> {PURPOSE_LABELS[state.selectedKey.purpose]}</div>
              <div className="detail-item"><strong>Algorithm:</strong> {state.selectedKey.algorithm}</div>
              <div className="detail-item"><strong>Status:</strong> <span style={{ color: STATUS_COLORS[state.selectedKey.status] }}>{state.selectedKey.status}</span></div>
              <div className="detail-item"><strong>Key Hash:</strong> <code>{state.selectedKey.keyHash}</code></div>
              <div className="detail-item"><strong>Created:</strong> {new Date(state.selectedKey.createdAt).toLocaleString()}</div>
              <div className="detail-item"><strong>Last Rotated:</strong> {state.selectedKey.rotatedAt ? new Date(state.selectedKey.rotatedAt).toLocaleString() : "Never"}</div>
              <div className="detail-item"><strong>Expires:</strong> {state.selectedKey.expiresAt ? new Date(state.selectedKey.expiresAt).toLocaleString() : "Never"}</div>
              <div className="detail-item"><strong>Rotation Interval:</strong> {state.selectedKey.rotationIntervalDays} days</div>
              <div className="detail-item"><strong>Auto-Rotate:</strong> {state.selectedKey.autoRotate ? "Yes" : "No"}</div>
            </div>
            <div className="detail-actions">
              {state.selectedKey.status === "active" && (
                <button className="btn btn-secondary" onClick={() => rotateKey(state.selectedKey!.id)}>
                  <RotateCcw size={14} /> Rotate Key
                </button>
              )}
              {state.selectedKey.status === "active" && (
                <button className="btn btn-warning" onClick={() => revokeKey(state.selectedKey!.id)}>
                  <Shield size={14} /> Revoke Key
                </button>
              )}
              {state.selectedKey.status !== "active" && (
                <button className="btn btn-danger" onClick={() => deleteKey(state.selectedKey!.id)}>
                  <Trash2 size={14} /> Delete Key
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyGenerationForm({ onSubmit, onCancel }: { onSubmit: (data: Omit<EncryptionKey, "id" | "keyHash" | "createdAt" | "rotatedAt">) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    algorithm: "AES-256-GCM" as EncryptionKey["algorithm"],
    purpose: "container" as EncryptionKey["purpose"],
    rotationIntervalDays: 90,
    autoRotate: true,
    expiresAt: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      keyData: "", // Generated server-side
      status: "pending",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="key-gen-form">
      <div className="form-group">
        <label>Key Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
          placeholder="e.g., container-master-key-2024"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Algorithm</label>
          <select
            value={formData.algorithm}
            onChange={(e) => setFormData((d) => ({ ...d, algorithm: e.target.value as EncryptionKey["algorithm"] }))}
          >
            <option value="AES-256-GCM">AES-256-GCM (Recommended)</option>
            <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
            <option value="XChaCha20-Poly1305">XChaCha20-Poly1305</option>
          </select>
        </div>
        <div className="form-group">
          <label>Purpose</label>
          <select
            value={formData.purpose}
            onChange={(e) => setFormData((d) => ({ ...d, purpose: e.target.value as EncryptionKey["purpose"] }))}
          >
            <option value="container">Container Encryption</option>
            <option value="assets">Asset Encryption</option>
            <option value="memory">Memory Encryption</option>
            <option value="backup">Backup Encryption</option>
            <option value="transport">Transport Encryption</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Rotation Interval (days)</label>
          <input
            type="number"
            value={formData.rotationIntervalDays}
            onChange={(e) => setFormData((d) => ({ ...d, rotationIntervalDays: parseInt(e.target.value) || 90 }))}
            min={1}
            max={3650}
          />
        </div>
        <div className="form-group">
          <label>Expiration Date (optional)</label>
          <input
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData((d) => ({ ...d, expiresAt: e.target.value }))}
          />
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.autoRotate}
            onChange={(e) => setFormData((d) => ({ ...d, autoRotate: e.target.checked }))}
          />
          <span>Enable automatic rotation</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          <Key size={14} /> Generate Key
        </button>
      </div>
    </form>
  );
}

export default EncryptionKeyPanel;