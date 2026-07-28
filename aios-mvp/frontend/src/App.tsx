import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { RailNav } from './components/RailNav';
import { Canvas } from './components/Canvas';
import { SidePanel } from './components/SidePanel';
import { AgentsView } from './components/AgentsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { QVaultView } from './components/qvault/QVaultView';
import { useSession } from './hooks/useSession';
import type { EngineeringCommand } from './types/api';

function detectCommand(prompt: string): EngineeringCommand {
  const lower = prompt.toLowerCase();
  if (lower.startsWith('doc') || lower.includes('documenta') || lower.includes('genera doc')) {
    return 'document';
  }
  if (lower.startsWith('impl') || lower.includes('implementa') || lower.includes('crea') || lower.includes('añade')) {
    return 'implement';
  }
  return 'analyze';
}

export default function App() {
  const {
    session,
    activeWorkflow,
    agents,
    workflows,
    loading,
    error,
    streamingLog,
    initSession,
    runCommand,
    cancelActiveWorkflow,
    refreshWorkflows,
    clearError,
  } = useSession();

  const [activeView, setActiveView] = useState<'workspace' | 'agents' | 'history' | 'settings' | 'qvault'>('workspace');

  // Auto-create session on mount
  useEffect(() => {
    initSession('aios-mvp');
  }, [initSession]);

  const handleSendCommand = useCallback((prompt: string) => {
    const command = detectCommand(prompt);
    runCommand(command, prompt);
  }, [runCommand]);

  // Refresh history when returning to it
  useEffect(() => {
    if (activeView === 'history' && session) {
      refreshWorkflows();
    }
  }, [activeView, session, refreshWorkflows]);

  // Auto-dismiss error after 5s
  useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 5000);
      return () => clearTimeout(t);
    }
  }, [error, clearError]);

  return (
    <div className="app">
      <TopBar session={session} />
      <RailNav activeView={activeView} onViewChange={setActiveView} />

      {/* Main content area changes based on active view */}
      {activeView === 'workspace' && (
        <Canvas
          activeWorkflow={activeWorkflow}
          loading={loading}
          streamingLog={streamingLog}
          onSendCommand={handleSendCommand}
          onCancel={cancelActiveWorkflow}
        />
      )}
      {activeView === 'agents' && <AgentsView />}
      {activeView === 'history' && <HistoryView sessionId={session?.id || null} />}
      {activeView === 'settings' && <SettingsView session={session} />}
      {activeView === 'qvault' && <QVaultView />}

      <SidePanel agents={agents} activeWorkflow={activeWorkflow} />

      {/* Error toast */}
      {error && (
        <div className="error-toast" onClick={clearError}>
          {error}
        </div>
      )}
    </div>
  );
}
