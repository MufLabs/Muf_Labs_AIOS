/**
 * SelectionEngine — rankea proveedores de IA según el dominio de la tarea.
 *
 * El Kernel usa este ranking para decidir qué IA utilizar sin que el
 * usuario tenga que elegir manualmente.
 */

import type { AiProviderDescriptor } from "@aios/llm";
import type { TaskIntent } from "./TaskIntent";

const DOMAIN_PREFERENCE: Record<string, string[]> = {
  code: ["openai", "grok", "qwen", "claude", "deterministic"],
  architecture: ["openai", "claude", "gemini", "deterministic"],
  documentation: ["claude", "gemini", "openai", "deterministic"],
  "long-context": ["gemini", "claude", "deterministic"],
  privacy: ["ollama", "lmstudio", "deterministic"],
  offline: ["ollama", "lmstudio", "deterministic"],
  research: ["gemini", "claude", "openai", "deterministic"],
  security: ["openai", "claude", "deterministic"],
  devops: ["openai", "claude", "deterministic"],
  "ui-ux": ["openai", "claude", "gemini", "deterministic"],
  reasoning: ["openai", "claude", "deterministic"],
  general: ["openai", "claude", "gemini", "deterministic"],
};

const DEFAULT_ORDER = ["openai", "claude", "gemini", "grok", "qwen", "ollama", "lmstudio", "deterministic"];

export class SelectionEngine {
  rankProviders(intent: TaskIntent, available: AiProviderDescriptor[]): AiProviderDescriptor[] {
    const order = this.preferenceOrder(intent);
    const score = new Map<string, number>();
    order.forEach((id, idx) => score.set(id, order.length - idx));

    const intentWords = `${intent.domain} ${intent.intention}`.toLowerCase();

    return [...available].sort((a, b) => {
      const sa = (score.get(a.id) ?? 0) + this.modelBonus(a, intentWords);
      const sb = (score.get(b.id) ?? 0) + this.modelBonus(b, intentWords);
      return sb - sa;
    });
  }

  private preferenceOrder(intent: TaskIntent): string[] {
    if (intent.domain && DOMAIN_PREFERENCE[intent.domain]) {
      return DOMAIN_PREFERENCE[intent.domain];
    }
    const cat = intent.category === "ui-ux" ? "ui-ux" : intent.category === "research" ? "research" : "general";
    return DOMAIN_PREFERENCE[cat] ?? DEFAULT_ORDER;
  }

  private modelBonus(provider: AiProviderDescriptor, intentWords: string): number {
    const model = provider.defaultModel.toLowerCase();
    if (intentWords.includes(provider.id) || intentWords.includes(model.split("-")[0])) {
      return 1;
    }
    return 0;
  }
}