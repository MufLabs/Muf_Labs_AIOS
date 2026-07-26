import type { CandidateResponse, ConsensusMethod, ConsensusResult } from './ConsensusTypes';

const SPECIALIST_PRIORITY = ['openai', 'claude', 'deepseek', 'gemini'];

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\W+/).filter((w) => w.length >= 3));
}

function jaccard(a: string, b: string): number {
  const sa = tokenize(a); const sb = tokenize(b);
  if (sa.size === 0 && sb.size === 0) return 1;
  let intersection = 0;
  for (const w of sa) if (sb.has(w)) intersection++;
  const union = sa.size + sb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export class ConsensusEngine {
  resolve(candidates: CandidateResponse[], method: ConsensusMethod, weights?: Record<string, number>): ConsensusResult {
    if (candidates.length === 0) throw new Error('ConsensusEngine.resolve: no hay candidatas.');
    const w = weights ?? {};
    const weightOf = (c: CandidateResponse): number => w[c.providerId] ?? 1;
    switch (method) {
      case 'majority': return this.majority(candidates);
      case 'weighted': return this.weighted(candidates, weightOf);
      case 'specialization': return this.specialization(candidates);
      case 'cross-validation': return this.crossValidation(candidates);
      case 'arbiter': return this.arbiter(candidates, weightOf);
      default: return this.majority(candidates);
    }
  }
  private majority(candidates: CandidateResponse[]): ConsensusResult {
    if (candidates.length < 2) return this.single(candidates[0], 'majority');
    let best = candidates[0]; let bestAvg = -1;
    for (let i = 0; i < candidates.length; i++) {
      let sum = 0;
      for (let j = 0; j < candidates.length; j++) { if (i !== j) sum += jaccard(candidates[i].content, candidates[j].content); }
      const avg = sum / (candidates.length - 1);
      if (avg > bestAvg) { bestAvg = avg; best = candidates[i]; }
    }
    if (bestAvg < 0.15) return this.arbiter(candidates, () => 1);
    return { method: 'majority', chosen: best, confidence: bestAvg, differences: this.collectDifferences(candidates), finalContent: best.content };
  }
  private weighted(candidates: CandidateResponse[], weightOf: (c: CandidateResponse) => number): ConsensusResult {
    let best = candidates[0]; let bestScore = -1; let totalWeight = 0;
    for (const c of candidates) { totalWeight += weightOf(c); const score = weightOf(c) * c.content.length; if (score > bestScore) { bestScore = score; best = c; } }
    const chosenWeight = weightOf(best);
    return { method: 'weighted', chosen: best, confidence: totalWeight > 0 ? chosenWeight / totalWeight : 0.5, differences: this.collectDifferences(candidates), finalContent: best.content };
  }
  private specialization(candidates: CandidateResponse[]): ConsensusResult {
    const prioritized = candidates.find((c) => SPECIALIST_PRIORITY.includes(c.providerId.toLowerCase()));
    const chosen = prioritized ?? candidates[0];
    return { method: 'specialization', chosen, confidence: 0.5, differences: this.collectDifferences(candidates), finalContent: chosen.content };
  }
  private crossValidation(candidates: CandidateResponse[]): ConsensusResult {
    if (candidates.length < 2) return this.single(candidates[0], 'cross-validation');
    const union = new Set<string>();
    for (const c of candidates) for (const ln of c.content.split('\n')) union.add(ln.trim());
    let best = candidates[0]; let bestOverlap = -1;
    for (const c of candidates) {
      const lines = new Set<string>(c.content.split('\n').map((x: string) => x.trim()));
      let overlap = 0;
      for (const ln of lines) if (union.has(ln)) overlap++;
      const stability = c.content.length * overlap;
      if (stability > bestOverlap) { bestOverlap = stability; best = c; }
    }
    return { method: 'cross-validation', chosen: best, confidence: 0.6, differences: this.collectDifferences(candidates), finalContent: best.content };
  }
  private arbiter(candidates: CandidateResponse[], weightOf: (c: CandidateResponse) => number): ConsensusResult {
    let best = candidates[0]; let bestScore = -1;
    for (const c of candidates) { const score = c.content.length * weightOf(c); if (score > bestScore) { bestScore = score; best = c; } }
    const diverging = this.collectDifferences(candidates);
    let avg = 0;
    if (candidates.length > 1) {
      let sum = 0, count = 0;
      for (let i = 0; i < candidates.length; i++) { for (let j = i + 1; j < candidates.length; j++) { sum += jaccard(candidates[i].content, candidates[j].content); count++; } }
      avg = count > 0 ? sum / count : 0;
    }
    return { method: 'arbiter', chosen: best, confidence: avg, differences: diverging, finalContent: best.content };
  }
  private single(c: CandidateResponse, method: ConsensusMethod): ConsensusResult { return { method, chosen: c, confidence: 1, differences: [], finalContent: c.content }; }
  private collectDifferences(candidates: CandidateResponse[]): string[] {
    const diffs: string[] = [];
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const sim = jaccard(candidates[i].content, candidates[j].content);
        if (sim < 0.2) diffs.push('Provider ' + candidates[i].providerId + ' diverges from ' + candidates[j].providerId + ' (jaccard ' + sim.toFixed(2) + ')');
      }
    }
    return diffs;
  }
}
