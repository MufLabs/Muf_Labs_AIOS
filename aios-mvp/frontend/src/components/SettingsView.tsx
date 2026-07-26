import type { Session } from '../types/api';

interface SettingsViewProps {
  session: Session | null;
}

export function SettingsView({ session }: SettingsViewProps) {
  if (!session) {
    return (
      <div className="canvas glass">
        <div className="empty-state">
          <div className="empty-state-icon">⚙️</div>
          <div className="empty-state-text">
            Crea una sesión primero para acceder a la configuración.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas glass" style={{ overflow: 'auto' }}>
      <div className="canvas-header">
        <div className="canvas-eyebrow">CONFIGURACIÓN</div>
        <div className="canvas-title">Ajustes de la sesión</div>
      </div>

      <div className="workflow-track" style={{ maxWidth: 500 }}>
        {/* Project Info */}
        <div className="step" style={{ cursor: 'default' }}>
          <div className="step-icon done" style={{ width: 32, height: 32 }}>📁</div>
          <div className="step-body">
            <div className="step-title">Proyecto</div>
            <div className="step-meta">{session.context.projectName || 'Sin nombre'}</div>
          </div>
        </div>

        {/* Autonomy Level */}
        <div className="step" style={{ cursor: 'default' }}>
          <div className="step-icon done" style={{ width: 32, height: 32 }}>🎯</div>
          <div className="step-body">
            <div className="step-title">Nivel de autonomía</div>
            <div className="step-meta">Nivel {session.config.autonomyLevel}</div>
          </div>
        </div>

        {/* Profile */}
        <div className="step" style={{ cursor: 'default' }}>
          <div className="step-icon done" style={{ width: 32, height: 32 }}>📊</div>
          <div className="step-body">
            <div className="step-title">Perfil de ejecución</div>
            <div className="step-meta">{session.config.executionProfile}</div>
          </div>
        </div>

        {/* Provider */}
        <div className="step" style={{ cursor: 'default' }}>
          <div className="step-icon done" style={{ width: 32, height: 32 }}>☁️</div>
          <div className="step-body">
            <div className="step-title">Proveedor</div>
            <div className="step-meta">{session.config.preferredProvider}</div>
          </div>
        </div>

        {/* Session ID */}
        <div className="step" style={{ cursor: 'default' }}>
          <div className="step-icon done" style={{ width: 32, height: 32 }}>🔑</div>
          <div className="step-body">
            <div className="step-title">ID de sesión</div>
            <div className="step-meta" style={{ fontSize: 10 }}>{session.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}