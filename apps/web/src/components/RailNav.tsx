import type { ReactNode } from 'react';

type RailView = 'workspace' | 'agents' | 'history' | 'settings' | 'qvault';

interface RailNavProps {
  activeView: RailView;
  onViewChange: (view: RailView) => void;
}

interface RailItem {
  id: RailView;
  label: string;
  svg: ReactNode;
}

export function RailNav({ activeView, onViewChange }: RailNavProps) {
  const items: RailItem[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: 'agents',
      label: 'Agentes',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Historial',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 5h16M4 12h16M4 19h10" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Configuración',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
        </svg>
      ),
    },
    {
      id: 'qvault',
      label: 'Q-Vault',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="12" cy="12" r="8" opacity="0.5" strokeDasharray="3 3" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="rail glass">
      {items.map(item => (
        <button
          key={item.id}
          className={`rail-item ${activeView === item.id ? 'active' : ''}`}
          onClick={() => onViewChange(item.id)}
          title={item.label}
        >
          {item.svg}
        </button>
      ))}
      <div className="rail-spacer" />
      <button className="rail-item ghost" title="Ajustes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z" />
        </svg>
      </button>
    </div>
  );
}