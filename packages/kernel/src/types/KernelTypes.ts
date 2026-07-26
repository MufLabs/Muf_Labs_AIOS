export type WorkflowCommand =
    | "Analyze"
    | "Implement"
    | "Document";

export type ConversationRole =
    | "system"
    | "user"
    | "assistant";

export interface ConversationMessage {

    id: string;

    role: ConversationRole;

    content: string;

    timestamp: Date;

    metadata?: Record<string, unknown>;

}

export interface WorkflowState {

    active: WorkflowCommand | null;

    startedAt?: Date;

    completedAt?: Date;

}

export interface KernelState {

    sessionId: string;

    project?: string;

    activeAgent?: string;

    conversation: ConversationMessage[];

    workflow: WorkflowState;

    memory: Map<string, unknown>;

    metadata?: Record<string, unknown>;

}