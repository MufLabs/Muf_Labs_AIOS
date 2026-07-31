import { useState, useEffect } from "react";
import { Shield, UserCheck, UserX, Search, RefreshCw, Filter, Plus, Trash2, Edit, Eye, Key, Database, Cpu, Network, HardDrive, AlertTriangle, CheckCircle, XCircle, Settings, RotateCcw, Brain, GitBranch } from "lucide-react";

interface AIPermission {
  id: string;
  agentId: string;
  agentName: string;
  status: "active" | "pending" | "revoked" | "expired";
  resources: string[];
  actions: string[];
  constraints: Record<string, unknown>;
  grantedAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
  usageCount: number;
  metadata: Record<string, unknown>;
}

interface PermissionState {
  permissions: AIPermission[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterStatus: string;
  filterResource: string;
  selectedPermission: AIPermission | null;
  showCreateModal: boolean;
  showEditModal: string | null;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  "memory:*": <Brain size={14} />,
  "container:*": <Cpu size={14} />,
  "network:*": <Network size={14} />,
  "storage:*": <HardDrive size={14} />,
  "llm:*": <Database size={14} />,
  "tools:*": <Settings size={14} />,
  "encryption:*": <Key size={14} />,
  "workflow:*": <RotateCcw size={14} />,
};

const RESOURCE_LABELS: Record<string, string> = {
  "memory:*": "Memory",
  "container:*": "Containers",
  "network:*": "Network",
  "storage:*": "Storage",
  "llm:*": "LLM Access",
  "tools:*": "Tools",
  "encryption:*": "Encryption",
  "workflow:*": "Workflows",
};

const ACTION_LABELS: Record<string, string> = {
  read: "Read",
  write: "Write",
  execute: "Execute",
  admin: "Admin",
  "*": "All",
};

export function AiPermissionsPanel() {
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    loading: true,
    error: null,
    searchQuery: "",
    filterStatus: "",
    filterResource: "",
    selectedPermission: null,
    showCreateModal: false,
    showEditModal: null,
  });

  const fetchPermissions = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch("/api/tbit/permissions");
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const permissions = await response.json();
      setState((s) => ({ ...s, permissions, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const createPermission = async (data: Omit<AIPermission, "id" | "grantedAt" | "usageCount" | "lastUsed">) => {
    try {
      const response = await fetch("/api/tbit/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create permission");
      await fetchPermissions();
      setState((s) => ({ ...s, showCreateModal: false }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Create failed" }));
    }
  };

  const updatePermission = async (id: string, updates: Partial<AIPermission>) => {
    try {
      const response = await fetch(`/api/tbit/permissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update permission");
      await fetchPermissions();
      setState((s) => ({ ...s, showEditModal: null }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Update failed" }));
    }
  };

  const revokePermission = async (id: string) => {
    if (!confirm("Revoke this permission? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/tbit/permissions/${id}/revoke`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to revoke permission");
      await fetchPermissions();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Revoke failed" }));
    }
  };

  const deletePermission = async (id: string) => {
    if (!confirm("Permanently delete this permission?")) return;
    try {
      const response = await fetch(`/api/tbit/permissions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete permission");
      await fetchPermissions();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Delete failed" }));
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filteredPermissions = state.permissions.filter((p) => {
    const matchesSearch =
      p.agentName.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      p.agentId.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      p.resources.some((r) => r.toLowerCase().includes(state.searchQuery.toLowerCase()));
    const matchesStatus = !state.filterStatus || p.status === state.filterStatus;
    const matchesResource = !state.filterResource || p.resources.includes(state.filterResource);
    return matchesSearch && matchesStatus && matchesResource;
  });

  const allResources = [...new Set(state.permissions.flatMap((p) => p.resources))].sort();
  const statuses = ["active", "pending", "revoked", "expired"] as const;

  const getStatusIcon = (status: AIPermission["status"]) => {
    switch (status) {
      case "active": return <CheckCircle size={14} style={{ color: "var(--accent-success)" }} />;
      case "pending": return <AlertTriangle size={14} style={{ color: "var(--accent-warning)" }} />;
      case "revoked": return <XCircle size={14} style={{ color: "var(--accent-danger)" }} />;
      case "expired": return <AlertTriangle size={14} style={{ color: "var(--text-muted)" }} />;
    }
  };

  const getStatusColor = (status: AIPermission["status"]) => {
    switch (status) {
      case "active": return "var(--accent-success)";
      case "pending": return "var(--accent-warning)";
      case "revoked": return "var(--accent-danger)";
      case "expired": return "var(--text-muted)";
    }
  };

  return (
    <div className="tbit-panel ai-permissions-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <Shield className="panel-icon" size={20} />
          <h2 className="panel-title">AI Permissions</h2>
        </div>
        <div className="panel-actions">
          <input
            type="text"
            placeholder="Search agents, resources..."
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
            {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select
            value={state.filterResource}
            onChange={(e) => setState((s) => ({ ...s, filterResource: e.target.value }))}
            className="panel-filter"
          >
            <option value="">All Resources</option>
            {allResources.map((r) => <option key={r} value={r}>{RESOURCE_LABELS[r] || r}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={fetchPermissions} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setState((s) => ({ ...s, showCreateModal: true }))}>
            <Plus size={14} /> Grant Permission
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
          <div className="panel-loading">Loading permissions...</div>
        ) : filteredPermissions.length === 0 ? (
          <div className="panel-empty">
            <Shield size={48} className="empty-icon" />
            <p>{state.permissions.length === 0 ? "No AI permissions configured" : "No permissions match your filters"}</p>
            {state.permissions.length === 0 && (
              <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showCreateModal: true }))}>
                <Plus size={14} /> Grant First Permission
              </button>
            )}
          </div>
        ) : (
          <div className="permissions-grid">
            {filteredPermissions.map((perm) => (
              <div
                key={perm.id}
                className="permission-card"
                onClick={() => setState((s) => ({ ...s, selectedPermission: perm }))}
              >
                <div className="permission-header">
                  <div className="permission-agent">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Shield size={18} style={{ color: "var(--accent-primary)" }} />
                      <span className="permission-agent-name">{perm.agentName}</span>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{perm.agentId.slice(0, 12)}...</span>
                  </div>
                  <div className="permission-status">
                    {getStatusIcon(perm.status)}
                    <span style={{ color: getStatusColor(perm.status), fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                      {perm.status}
                    </span>
                  </div>
                </div>
                <div className="permission-details">
                  <div className="permission-detail">
                    <strong>Resources:</strong>
                    <div className="permission-resources">
                      {perm.resources.slice(0, 4).map((r) => (
                        <span key={r} className="resource-tag">
                          {RESOURCE_ICONS[r]} {RESOURCE_LABELS[r] || r}
                        </span>
                      ))}
                      {perm.resources.length > 4 && <span className="resource-tag tag-more">+{perm.resources.length - 4}</span>}
                    </div>
                  </div>
                  <div className="permission-detail">
                    <strong>Actions:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {perm.actions.map((a) => (
                        <span key={a} className="tag tag-allow">{ACTION_LABELS[a] || a}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-primary)", fontSize: 11, color: "var(--text-muted)" }}>
                  <span>Used {perm.usageCount} times</span>
                  <span>{perm.lastUsed ? new Date(perm.lastUsed).toLocaleDateString() : "Never used"}</span>
                </div>
                <div className="permission-actions">
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setState((s) => ({ ...s, showEditModal: perm.id })); }} title="Edit">
                    <Edit size={14} />
                  </button>
                  {perm.status === "active" && (
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); revokePermission(perm.id); }} title="Revoke">
                      <UserX size={14} />
                    </button>
                  )}
                  <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deletePermission(perm.id); }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {state.selectedPermission && (
        <div className="detail-panel">
          <div className="detail-header">
            <h3>{state.selectedPermission.agentName}</h3>
            <button className="detail-close" onClick={() => setState((s) => ({ ...s, selectedPermission: null }))}>✕</button>
          </div>
          <div className="detail-content">
            <div className="detail-grid">
              <div className="detail-item"><strong>Agent ID:</strong> <code>{state.selectedPermission.agentId}</code></div>
              <div className="detail-item">
                <strong>Status:</strong>
                <span className="status-badge" style={{ background: `${getStatusColor(state.selectedPermission.status)}20`, color: getStatusColor(state.selectedPermission.status), borderColor: `${getStatusColor(state.selectedPermission.status)}40` }}>
                  {getStatusIcon(state.selectedPermission.status)} {state.selectedPermission.status.toUpperCase()}
                </span>
              </div>
              <div className="detail-item"><strong>Granted:</strong> {new Date(state.selectedPermission.grantedAt).toLocaleString()}</div>
              <div className="detail-item"><strong>Expires:</strong> {state.selectedPermission.expiresAt ? new Date(state.selectedPermission.expiresAt).toLocaleString() : "Never"}</div>
              <div className="detail-item"><strong>Last Used:</strong> {state.selectedPermission.lastUsed ? new Date(state.selectedPermission.lastUsed).toLocaleString() : "Never"}</div>
              <div className="detail-item"><strong>Usage Count:</strong> {state.selectedPermission.usageCount}</div>
            </div>
            <div className="detail-section">
              <h4>Resources</h4>
              <div className="detail-tags">
                {state.selectedPermission.resources.map((r) => (
                  <span key={r} className="tag">
                    {RESOURCE_ICONS[r]} {RESOURCE_LABELS[r] || r}
                  </span>
                ))}
              </div>
            </div>
            <div className="detail-section">
              <h4>Actions</h4>
              <div className="detail-tags">
                {state.selectedPermission.actions.map((a) => (
                  <span key={a} className="tag tag-allow">{ACTION_LABELS[a] || a}</span>
                ))}
              </div>
            </div>
            <div className="detail-section">
              <h4>Constraints</h4>
              <pre>{JSON.stringify(state.selectedPermission.constraints, null, 2)}</pre>
            </div>
            <div className="detail-section">
              <h4>Metadata</h4>
              <pre>{JSON.stringify(state.selectedPermission.metadata, null, 2)}</pre>
            </div>
            <div className="detail-actions">
              {state.selectedPermission && state.selectedPermission.status === "active" && (
                <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showEditModal: state.selectedPermission!.id }))}>
                  <Edit size={14} /> Edit
                </button>
              )}
              {state.selectedPermission && state.selectedPermission.status === "active" && (
                <button className="btn btn-danger" onClick={() => state.selectedPermission && revokePermission(state.selectedPermission.id)}>
                  <UserX size={14} /> Revoke
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {state.showCreateModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showCreateModal: false }))}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Grant New Permission</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showCreateModal: false }))}>✕</button>
            </div>
            <PermissionForm onSubmit={createPermission} onCancel={() => setState((s) => ({ ...s, showCreateModal: false }))} />
          </div>
        </div>
      )}

      {state.showEditModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showEditModal: null }))}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Permission</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showEditModal: null }))}>✕</button>
            </div>
            <PermissionForm
              initialData={state.permissions.find((p) => p.id === state.showEditModal)!}
              onSubmit={(data) => updatePermission(state.showEditModal!, data)}
              onCancel={() => setState((s) => ({ ...s, showEditModal: null }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionForm({ onSubmit, onCancel, initialData }: { onSubmit: (data: Omit<AIPermission, "id" | "grantedAt" | "usageCount" | "lastUsed">) => void; onCancel: () => void; initialData?: AIPermission }) {
  const [formData, setFormData] = useState({
    agentId: initialData?.agentId || "",
    agentName: initialData?.agentName || "",
    status: initialData?.status || "active" as AIPermission["status"],
    resources: initialData?.resources || [] as string[],
    actions: initialData?.actions || [] as string[],
    constraints: initialData?.constraints || {},
    expiresAt: initialData?.expiresAt || null,
    metadata: initialData?.metadata || {},
  });
  const [newResource, setNewResource] = useState("");
  const [newAction, setNewAction] = useState("");

  const availableResources = [
    "memory:*",
    "container:*",
    "network:*",
    "storage:*",
    "llm:*",
    "tools:*",
    "encryption:*",
    "workflow:*",
  ];

  const availableActions = ["read", "write", "execute", "admin", "*"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addResource = () => {
    if (newResource && !formData.resources.includes(newResource)) {
      setFormData((d) => ({ ...d, resources: [...d.resources, newResource] }));
      setNewResource("");
    }
  };

  const addAction = () => {
    if (newAction && !formData.actions.includes(newAction)) {
      setFormData((d) => ({ ...d, actions: [...d.actions, newAction] }));
      setNewAction("");
    }
  };

  const removeResource = (r: string) => setFormData((d) => ({ ...d, resources: d.resources.filter((x) => x !== r) }));
  const removeAction = (a: string) => setFormData((d) => ({ ...d, actions: d.actions.filter((x) => x !== a) }));

  return (
    <form onSubmit={handleSubmit} className="permission-form">
      <div className="form-group">
        <label>Agent ID *</label>
        <input
          type="text"
          value={formData.agentId}
          onChange={(e) => setFormData((d) => ({ ...d, agentId: e.target.value }))}
          placeholder="agent-uuid-or-name"
          required
        />
      </div>
      <div className="form-group">
        <label>Agent Name *</label>
        <input
          type="text"
          value={formData.agentName}
          onChange={(e) => setFormData((d) => ({ ...d, agentName: e.target.value }))}
          placeholder="Display name"
          required
        />
      </div>
      <div className="form-group">
        <label>Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData((d) => ({ ...d, status: e.target.value as AIPermission["status"] }))}
        >
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>
      <div className="form-group">
        <label>Resources</label>
        <div className="action-selector">
          <select value={newResource} onChange={(e) => setNewResource(e.target.value)} className="action-select">
            <option value="">Select resource...</option>
            {availableResources.map((r) => <option key={r} value={r}>{RESOURCE_LABELS[r] || r}</option>)}
          </select>
          <button type="button" onClick={addResource} className="btn btn-sm btn-secondary">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="action-tags">
          {formData.resources.map((r) => (
            <span key={r} className="tag">
              {RESOURCE_ICONS[r]} {RESOURCE_LABELS[r] || r}
              <button type="button" onClick={() => removeResource(r)}>✕</button>
            </span>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Actions</label>
        <div className="action-selector">
          <select value={newAction} onChange={(e) => setNewAction(e.target.value)} className="action-select">
            <option value="">Select action...</option>
            {availableActions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}
          </select>
          <button type="button" onClick={addAction} className="btn btn-sm btn-secondary">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="action-tags">
          {formData.actions.map((a) => (
            <span key={a} className="tag tag-allow">
              {ACTION_LABELS[a] || a}
              <button type="button" onClick={() => removeAction(a)}>✕</button>
            </span>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Expires At (optional)</label>
        <input
          type="datetime-local"
          value={formData.expiresAt ? formData.expiresAt.slice(0, 16) : ""}
          onChange={(e) => setFormData((d) => ({ ...d, expiresAt: e.target.value || null }))}
        />
      </div>
      <div className="form-group">
        <label>Constraints (JSON)</label>
        <textarea
          value={JSON.stringify(formData.constraints, null, 2)}
          onChange={(e) => {
            try {
              setFormData((d) => ({ ...d, constraints: JSON.parse(e.target.value) }));
            } catch {}
          }}
          rows={4}
          placeholder='{"maxTokens": 4000, "allowedModels": ["gpt-4"]}'
        />
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
          placeholder='{"environment": "production", "owner": "team-ai"}'
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          <Shield size={14} /> {initialData ? "Update" : "Grant"} Permission
        </button>
      </div>
    </form>
  );
}

export default AiPermissionsPanel;