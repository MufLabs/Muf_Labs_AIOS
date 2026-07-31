import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Bell, BellOff, Search, RefreshCw, Filter, Zap, Activity, ShieldAlert, Users, Database, Trash2, Plus } from "lucide-react";

interface GuardianEvent {
  id: string;
  type: "access" | "mutation" | "anomaly" | "policy_violation" | "sync" | "health";
  severity: "info" | "warning" | "critical";
  agentId: string;
  resource: string;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

interface ObserverRule {
  id: string;
  name: string;
  description: string;
  eventTypes: GuardianEvent["type"][];
  severityFilter: GuardianEvent["severity"][];
  agentFilters: string[];
  resourcePatterns: string[];
  actions: ("alert" | "log" | "block" | "notify")[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GuardianState {
  events: GuardianEvent[];
  rules: ObserverRule[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterType: string;
  filterSeverity: string;
  filterAgent: string;
  selectedEvent: GuardianEvent | null;
  selectedRule: ObserverRule | null;
  showCreateRuleModal: boolean;
  autoRefresh: boolean;
  showAcknowledged: boolean;
  timeRange: "1h" | "6h" | "24h" | "7d" | "30d";
}

const SEVERITY_COLORS: Record<GuardianEvent["severity"], string> = {
  info: "var(--accent-info)",
  warning: "var(--accent-warning)",
  critical: "var(--accent-danger)",
};

const TYPE_ICONS: Record<GuardianEvent["type"], string> = {
  access: "🔐",
  mutation: "✏️",
  anomaly: "⚠️",
  policy_violation: "🚫",
  sync: "🔄",
  health: "💚",
};

export function GuardianObserverPanel() {
  const [state, setState] = useState<GuardianState>({
    events: [],
    rules: [],
    loading: true,
    error: null,
    searchQuery: "",
    filterType: "",
    filterSeverity: "",
    filterAgent: "",
    selectedEvent: null,
    selectedRule: null,
    showCreateRuleModal: false,
    autoRefresh: true,
    showAcknowledged: true,
    timeRange: "24h",
  });

  const fetchData = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [eventsRes, rulesRes] = await Promise.all([
        fetch("/api/tbit/guardian/events"),
        fetch("/api/tbit/guardian/rules"),
      ]);
      if (!eventsRes.ok) throw new Error("Failed to fetch events");
      if (!rulesRes.ok) throw new Error("Failed to fetch rules");
      const [events, rules] = await Promise.all([eventsRes.json(), rulesRes.json()]);
      setState((s) => ({ ...s, events, rules, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const acknowledgeEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/tbit/guardian/events/${id}/acknowledge`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to acknowledge");
      await fetchData();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Acknowledge failed" }));
    }
  };

  const createRule = async (rule: Omit<ObserverRule, "id" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch("/api/tbit/guardian/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      if (!response.ok) throw new Error("Failed to create rule");
      await fetchData();
      setState((s) => ({ ...s, showCreateRuleModal: false }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Create rule failed" }));
    }
  };

  const updateRule = async (id: string, updates: Partial<ObserverRule>) => {
    try {
      const response = await fetch(`/api/tbit/guardian/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update rule");
      await fetchData();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Update rule failed" }));
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      const response = await fetch(`/api/tbit/guardian/rules/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete rule");
      await fetchData();
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Delete rule failed" }));
    }
  };

  useEffect(() => {
    fetchData();
    let interval: ReturnType<typeof setInterval>;
    if (state.autoRefresh) {
      interval = setInterval(fetchData, 10000);
    }
    return () => clearInterval(interval);
  }, [state.autoRefresh]);

  const filteredEvents = state.events.filter((event) => {
    const matchesSearch =
      event.agentId.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      event.resource.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesType = !state.filterType || event.type === state.filterType;
    const matchesSeverity = !state.filterSeverity || event.severity === state.filterSeverity;
    const matchesAgent = !state.filterAgent || event.agentId === state.filterAgent;
    const matchesAck = state.showAcknowledged || !event.acknowledged;
    return matchesSearch && matchesType && matchesSeverity && matchesAgent && matchesAck;
  });

  const agents = [...new Set(state.events.map(e => e.agentId))].sort();

  return (
    <div className="tbit-panel guardian-observer-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <Shield className="panel-icon" size={20} />
          <h2 className="panel-title">Guardian Observer</h2>
        </div>
        <div className="panel-actions">
          <input
            type="text"
            placeholder="Search events..."
            value={state.searchQuery}
            onChange={(e) => setState((s) => ({ ...s, searchQuery: e.target.value }))}
            className="panel-search"
          />
          <select value={state.filterType} onChange={(e) => setState((s) => ({ ...s, filterType: e.target.value }))} className="panel-filter">
            <option value="">All Types</option>
            <option value="access">Access</option>
            <option value="mutation">Mutation</option>
            <option value="anomaly">Anomaly</option>
            <option value="policy_violation">Policy Violation</option>
            <option value="sync">Sync</option>
            <option value="health">Health</option>
          </select>
          <select value={state.filterSeverity} onChange={(e) => setState((s) => ({ ...s, filterSeverity: e.target.value }))} className="panel-filter">
            <option value="">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select value={state.filterAgent} onChange={(e) => setState((s) => ({ ...s, filterAgent: e.target.value }))} className="panel-filter">
            <option value="">All Agents</option>
            {agents.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={state.timeRange} onChange={(e) => setState((s) => ({ ...s, timeRange: e.target.value as GuardianState["timeRange"] }))} className="panel-filter">
            <option value="1h">1 Hour</option>
            <option value="6h">6 Hours</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
          <label className="dry-run-toggle">
            <input type="checkbox" checked={state.autoRefresh} onChange={(e) => setState((s) => ({ ...s, autoRefresh: e.target.checked }))} />
            <span>Auto-refresh</span>
          </label>
          <label className="dry-run-toggle">
            <input type="checkbox" checked={state.showAcknowledged} onChange={(e) => setState((s) => ({ ...s, showAcknowledged: e.target.checked }))} />
            <span>Show Acknowledged</span>
          </label>
          <button className="btn btn-secondary" onClick={fetchData}><RefreshCw size={14} /></button>
          <button className="btn btn-primary" onClick={() => setState((s) => ({ ...s, showCreateRuleModal: true }))}>
            <Zap size={14} /> New Rule
          </button>
        </div>
      </div>

      {state.error && <div className="panel-error"><AlertTriangle size={14} /> {state.error} <button onClick={() => setState((s) => ({ ...s, error: null }))}>✕</button></div>}

      <div className="panel-content">
        {state.loading ? <div className="panel-loading">Loading guardian events...</div> : filteredEvents.length === 0 ? (
          <div className="panel-empty"><Shield size={48} className="empty-icon" /><p>No guardian events found</p></div>
        ) : (
          <div className="events-table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Agent</th>
                  <th>Resource</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className={state.selectedEvent?.id === event.id ? "selected" : ""}>
                    <td>{new Date(event.timestamp).toLocaleTimeString()}</td>
                    <td><span className="type-badge">{TYPE_ICONS[event.type]} {event.type.replace("_", " ")}</span></td>
                    <td><span className="status-badge" style={{ background: `${SEVERITY_COLORS[event.severity]}20`, color: SEVERITY_COLORS[event.severity] }}>{event.severity.toUpperCase()}</span></td>
                    <td className="agent-id">{event.agentId}</td>
                    <td><code>{event.resource}</code></td>
                    <td>{event.action}</td>
                    <td className="truncate" style={{ maxWidth: 300 }}>{event.description}</td>
                    <td>{event.acknowledged ? <span className="status-badge enabled"><CheckCircle size={12} /> Acknowledged</span> : <span className="status-badge warning"><AlertTriangle size={12} /> Pending</span>}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={() => setState((s) => ({ ...s, selectedEvent: event }))} title="View Details"><Eye size={14} /></button>
                        {!event.acknowledged && <button className="icon-btn" onClick={() => acknowledgeEvent(event.id)} title="Acknowledge"><CheckCircle size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {state.selectedEvent && (
        <div className="detail-panel">
          <div className="detail-header"><h3>Event Details</h3><button className="detail-close" onClick={() => setState((s) => ({ ...s, selectedEvent: null }))}>✕</button></div>
          <div className="detail-content">
            <div className="detail-grid">
              <div className="detail-item"><strong>Type:</strong> <span className="type-badge">{TYPE_ICONS[state.selectedEvent.type]} {state.selectedEvent.type}</span></div>
              <div className="detail-item"><strong>Severity:</strong> <span className="status-badge" style={{ background: `${SEVERITY_COLORS[state.selectedEvent.severity]}20`, color: SEVERITY_COLORS[state.selectedEvent.severity] }}>{state.selectedEvent.severity.toUpperCase()}</span></div>
              <div className="detail-item"><strong>Agent:</strong> <code>{state.selectedEvent.agentId}</code></div>
              <div className="detail-item"><strong>Resource:</strong> <code>{state.selectedEvent.resource}</code></div>
              <div className="detail-item"><strong>Action:</strong> {state.selectedEvent.action}</div>
              <div className="detail-item"><strong>Timestamp:</strong> {new Date(state.selectedEvent.timestamp).toLocaleString()}</div>
              <div className="detail-item"><strong>Acknowledged:</strong> {state.selectedEvent.acknowledged ? "Yes" : "No"}</div>
              {state.selectedEvent.acknowledged && (
                <>
                  <div className="detail-item"><strong>Acknowledged By:</strong> {state.selectedEvent.acknowledgedBy}</div>
                  <div className="detail-item"><strong>Acknowledged At:</strong> {state.selectedEvent.acknowledgedAt ? new Date(state.selectedEvent.acknowledgedAt).toLocaleString() : "N/A"}</div>
                </>
              )}
            </div>
            <div className="detail-section"><h4>Description</h4><p>{state.selectedEvent.description}</p></div>
            <div className="detail-section"><h4>Metadata</h4><pre>{JSON.stringify(state.selectedEvent.metadata, null, 2)}</pre></div>
            {state.selectedEvent && !state.selectedEvent.acknowledged && <div className="detail-actions"><button className="btn btn-primary" onClick={() => state.selectedEvent && acknowledgeEvent(state.selectedEvent.id)}><CheckCircle size={14} /> Acknowledge</button></div>}
          </div>
        </div>
      )}

      {state.showCreateRuleModal && (
        <div className="modal-overlay" onClick={() => setState((s) => ({ ...s, showCreateRuleModal: false }))}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Create Observer Rule</h3><button className="modal-close" onClick={() => setState((s) => ({ ...s, showCreateRuleModal: false }))}>✕</button></div>
            <RuleForm onSubmit={createRule} onCancel={() => setState((s) => ({ ...s, showCreateRuleModal: false }))} agents={agents} />
          </div>
        </div>
      )}

      <div className="rules-section" style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Observer Rules</h3>
        {state.rules.length === 0 ? (
          <div className="panel-empty" style={{ padding: 24 }}><ShieldAlert size={32} className="empty-icon" /><p>No observer rules configured</p><button className="btn btn-secondary" onClick={() => setState((s) => ({ ...s, showCreateRuleModal: true }))}><Zap size={14} /> Create First Rule</button></div>
        ) : (
          <div className="rules-table-wrapper">
            <table className="rules-table">
              <thead><tr><th>Name</th><th>Event Types</th><th>Severity</th><th>Agents</th><th>Resources</th><th>Actions</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {state.rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="agent-id">{rule.name}</td>
                    <td><div className="actions-tags">{rule.eventTypes.map(t => <span key={t} className="tag">{t}</span>)}</div></td>
                    <td><div className="actions-tags">{rule.severityFilter.map(s => <span key={s} className="tag" style={{ color: SEVERITY_COLORS[s] }}>{s}</span>)}</div></td>
                    <td><div className="actions-tags">{rule.agentFilters.length ? rule.agentFilters.map(a => <span key={a} className="tag">{a}</span>) : <span className="tag tag-more">All</span>}</div></td>
                    <td><div className="resource-patterns">{rule.resourcePatterns.slice(0, 2).map(p => <span key={p} className="pattern-chip">{p}</span>)}{rule.resourcePatterns.length > 2 && <span className="pattern-chip more">+{rule.resourcePatterns.length - 2}</span>}</div></td>
                    <td><div className="actions-tags">{rule.actions.map(a => <span key={a} className="tag tag-allow">{a}</span>)}</div></td>
                    <td><span className={`status-badge ${rule.enabled ? "enabled" : "disabled"}`}>{rule.enabled ? "Active" : "Disabled"}</span></td>
                    <td><div className="action-buttons"><button className="icon-btn" onClick={() => updateRule(rule.id, { enabled: !rule.enabled })} title={rule.enabled ? "Disable" : "Enable"}>{rule.enabled ? <EyeOff size={14} /> : <Eye size={14} />}</button><button className="icon-btn danger" onClick={() => deleteRule(rule.id)} title="Delete"><Trash2 size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RuleForm({ onSubmit, onCancel, agents }: { onSubmit: (data: Omit<ObserverRule, "id" | "createdAt" | "updatedAt">) => void; onCancel: () => void; agents: string[] }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventTypes: [] as GuardianEvent["type"][],
    severityFilter: [] as GuardianEvent["severity"][],
    agentFilters: [] as string[],
    resourcePatterns: ["*"],
    actions: ["alert", "log"] as ("alert" | "log" | "block" | "notify")[],
    enabled: true,
  });
  const [newEventType, setNewEventType] = useState("");
  const [newSeverity, setNewSeverity] = useState("");
  const [newAgent, setNewAgent] = useState("");
  const [newPattern, setNewPattern] = useState("");

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); };

  const addToArray = (field: keyof typeof formData, value: string) => {
    const trimmed = value.trim();
    if (trimmed && !(formData[field] as string[]).includes(trimmed)) {
      setFormData(d => ({ ...d, [field]: [...(d[field] as string[]), trimmed] }));
    }
  };

  const removeFromArray = (field: keyof typeof formData, value: string) => {
    setFormData(d => ({ ...d, [field]: (d[field] as string[]).filter(v => v !== value) }));
  };

  return (
    <form onSubmit={handleSubmit} className="policy-form">
      <div className="form-group"><label>Rule Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))} placeholder="e.g., critical-anomaly-alert" required /></div>
      <div className="form-group"><label>Description</label><textarea value={formData.description} onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))} placeholder="Describe what this rule monitors" rows={3} /></div>

      <div className="form-group"><label>Event Types</label><div className="action-selector"><select value={newEventType} onChange={(e) => setNewEventType(e.target.value)} className="action-select"><option value="">Select type...</option><option value="access">Access</option><option value="mutation">Mutation</option><option value="anomaly">Anomaly</option><option value="policy_violation">Policy Violation</option><option value="sync">Sync</option><option value="health">Health</option></select><button type="button" onClick={() => addToArray("eventTypes", newEventType)} className="btn btn-sm btn-secondary"><Plus size={14} /> Add</button></div><div className="action-tags">{formData.eventTypes.map(t => <span key={t} className="tag tag-allow">{t}<button type="button" onClick={() => removeFromArray("eventTypes", t)}>✕</button></span>)}</div></div>

      <div className="form-group"><label>Severity Filter</label><div className="action-selector"><select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)} className="action-select"><option value="">Select severity...</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select><button type="button" onClick={() => addToArray("severityFilter", newSeverity)} className="btn btn-sm btn-secondary"><Plus size={14} /> Add</button></div><div className="action-tags">{formData.severityFilter.map(s => <span key={s} className="tag" style={{ color: SEVERITY_COLORS[s] }}>{s}<button type="button" onClick={() => removeFromArray("severityFilter", s)}>✕</button></span>)}</div></div>

      <div className="form-group"><label>Agent Filters (empty = all)</label><div className="action-selector"><select value={newAgent} onChange={(e) => setNewAgent(e.target.value)} className="action-select"><option value="">Select agent...</option>{agents.map(a => <option key={a} value={a}>{a}</option>)}</select><button type="button" onClick={() => addToArray("agentFilters", newAgent)} className="btn btn-sm btn-secondary"><Plus size={14} /> Add</button></div><div className="action-tags">{formData.agentFilters.map(a => <span key={a} className="tag">{a}<button type="button" onClick={() => removeFromArray("agentFilters", a)}>✕</button></span>)}</div></div>

      <div className="form-group"><label>Resource Patterns</label><div className="action-selector"><input type="text" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} placeholder="e.g., memory::*, container::*" className="action-input"/><button type="button" onClick={() => addToArray("resourcePatterns", newPattern)} className="btn btn-sm btn-secondary"><Plus size={14} /> Add</button></div><div className="action-tags">{formData.resourcePatterns.map(p => <span key={p} className="pattern-chip">{p}<button type="button" onClick={() => removeFromArray("resourcePatterns", p)}>✕</button></span>)}</div></div>

      <div className="form-group"><label>Actions</label><div className="checkbox-group" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[["alert", "Alert"], ["log", "Log"], ["block", "Block"], ["notify", "Notify"]].map(([val, label]) => (
          <label key={val} className="checkbox-label">
            <input type="checkbox" checked={formData.actions.includes(val as any)} onChange={(e) => { const arr = [...formData.actions]; e.target.checked ? arr.push(val as any) : arr.splice(arr.indexOf(val as any), 1); setFormData(d => ({ ...d, actions: arr })); }} />
            <span>{label}</span>
          </label>
        ))}
      </div></div>

      <div className="form-group checkbox-group"><label className="checkbox-label"><input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData(d => ({ ...d, enabled: e.target.checked }))} /><span>Enabled</span></label></div>

      <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="btn btn-primary"><Zap size={14} /> Create Rule</button></div>
    </form>
  );
}

export default GuardianObserverPanel;