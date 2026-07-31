import { useState, useEffect } from "react";
import { Server, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw, Search, Filter, ChevronDown, ChevronUp, Terminal, BarChart2, RotateCcw, Download, Eye, Loader2 } from "lucide-react";

interface ContainerHealth {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  uptime: number;
  cpu: number;
  memory: number;
  memoryLimit: number;
  disk: number;
  diskLimit: number;
  networkRx: number;
  networkTx: number;
  lastCheck: string;
  logs: string[];
  labels: Record<string, string>;
  healthChecks: Array<{
    name: string;
    status: "pass" | "fail" | "warn";
    message: string;
  }>;
}

interface HealthState {
  containers: ContainerHealth[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterStatus: string;
  selectedContainer: ContainerHealth | null;
  showLogsModal: string | null;
  autoRefresh: boolean;
  sortBy: "name" | "status" | "cpu" | "memory" | "uptime";
  sortDesc: boolean;
}

const STATUS_COLORS: Record<ContainerHealth["status"], string> = {
  healthy: "var(--accent-success)",
  degraded: "var(--accent-warning)",
  unhealthy: "var(--accent-danger)",
  unknown: "var(--text-muted)",
};

const STATUS_ICONS: Record<ContainerHealth["status"], React.ReactNode> = {
  healthy: <CheckCircle size={16} />,
  degraded: <AlertTriangle size={16} />,
  unhealthy: <XCircle size={16} />,
  unknown: <Activity size={16} />,
};

export function ContainerHealthPanel() {
  const [state, setState] = useState<HealthState>({
    containers: [],
    loading: true,
    error: null,
    searchQuery: "",
    filterStatus: "",
    selectedContainer: null,
    showLogsModal: null,
    autoRefresh: true,
    sortBy: "name",
    sortDesc: false,
  });

  const fetchHealth = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch("/api/tbit/containers/health");
      if (!response.ok) throw new Error("Failed to fetch container health");
      const containers = await response.json();
      setState((s) => ({ ...s, containers, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const fetchLogs = async (containerId: string) => {
    try {
      const response = await fetch(`/api/tbit/containers/${containerId}/logs?lines=200`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      const logs = await response.json();
      setState((s) => ({
        ...s,
        containers: s.containers.map((c) =>
          c.id === containerId ? { ...c, logs } : c
        ),
        showLogsModal: containerId,
      }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Failed to fetch logs" }));
    }
  };

  useEffect(() => {
    fetchHealth();
    let interval: ReturnType<typeof setInterval>;
    if (state.autoRefresh) {
      interval = setInterval(fetchHealth, 15000);
    }
    return () => clearInterval(interval);
  }, [state.autoRefresh]);

  const filteredContainers = state.containers
    .filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesStatus = !state.filterStatus || c.status === state.filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any = a[state.sortBy];
      let bVal: any = b[state.sortBy];
      if (state.sortBy === "uptime") {
        aVal = a.uptime;
        bVal = b.uptime;
      }
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      return state.sortDesc ? (aVal > bVal ? -1 : 1) : (aVal > bVal ? 1 : -1);
    });

  const formatBytes = (bytes: number, limit?: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB${limit ? ` / ${(limit / 1e9).toFixed(2)} GB` : ""}`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB${limit ? ` / ${(limit / 1e6).toFixed(2)} MB` : ""}`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB${limit ? ` / ${(limit / 1e3).toFixed(2)} KB` : ""}`;
    return `${bytes} B${limit ? ` / ${limit} B` : ""}`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleSort = (field: HealthState["sortBy"]) => {
    setState((s) => ({
      ...s,
      sortBy: field,
      sortDesc: s.sortBy === field ? !s.sortDesc : false,
    }));
  };

  const getSortIcon = (field: HealthState["sortBy"]) => {
    if (state.sortBy !== field) return <ChevronDown size={12} />;
    return state.sortDesc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="tbit-panel container-health-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <Server className="panel-icon" size={20} />
          <h2 className="panel-title">Container Health</h2>
        </div>
        <div className="panel-actions">
          <input
            type="text"
            placeholder="Search containers..."
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
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="unhealthy">Unhealthy</option>
            <option value="unknown">Unknown</option>
          </select>
          <label className="dry-run-toggle">
            <input
              type="checkbox"
              checked={state.autoRefresh}
              onChange={(e) => setState((s) => ({ ...s, autoRefresh: e.target.checked }))}
            />
            <span>Auto-refresh</span>
          </label>
          <button className="btn btn-secondary" onClick={fetchHealth} title="Refresh">
            <RefreshCw size={14} />
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
          <div className="panel-loading">
            <Loader2 className="spin" size={24} /> Loading container health...
          </div>
        ) : filteredContainers.length === 0 ? (
          <div className="panel-empty">
            <Server size={48} className="empty-icon" />
            <p>{state.containers.length === 0 ? "No containers found" : "No containers match your filters"}</p>
          </div>
        ) : (
          <div className="health-grid">
            {filteredContainers.map((container) => (
              <div
                key={container.id}
                className="health-card"
                onClick={() => setState((s) => ({ ...s, selectedContainer: container }))}
              >
                <div className="health-header">
                  <div className="health-title">
                    <div
                      className="health-icon"
                      style={{
                        background: `rgba(99, 102, 241, 0.15)`,
                        color: "var(--accent-primary)",
                      }}
                    >
                      <Server size={18} />
                    </div>
                    <div>
                      <div className="health-name">{container.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {container.id.slice(0, 12)}...
                      </div>
                    </div>
                  </div>
                  <div className="health-status">
                    <span
                      className="status-indicator"
                      style={{ background: STATUS_COLORS[container.status] }}
                    />
                    <span
                      style={{
                        color: STATUS_COLORS[container.status],
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {container.status}
                    </span>
                  </div>
                </div>
                <div className="health-body">
                  <div className="health-metrics">
                    <div className="metric">
                      <span className="metric-label">CPU</span>
                      <span className="metric-value" style={{ color: container.cpu > 80 ? "var(--accent-danger)" : container.cpu > 60 ? "var(--accent-warning)" : "var(--text-primary)" }}>
                        {container.cpu.toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Memory</span>
                      <span className="metric-value" style={{ color: container.memory / container.memoryLimit > 0.8 ? "var(--accent-danger)" : container.memory / container.memoryLimit > 0.6 ? "var(--accent-warning)" : "var(--text-primary)" }}>
                        {((container.memory / container.memoryLimit) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Uptime</span>
                      <span className="metric-value">{formatUptime(container.uptime)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Disk</span>
                      <span className="metric-value" style={{ color: container.disk / (container.diskLimit || 1) > 0.8 ? "var(--accent-danger)" : "var(--text-primary)" }}>
                        {((container.disk / (container.diskLimit || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {container.healthChecks.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                        Health Checks
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {container.healthChecks.slice(0, 4).map((check, i) => (
                          <span
                            key={i}
                            className="tag"
                            style={{
                              background:
                                check.status === "pass"
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : check.status === "warn"
                                  ? "rgba(245, 158, 11, 0.15)"
                                  : "rgba(239, 68, 68, 0.15)",
                              borderColor:
                                check.status === "pass"
                                  ? "rgba(16, 185, 129, 0.3)"
                                  : check.status === "warn"
                                  ? "rgba(245, 158, 11, 0.3)"
                                  : "rgba(239, 68, 68, 0.3)",
                              color:
                                check.status === "pass"
                                  ? "var(--accent-success)"
                                  : check.status === "warn"
                                  ? "var(--accent-warning)"
                                  : "var(--accent-danger)",
                            }}
                          >
                            {check.name}: {check.status}
                          </span>
                        ))}
                        {container.healthChecks.length > 4 && (
                          <span className="tag tag-more">+{container.healthChecks.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="health-logs" style={{ maxHeight: 100 }}>
                    {container.logs.slice(-5).map((log, i) => (
                      <div key={i} style={{ fontSize: 10, marginBottom: 2 }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {state.selectedContainer && (
        <div className="detail-panel">
          <div className="detail-header">
            <h3>{state.selectedContainer.name}</h3>
            <button className="detail-close" onClick={() => setState((s) => ({ ...s, selectedContainer: null }))}>✕</button>
          </div>
          <div className="detail-content">
            <div className="detail-grid">
              <div className="detail-item"><strong>ID:</strong> <code>{state.selectedContainer.id}</code></div>
              <div className="detail-item">
                <strong>Status:</strong>
                <span
                  className="status-badge"
                  style={{
                    background: `${STATUS_COLORS[state.selectedContainer.status]}20`,
                    color: STATUS_COLORS[state.selectedContainer.status],
                    borderColor: `${STATUS_COLORS[state.selectedContainer.status]}40`,
                  }}
                >
                  {STATUS_ICONS[state.selectedContainer.status]} {state.selectedContainer.status.toUpperCase()}
                </span>
              </div>
              <div className="detail-item"><strong>Uptime:</strong> {formatUptime(state.selectedContainer.uptime)}</div>
              <div className="detail-item"><strong>CPU:</strong> {state.selectedContainer.cpu.toFixed(1)}%</div>
              <div className="detail-item"><strong>Memory:</strong> {formatBytes(state.selectedContainer.memory, state.selectedContainer.memoryLimit)}</div>
              <div className="detail-item"><strong>Disk:</strong> {formatBytes(state.selectedContainer.disk, state.selectedContainer.diskLimit)}</div>
              <div className="detail-item"><strong>Network RX:</strong> {formatBytes(state.selectedContainer.networkRx)}</div>
              <div className="detail-item"><strong>Network TX:</strong> {formatBytes(state.selectedContainer.networkTx)}</div>
              <div className="detail-item"><strong>Last Check:</strong> {new Date(state.selectedContainer.lastCheck).toLocaleString()}</div>
            </div>
            <div className="detail-section">
              <h4>Health Checks</h4>
              {state.selectedContainer.healthChecks.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No health checks configured</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {state.selectedContainer.healthChecks.map((check, i) => (
                    <div
                      key={i}
                      className="detail-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-primary)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <span
                        className="status-badge"
                        style={{
                          background:
                            check.status === "pass"
                              ? "rgba(16, 185, 129, 0.15)"
                              : check.status === "warn"
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                          color:
                            check.status === "pass"
                              ? "var(--accent-success)"
                              : check.status === "warn"
                              ? "var(--accent-warning)"
                              : "var(--accent-danger)",
                          borderColor:
                            check.status === "pass"
                              ? "rgba(16, 185, 129, 0.3)"
                              : check.status === "warn"
                              ? "rgba(245, 158, 11, 0.3)"
                              : "rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        {check.status.toUpperCase()}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{check.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{check.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="detail-section">
              <h4>Labels</h4>
              {Object.keys(state.selectedContainer.labels).length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No labels</p>
              ) : (
                <div className="detail-tags">
                  {Object.entries(state.selectedContainer.labels).map(([k, v]) => (
                    <span key={k} className="tag">
                      {k}: {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={() => fetchLogs(state.selectedContainer!.id)}>
                <Terminal size={14} /> View Logs
              </button>
              <button className="btn btn-secondary">
                <BarChart2 size={14} /> Metrics
              </button>
              <button className="btn btn-secondary">
                <RotateCcw size={14} /> Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {state.showLogsModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showLogsModal: null }))}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Container Logs</h3>
              <button className="modal-close" onClick={() => setState((s) => ({ ...s, showLogsModal: null }))}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "70vh", overflow: "auto" }}>
              <pre style={{ fontFamily: "inherit", fontSize: 11, whiteSpace: "pre-wrap", wordWrap: "break-word", color: "var(--text-secondary)", margin: 0 }}>
                {state.containers.find((c) => c.id === state.showLogsModal)?.logs.join("\n") || "No logs available"}
              </pre>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showLogsModal: null }))}>Close</button>
              <button className="btn btn-primary">
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContainerHealthPanel;