import type { AgentStatus, WorkflowInstance } from '../types/api';

interface SidePanelProps {
  agents: AgentStatus[];
  activeWorkflow: WorkflowInstance | null;
}

function getAgentInitial(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'busy': return 'working';
    case 'idle': return 'idle';
    default: return 'completed';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'busy': return 'Trabajando ahora';
    case 'idle': return 'Disponible';
    case 'error': return 'Error';
    default: return 'Completado';
  }
}

export function SidePanel({ agents, activeWorkflow }: SidePanelProps) {
  const metrics = activeWorkflow?.result?.metrics;
  const costPercent = metrics?.cost ? Math.min(Math.round((metrics.cost / 0.05) * 100), 100) : 0;
  const tokenPercent = metrics?.tokensUsed ? Math.min(Math.round((metrics.tokensUsed / 5000) * 100), 100) : 0;

  return (
    <div className="side glass">
      {/* Agentes */}
      <div>
        <div className="side-block-title">Agentes activos</div>
        {agents.length === 0 && (
          <div className="memory-card" style={{ fontSize: 11, textAlign: 'center' }}>
            No hay agentes registrados
          </div>
        )}
        {agents.map(agent => (
          <div key={agent.agentId} className={`agent-row ${getStatusClass(agent.status)}`}>
            <div className="agent-avatar">{getAgentInitial(agent.name)}</div>
            <div className="agent-info">
              <div className="agent-name">{agent.name}</div>
              <div className="agent-status">{getStatusLabel(agent.status)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Proveedor y costos */}
      <div>
        <div className="side-block-title">Proveedor en uso</div>
        <div className="provider-bar">
          <span>claude-sonnet-5</span>
          <span>{tokenPercent}% tokens</span>
        </div>
        <div className="track">
          <div className="track-fill" style={{ width: `${tokenPercent}%`, background: 'var(--grad-neural)' }} />
        </div>
        <div className="provider-bar">
          <span>Costo de esta sesión</span>
          <span>${metrics?.cost?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="track">
          <div className="track-fill" style={{ width: `${costPercent}%`, background: 'var(--emerald)' }} />
        </div>
      </div>

      {/* Memoria de ingeniería */}
      <div>
        <div className="side-block-title">Memoria de ingeniería</div>
        <div className="memory-card">
          {activeWorkflow ? (
            <>
              <b>{activeWorkflow.steps.filter(s => s.status === 'completed').length} pasos completados</b>
              {activeWorkflow.result?.summary ? (
                <> · {activeWorkflow.result.summary.slice(0, 100)}</>
              ) : (
                ' · Workflow en ejecución. Las decisiones se registrarán automáticamente.'
              )}
            </>
          ) : (
            <>
              <b>Sistema listo</b> · Crea una sesión y ejecuta un comando para comenzar. Las decisiones de ingeniería se almacenarán en memoria persistente.
            </>
          )}
        </div>
      </div>
    </div>
  );
}