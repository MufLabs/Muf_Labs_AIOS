import { useState } from "react";
import {
  AiPermissionsPanel,
  AssetManagerPanel,
  BinaryAssetPanel,
  ContainerHealthPanel,
  EncryptionKeyPanel,
  GuardianObserverPanel,
  MarkdownImportPanel,
  MemoryGraphPanel,
  QueryIndexPanel,
} from "./components/tbit";
import "./styles/tbit-panels.css";

type PanelType =
  | "permissions"
  | "assets"
  | "binary"
  | "health"
  | "encryption"
  | "guardian"
  | "markdown"
  | "memory"
  | "query";

interface PanelConfig {
  id: PanelType;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const PANELS: PanelConfig[] = [
  {
    id: "health",
    label: "Container Health",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M23 19a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v6z"/></svg>,
    component: <ContainerHealthPanel />,
  },
  {
    id: "permissions",
    label: "AI Permissions",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
    component: <AiPermissionsPanel />,
  },
  {
    id: "encryption",
    label: "Encryption Keys",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="11" width="20" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    component: <EncryptionKeyPanel />,
  },
  {
    id: "assets",
    label: "Asset Manager",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14"/><path d="M17 17H4"/><path d="M12 11v6"/><path d="M9 11V5"/><path d="M15 11V5"/></svg>,
    component: <AssetManagerPanel />,
  },
  {
    id: "binary",
    label: "Binary Assets",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    component: <BinaryAssetPanel />,
  },
  {
    id: "memory",
    label: "Memory Graph",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v9"/><path d="M4.5 10.5C4.5 13 7 15 12 15s7.5-2 7.5-4.5"/><path d="M7.5 10.5C7.5 13 10 15 12 15s4.5-2 4.5-4.5"/></svg>,
    component: <MemoryGraphPanel />,
  },
  {
    id: "query",
    label: "Query Indexes",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    component: <QueryIndexPanel />,
  },
  {
    id: "markdown",
    label: "Markdown Import",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    component: <MarkdownImportPanel />,
  },
  {
    id: "guardian",
    label: "Guardian Observer",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
    component: <GuardianObserverPanel />,
  },
];

export function App() {
  const [activePanel, setActivePanel] = useState<PanelType>("health");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activePanelConfig = PANELS.find((p) => p.id === activePanel)!;

  return (
    <div className="tbit-app">
      <header className="app-header">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <div className="app-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--accent-primary)" }}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>T-Bit Control Plane</span>
          </div>
        </div>
        <div className="header-right">
          <div className="connection-status">
            <span className="status-dot connected" />
            <span>Connected</span>
          </div>
          <div className="user-menu">
            <button className="icon-btn" title="Settings"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg></button>
            <div className="user-avatar">TB</div>
          </div>
        </div>
      </header>

      <div className="app-body">
        {sidebarOpen && (
          <aside className="app-sidebar">
            <nav className="sidebar-nav">
              {PANELS.map((panel) => (
                <button
                  key={panel.id}
                  className={`nav-item ${activePanel === panel.id ? "active" : ""}`}
                  onClick={() => setActivePanel(panel.id)}
                >
                  <span className="nav-icon">{panel.icon}</span>
                  <span className="nav-label">{panel.label}</span>
                </button>
              ))}
            </nav>
            <div className="sidebar-footer">
              <div className="version-info">
                <span>T-Bit v1.0.0</span>
                <span className="build-info">AIOS MVP</span>
              </div>
            </div>
          </aside>
        )}

        <main className="app-main" style={{ marginLeft: sidebarOpen ? "260px" : 0 }}>
          <div className="panel-container">
            {activePanelConfig.component}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;