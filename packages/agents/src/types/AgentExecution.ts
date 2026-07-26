export interface AgentExecution {

    startedAt: Date;

    finishedAt?: Date;

    durationMs?: number;

    success: boolean;

}