import { KernelContext } from './context/KernelContext';
import { TaskClassifier } from './orchestration/TaskClassifier';
import { GoalAnalyzer } from './orchestration/GoalAnalyzer';
import { SelectionEngine } from './orchestration/SelectionEngine';
import { ContextManager } from './orchestration/ContextManager';
import type { ExecutionPlan } from './orchestration/ExecutionPlan';
import { getAiProviderCatalog } from '@aios/llm';

export class Kernel {
  public readonly context = new KernelContext();
  private readonly classifier = new TaskClassifier();
  private readonly analyzer = new GoalAnalyzer();
  private readonly selector = new SelectionEngine();
  private readonly contextManager = new ContextManager();
  private booted = false;

  public boot(): void {
    if (this.booted) return;
    this.booted = true;
    this.context.services.has('AgentManager');
    this.context.events.emit('kernel.started', { session: this.context.sessionId, timestamp: new Date() });
  }

  public shutdown(): void {
    if (!this.booted) return;
    this.booted = false;
    this.context.events.emit('kernel.stopped', { session: this.context.sessionId, timestamp: new Date() });
  }

  public isRunning(): boolean { return this.booted; }

  public orchestrate(prompt: string): ExecutionPlan {
    const intent = this.classifier.classify(prompt);
    const plan = this.analyzer.analyze(prompt, intent);
    const ranked = this.selector.rankProviders(intent, getAiProviderCatalog());
    if (ranked.length > 0) {
      plan.requiredProviders = ranked.map((p) => p.id);
      for (const step of plan.steps) { if (!step.providerId) step.providerId = ranked[0].id; }
    }
    return plan;
  }

  public selectRelevantContext(history: Array<{ text: string }>, plan: ExecutionPlan): Array<{ text: string }> {
    return this.contextManager.selectRelevant(history, plan);
  }
}
