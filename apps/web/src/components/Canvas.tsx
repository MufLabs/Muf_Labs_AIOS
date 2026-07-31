import type { WorkflowInstance } from '../types/api';

interface CanvasProps {
  activeWorkflow: WorkflowInstance | null;
  loading: boolean;
  streamingLog: string[];
  onSendCommand: (prompt: string) => void;
  onCancel: () => void;
}

function WorkflowTrack({ workflow }: { workflow: WorkflowInstance | null }) {
  if (!workflow || workflow.steps.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚡</div>
        <div className="empty-state-text">
          No hay workflow activo. Escribe un comando en lenguaje natural para comenzar.
        </div>
      </div>
    );
  }

  const commandLabel =
    workflow.command === 'analyze' ? 'Análisis' :
    workflow.command === 'implement' ? 'Implementación' : 'Documentación';

  return (
    <>
      <div className="canvas-header">
        <div className="canvas-eyebrow">
          ENGINEERING REQUEST · #{workflow.id.slice(0, 7).toUpperCase()}
        </div>
        <div className="canvas-title">
          {commandLabel}: {workflow.context.projectName}
          <span> · {workflow.state}</span>
        </div>
      </div>

      <div className="workflow-track">
        {workflow.steps.map((step) => {
          const isActive = step.status === 'running';
          const isDone = step.status === 'completed';
          const isError = step.status === 'failed';
          const isPending = step.status === 'pending';
          let icon: string;
          if (isDone) icon = '✓';
          else if (isActive) icon = '↻';
          else if (isError) icon = '✕';
          else icon = String(step.index + 1);

          return (
            <div
              key={step.index}
              className={`step ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''} ${isError ? 'error' : ''}`}
            >
              <div className={`step-icon ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''} ${isError ? 'error' : ''}`}>
                {icon}
              </div>
              <div className="step-body">
                <div className="step-title">
                  {step.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  {isActive && <span className="pulse" />}
                </div>
                <div className="step-meta">
                  {step.handler && `handler: ${step.handler}`}
                  {step.completedAt && ` · ${new Date(step.completedAt).toLocaleTimeString()}`}
                  {isError && ' · Falló'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function Canvas({ activeWorkflow, loading, streamingLog, onSendCommand, onCancel }: CanvasProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('command') as HTMLInputElement;
    if (input.value.trim()) {
      onSendCommand(input.value.trim());
      input.value = '';
    }
  };

  return (
    <div className="canvas glass">
      <WorkflowTrack workflow={activeWorkflow} />

      {loading && activeWorkflow && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button className="btn danger" onClick={onCancel}>Cancelar</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="command-bar">
        <div className={`orb ${loading ? 'loading' : ''}`} />
        <input
          name="command"
          className="command-input"
          type="text"
          placeholder="Pide algo en lenguaje natural… ej. 'analiza este proyecto'"
          disabled={loading}
        />
        <button type="submit" className="command-send" disabled={loading}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>

      {streamingLog.length > 0 && (
        <div className="log-panel" style={{ marginTop: 12 }}>
          {streamingLog.slice(-5).map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}