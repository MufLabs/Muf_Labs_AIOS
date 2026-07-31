import { useState, useEffect } from 'react';
import type { AgentStatus } from '../types/api';
import { listAgents } from '../api/client';

export function AgentsView() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAgents()
      .then(setAgents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="canvas glass" style={{ overflow: 'auto' }}>
      <div className="canvas-header">
        <div className="canvas-eyebrow">AGENTES DISPONIBLES</div>
        <div className="canvas-title">
          {agents.length} agente{agents.length !== 1 ? 's' : ''} registrado{agents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⟳</div>
          <div className="empty-state-text">Cargando agentes...</div>
        </div>
      ) : agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <div className="empty-state-text">No hay agentes registrados</div>
        </div>
      ) : (
        <div className="workflow-track">
          {agents.map(agent => (
            <div key={agent.agentId} className="step">
              <div className="step-icon done" style={{ width: 32, height: 32, fontSize: 14 }}>
                {agent.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="step-body">
                <div className="step-title">{agent.name}</div>
                <div className="step-meta">
                  Estado: {agent.status} · ID: {agent.agentId.slice(0, 8)}
                </div>
                {agent.capabilities.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {agent.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'var(--bg-panel-strong)',
                          border: '.5px solid var(--border-glass)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {cap.command} ({(cap.confidence * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}