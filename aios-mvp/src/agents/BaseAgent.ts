import type { IAgent, AgentCapability, AgentStatus, ExecutionContext, ExecutionResult, ValidationReport, EngineeringCommand } from '../types/index.js';

export abstract class BaseAgent implements IAgent {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly capabilities: AgentCapability[];

  private _status: AgentStatus = 'idle';
  protected lastExecutionResult: ExecutionResult | null = null;

  constructor(name?: string) {
    // Allow subclass naming
  }

  canHandle(command: EngineeringCommand): boolean {
    return this.capabilities.some(c => c.command === command);
  }

  abstract execute(context: ExecutionContext): Promise<ExecutionResult>;

  async validate(result: ExecutionResult): Promise<ValidationReport> {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: string[] = [];

    if (!result.summary) errors.push({ field: 'summary', message: 'Result summary is required' });
    if (!result.artifacts || result.artifacts.length === 0) warnings.push('No artifacts produced');
    if (result.confidence < 0 || result.confidence > 1) errors.push({ field: 'confidence', message: 'Confidence must be between 0 and 1' });

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score: errors.length === 0 ? Math.round(result.confidence * 100) : 0,
    };
  }

  getStatus(): AgentStatus {
    return this._status;
  }

  protected setStatus(status: AgentStatus): void {
    this._status = status;
  }

  async reset(): Promise<void> {
    this._status = 'idle';
    this.lastExecutionResult = null;
  }
}