/**
 * TaskClassifier — clasifica automáticamente la solicitud del usuario.
 *
 * Heurística determinista por palabras clave (sin LLM): asigna una
 * categoría de tarea, complejidad, urgencia, dominio y los agentes
 * especialistas sugeridos del catálogo de 15.
 */

import type {
  TaskIntent,
  TaskCategory,
  Complexity,
  Urgency,
  TechnicalLevel,
} from "./TaskIntent";

const HAS = (text: string, ...words: string[]): boolean =>
  words.some((w) => text.includes(w));

export class TaskClassifier {
  classify(prompt: string): TaskIntent {
    const text = prompt.toLowerCase();

    const category = this.detectCategory(text);
    const complexity: Complexity = HAS(
      text,
      "repo",
      "repository",
      "analiza",
      "analyze",
      "architecture",
      "arquitectura",
      "refactor",
      "migrate",
      "migrar",
      "complex",
    )
      ? "high"
      : HAS(text, "explain", "explica", "how", "como", "cómo")
        ? "low"
        : "medium";

    const urgency: Urgency = HAS(text, "urgent", "urgente", "critical", "critico", "crítico", "asap")
      ? "high"
      : HAS(text, "production", "produccion", "producción", "deploy", "production bug")
        ? "critical"
        : "normal";

    const technicalLevel: TechnicalLevel = HAS(text, "kernel", "distributed", "distribuido", "internals")
      ? "expert"
      : HAS(text, "architecture", "arquitectura", "system", "sistema", "scale", "escalar")
        ? "advanced"
        : HAS(text, "code", "codigo", "código", "build", "construir")
          ? "intermediate"
          : "basic";

    const domain = this.detectDomain(text, category);
    const agentsNeeded = this.pickAgents(text, category);

    return {
      category,
      intention: prompt.trim().slice(0, 140),
      complexity,
      domain,
      technicalLevel,
      urgency,
      risks: this.detectRisks(text),
      dependencies: this.detectDeps(text),
      toolsNeeded: this.detectTools(text, category),
      knowledgeRequired: this.detectKnowledge(text, category),
      agentsNeeded,
    };
  }

  private detectCategory(text: string): TaskCategory {
    if (HAS(text, "consensus", "consenso", "multiple models", "varios modelos", "compara modelos")) return "consensus-multi";
    if (HAS(text, "document", "documenta", "documentación", "documentation", "doc", "readme")) return "documentation";
    if (HAS(text, "review", "revisa", "audita", "audit", "code review", "pr review")) return "review";
    if (HAS(text, "repo", "repository", "repositorio", "analiza", "analyze", "mapa", "architecture", "arquitectura")) return "analysis";
    if (HAS(text, "deploy", "deployment", "ci/cd", "docker", "kubernetes", "k8s", "infra", "devops")) return "devops";
    if (HAS(text, "ui", "ux", "interface", "interfaz", "frontend", "component", "componente", "diseño", "design")) return "ui-ux";
    if (HAS(text, "image", "imagen", "video", "audio", "multimodal")) return "multimodal";
    if (HAS(text, "automate", "automatiza", "script", "cron", "workflow")) return "automation";
    if (HAS(text, "research", "investiga", "buscar", "search", "study", "estudia")) return "research";
    if (HAS(text, "architect", "diseñar", "diseña", "plan", "blueprint")) return "architecture";
    if (HAS(text, "think", "razona", "reasoning", "porque", "why", "tradeoff", "trade-off")) return "reasoning";
    if (HAS(text, "code", "codigo", "código", "function", "funcion", "función", "bug", "implement", "implementa", "build", "construir", "program")) return "programming";
    if (HAS(text, "design", "diseño", "sketch", "wireframe")) return "design";
    return "conversation";
  }

