export interface CandidateResponse { providerId: string; providerLabel: string; content: string; model: string; }

export type ConsensusMethod = 'majority' | 'weighted' | 'specialization' | 'cross-validation' | 'arbiter';

export interface ConsensusResult { method: ConsensusMethod; chosen: CandidateResponse; confidence: number; differences: string[]; finalContent: string; }
