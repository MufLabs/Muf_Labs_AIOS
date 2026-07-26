import type { ExecutionPlan } from './ExecutionPlan';

export interface ContextEntry { text: string; }

export class ContextManager {
  private readonly windowSize = 6;
  selectRelevant(history: ContextEntry[], plan: ExecutionPlan): ContextEntry[] {
    if (history.length <= this.windowSize) return [...history];
    const keywords = this.extractKeywords(plan);
    const recent = history.slice(-this.windowSize);
    const olderMatching = history.slice(0, -this.windowSize).filter((entry) => keywords.some((kw) => entry.text.toLowerCase().includes(kw)));
    const merged: ContextEntry[] = [];
    for (const entry of olderMatching.concat(recent)) { if (!merged.includes(entry)) merged.push(entry); }
    return merged;
  }
  private extractKeywords(plan: ExecutionPlan): string[] {
    const words: string[] = [];
    const pushFrom = (text: string) => { for (const w of text.toLowerCase().split(/\W+/)) { if (w.length >= 4) words.push(w); } };
    pushFrom(plan.goal);
    for (const s of plan.steps) pushFrom(s.description);
    return Array.from(new Set(words)).slice(0, 20);
  }
}