  private detectDomain(text: string, category: TaskCategory): string {
    if (category === "programming" || HAS(text, "code", "codigo", "código")) return "code";
    if (category === "architecture" || HAS(text, "architecture", "arquitectura")) return "architecture";
    if (category === "documentation" || HAS(text, "doc", "document")) return "documentation";
    if (category === "devops" || HAS(text, "deploy", "docker", "k8s")) return "devops";
    if (category === "ui-ux" || HAS(text, "ui", "ux", "frontend")) return "ui-ux";
    if (category === "research" || HAS(text, "research", "investiga")) return "research";
    if (HAS(text, "security", "seguridad", "vulner")) return "security";
    return "general";
  }

  private pickAgents(text: string, category: TaskCategory): string[] {
    if (category === "conversation") return ["Engineering Manager"];

    const agents: string[] = ["Chief Architect"];
    if (HAS(text, "code", "codigo", "código", "function", "funcion", "función", "bug", "implement", "implementa", "build", "program")) agents.push("Backend Engineer");
    if (HAS(text, "security", "seguridad", "vulner", "audit", "audita")) agents.push("Security Auditor");
    if (HAS(text, "perf", "performance", "rendimiento", "optim", "speed", "latency")) agents.push("Performance Engineer");
    if (HAS(text, "db", "database", "base de datos", "sql", "schema", "esquema")) agents.push("Database Engineer");
    if (HAS(text, "ui", "ux", "frontend", "component", "componente", "interfaz", "interface")) agents.push("UI/UX Architect");
    if (HAS(text, "document", "documenta", "documentation", "doc", "readme", "documentación")) agents.push("Documentation Engineer");
    if (HAS(text, "deploy", "deployment", "docker", "kubernetes", "k8s", "ci/cd", "infra", "devops")) agents.push("DevOps Engineer");
    if (HAS(text, "review", "revisa", "audit", "audita", "code review")) agents.push("Code Reviewer");
    if (HAS(text, "consensus", "consenso", "multiple models", "varios modelos") || category === "consensus-multi") agents.push("Consensus Agent");
    if (HAS(text, "storage", "almacenamiento", "memory", "memoria", "tbit")) agents.push("Storage Engineer");
    if (HAS(text, "ai", "ia ", "model", "modelo", "agent", "agente", "prompt")) agents.push("AI System Engineer");
    if (HAS(text, "prompt", "prompts")) agents.push("Prompt Engineer");

    if (agents.length === 1) agents.push("Backend Engineer");
    if (agents.length > 4) agents.push("Engineering Manager");
    return Array.from(new Set(agents));
  }

  private detectRisks(text: string): string[] {
    const risks: string[] = [];
    if (HAS(text, "production", "produccion", "producción")) risks.push("production-impact");
    if (HAS(text, "security", "seguridad", "vulner")) risks.push("security");
    if (HAS(text, "migrate", "migrar", "refactor")) risks.push("regression");
    if (HAS(text, "scale", "escalar", "performance")) risks.push("performance");
    return risks;
  }

  private detectDeps(text: string): string[] {
    const deps: string[] = [];
    if (HAS(text, "repo", "repositorio", "repository")) deps.push("repository");
    if (HAS(text, "database", "base de datos", "db")) deps.push("database");
    if (HAS(text, "api")) deps.push("api");
    if (HAS(text, "docker", "k8s")) deps.push("infrastructure");
    return deps;
  }

  private detectTools(text: string, category: TaskCategory): string[] {
    const tools: string[] = [];
    if (category === "analysis" || HAS(text, "repo", "repositorio")) tools.push("filesystem", "git");
    if (HAS(text, "search", "buscar", "investiga", "research")) tools.push("search-engine", "browser");
    if (HAS(text, "docker", "k8s", "deploy")) tools.push("terminal", "docker");
    if (tools.length === 0) tools.push("none");
    return tools;
  }

  private detectKnowledge(text: string, category: TaskCategory): string[] {
    const k: string[] = [];
    if (category === "programming" || HAS(text, "code")) k.push("software-engineering");
    if (category === "architecture") k.push("system-design");
    if (HAS(text, "security", "seguridad")) k.push("security");
    if (HAS(text, "performance", "rendimiento")) k.push("performance-engineering");
    if (k.length === 0) k.push("general");
    return k;
  }
}