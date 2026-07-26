import type { TaskIntent, TaskCategory } from './TaskIntent';
import type { ExecutionPlan, PlanStep } from './ExecutionPlan';

export class GoalAnalyzer {
  analyze(prompt: string, intent: TaskIntent): ExecutionPlan {
    const goal = prompt.trim().slice(0, 160);
    const steps = this.buildSteps(goal, intent);
    const requiredAgents = Array.from(new Set(steps.map((s) => s.agent)));
    return { goal, category: intent.category, steps, requiredAgents, requiredProviders: ['deterministic'], parallelizable: this.isParallelizable(steps), intent };
  }
  private buildSteps(goal: string, intent: TaskIntent): PlanStep[] {
    const cat = intent.category;
    const first = intent.agentsNeeded[0] ?? 'Chief Architect';
    const specialist = intent.agentsNeeded.find((a) => a !== 'Chief Architect') ?? 'Backend Engineer';
    if (cat === 'conversation') return [this.step('step-1', 'Responder la consulta', first)];
    if (cat === 'programming' || cat === 'architecture' || cat === 'automation') return [this.step('step-1','Analizar requisitos: '+goal,'Chief Architect'),this.step('step-2','Implementar la solucion',specialist,['step-1']),this.step('step-3','Validar y revisar','Validation Engineer',['step-2'])];
    if (cat === 'review' || cat === 'analysis') return [this.step('step-1','Analizar: '+goal,'Code Reviewer'),this.step('step-2','Generar reporte con hallazgos','Documentation Engineer',['step-1'])];
    if (cat === 'documentation') return [this.step('step-1','Recopilar contexto: '+goal,'Documentation Engineer'),this.step('step-2','Redactar la documentacion','Documentation Engineer',['step-1'])];
    if (cat === 'consensus-multi') return [this.step('step-1','Ejecutar modelos en paralelo: '+goal,'AI System Engineer'),this.step('step-2','Resolver consenso','Consensus Agent',['step-1']),this.step('step-3','Validar la respuesta final','Validation Engineer',['step-2'])];
    if (cat === 'devops') return [this.step('step-1','Planificar despliegue: '+goal,'DevOps Engineer'),this.step('step-2','Ejecutar y validar el despliegue','DevOps Engineer',['step-1'])];
    if (cat === 'ui-ux' || cat === 'design') return [this.step('step-1','Disenar: '+goal,'UI/UX Architect'),this.step('step-2','Validar la propuesta','Validation Engineer',['step-1'])];
    return [this.step('step-1','Resolver: '+goal,first)];
  }
  private step(id: string, description: string, agent: string, dependsOn: string[] = [], category?: TaskCategory): PlanStep { return { id, description, agent, dependsOn, status: 'pending', category }; }
  private isParallelizable(steps: PlanStep[]): boolean { return steps.length > 1 && steps.every((s) => s.dependsOn.length === 0); }
}
