// Session types - MufLabs AIOS MVP
// Definiciones del modelo de sesión persistente

export type SessionStatus = 'inactive' | 'active' | 'paused' | 'completed' | 'failed';

export interface SessionConfig {
  autonomyLevel: 0 | 1 | 2 | 3 | 4;
  preferredProvider: string;       // 'openai' | 'anthropic' | 'local' | 'auto'
  executionProfile: 'quality' | 'cost' | 'speed' | 'privacy';
  projectPath: string;             // Ruta del repositorio/proyecto asociado
}

export interface EngineeringContext {
  projectName: string;
  projectPath: string;
  projectDescription: string;
  languageDetected: string[];
  frameworkDetected: string[];
  dependencies: Record<string, string>;
  previousCommands: string[];
  engineeringMemory: Array<{
    type: 'decision' | 'lesson' | 'preference' | 'standard';
    content: string;
    timestamp: Date;
  }>;
}

export interface Session {
  id: string;                      // UUID v4
  userId: string;                  // Owner identifier
  status: SessionStatus;
  context: EngineeringContext;
  config: SessionConfig;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface CreateSessionDTO {
  userId: string;
  config?: Partial<SessionConfig>;
  context?: Partial<EngineeringContext>;
}