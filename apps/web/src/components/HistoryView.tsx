import { useState, useEffect } from 'react';
import * as api from '../api/client';
import type { WorkflowInstance } from '../types/api';

interface HistoryViewProps {
  sessionId: string | null;
}

export function HistoryView({ sessionId }: HistoryViewProps) {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api.listWorkflows(sessionId)
      .then(setWorkflows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="canvas glass" style={{ overflow: 'auto' }}>
      <div className="canvas-header">
        <div className="canvas-eyebrow">HISTORIAL DE WORKFLOWS</div>
        <div className="canvas-title">
          {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} ejecutado{workflows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⟳</div>
          <div className="empty-state-text">Cargando historial...</div>
        </div>
      ) : workflows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">
            No hay workflows en el historial. Ejecuta un comando desde el workspace para comenzar.
          </div>
        </div>
      ) : (
        <div className="workflow-track">
          {workflows.slice().reverse().map(wf => (
            <div key={wf.id} className="step">
              <div className={`step-icon ${wf.state === 'completed' ? 'done' : wf.state === 'failed' ? 'error' : 'active'}`}>
                {wf.state === 'completed' ? '✓' : wf.state === 'failed' ? '✕' : '↻'}
              </div>
              <div className="step-body">
                <div className="step-title">
                  {wf.command.charAt(0).toUpperCase() + wf.command.slice(1)}: {wf.context.projectName}
                </div>
                <div className="step-meta">
                  Estado: {wf.state} · {wf.steps.filter(s => s.status === 'completed').length}/{wf.steps.length} pasos
                  · {new Date(wf.createdAt).toLocaleString()}
                </div>
                {wf.result?.summary && (
                  <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
                    {wf.result.summary.slice(0, 120)}
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