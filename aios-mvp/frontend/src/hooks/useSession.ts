import { useState, useCallback } from 'react';
import * as api from '../api/client';
import { tbitRegistrationClient } from '../api/tbit/tbitRegistrationClient';
import type { Session, WorkflowInstance, EngineeringCommand, AgentStatus } from '../types/api';

const USER_ID = 'user-001';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowInstance | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingLog, setStreamingLog] = useState<string[]>([]);

  const log = useCallback((msg: string) => {
    setStreamingLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const initSession = useCallback(async (projectPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const s = await api.createSession(USER_ID, projectPath);
      setSession(s);
      log(`Sesión creada: ${s.id.slice(0, 8)}...`);
      
      // Bootstrap T-Bit container on first run
      if (!tbitRegistrationClient.hasExistingContainer()) {
        log('Inicializando contenedor T-Bit...');
        const container = await tbitRegistrationClient.bootstrap(USER_ID, `AIOS Space ${USER_ID}`);
        log(`Contenedor T-Bit creado: ${container.containerId}`);
      } else {
        log(`Contenedor T-Bit existente: ${tbitRegistrationClient.getContainerId()}`);
      }

      const agentList = await api.listAgents();
      setAgents(agentList);
      log(`${agentList.length} agente(s) disponible(s)`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [log]);

  const runCommand = useCallback(async (command: EngineeringCommand, userPrompt: string) => {
    if (!session) {
      setError('Crea una sesión primero');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const wf = await api.executeWorkflow({ sessionId: session.id, command, userPrompt });
      setActiveWorkflow(wf);
      log(`Workflow ${command} iniciado: ${wf.id.slice(0, 8)}...`);
      // Poll for updates
      pollWorkflow(wf.id);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, [session, log]);

  const pollWorkflow = useCallback(async (workflowId: string) => {
    const poll = async () => {
      try {
        const wf = await api.getWorkflow(workflowId);
        setActiveWorkflow(wf);
        const running = wf.steps.some(s => s.status === 'running');
        const failed = wf.steps.some(s => s.status === 'failed');
        if (running && !failed) {
          setTimeout(poll, 1000);
        } else {
          setLoading(false);
          if (wf.state === 'completed') {
            log('Workflow completado exitosamente');
          }
        }
      } catch {
        setLoading(false);
      }
    };
    setTimeout(poll, 500);
  }, [log]);

  const refreshWorkflows = useCallback(async () => {
    if (!session) return;
    try {
      const list = await api.listWorkflows(session.id);
      setWorkflows(list);
    } catch {}
  }, [session]);

  const cancelActiveWorkflow = useCallback(async () => {
    if (!activeWorkflow) return;
    try {
      const wf = await api.cancelWorkflow(activeWorkflow.id);
      setActiveWorkflow(wf);
      log('Workflow cancelado');
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
    }
  }, [activeWorkflow, log]);

  const clearError = useCallback(() => setError(null), []);

  return {
    session,
    activeWorkflow,
    workflows,
    agents,
    loading,
    error,
    streamingLog,
    initSession,
    runCommand,
    refreshWorkflows,
    cancelActiveWorkflow,
    clearError,
  };
}