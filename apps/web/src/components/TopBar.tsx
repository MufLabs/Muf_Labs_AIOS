import type { Session } from '../types/api';

interface TopBarProps {
  session: Session | null;
}

export function TopBar({ session }: TopBarProps) {
  return (
    <div className="topbar glass">
      <div className="brand">
        <div className="brand-mark" />
        <span className="brand-name">MufLabs AIOS</span>
        <span className="brand-sub">
          workspace / {session?.context?.projectName || 'sin proyecto'}
        </span>
      </div>
      <div className="topbar-right">
        {session && (
          <div className="autonomy-chip">
            <span className="autonomy-dot" />
            Autonomía: <b>Nivel {session.config.autonomyLevel} · Guiada</b>
          </div>
        )}
        <div className="avatar">OP</div>
      </div>
    </div>
  );
}