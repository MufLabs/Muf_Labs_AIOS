import { randomUUID } from "crypto";

import { EventBus } from "../events/EventBus";
import { MemoryStore } from "../memory/MemoryStore";
import { Conversation } from "../session/Conversation";
import { WorkflowState } from "../workflow/WorkflowState";
import { CommandRegistry } from "../commands/CommandRegistry";
import { ServiceContainer } from "../services/ServiceContainer";

export class KernelContext {

    /**
     * Unique session identifier.
     */
    public readonly sessionId = randomUUID();

    /**
     * Internal event bus.
     */
    public readonly events = new EventBus();

    /**
     * Runtime memory.
     */
    public readonly memory = new MemoryStore();

    /**
     * Conversation history.
     */
    public readonly conversation = new Conversation();

    /**
     * Current workflow state.
     */
    public readonly workflow: WorkflowState = {
        active: null
    };

    /**
     * Registered commands.
     */
    public readonly commands = new CommandRegistry();

    /**
     * Dependency injection container.
     */
    public readonly services = new ServiceContainer();

    /**
     * Shared runtime variables.
     */
    public readonly variables = new Map<string, unknown>();

    /**
     * Arbitrary runtime metadata.
     */
    public readonly metadata = new Map<string, unknown>();

    /**
     * Active agent.
     */
    private currentAgent?: string;

    /**
     * Active project.
     */
    private currentProject?: string;

    /**
     * Sets the active agent.
     */
    public setActiveAgent(
        name: string
    ): void {

        this.currentAgent = name;

    }

    /**
     * Gets the active agent.
     */
    public getActiveAgent(): string | undefined {

        return this.currentAgent;

    }

    /**
     * Sets the active project.
     */
    public setProject(
        name: string
    ): void {

        this.currentProject = name;

    }

    /**
     * Gets the active project.
     */
    public getProject(): string | undefined {

        return this.currentProject;

    }

    /**
     * Stores a runtime variable.
     */
    public setVariable(
        key: string,
        value: unknown
    ): void {

        this.variables.set(key, value);

    }

    /**
     * Reads a runtime variable.
     */
    public getVariable<T = unknown>(
        key: string
    ): T | undefined {

        return this.variables.get(key) as T | undefined;

    }

    /**
     * Stores runtime metadata.
     */
    public setMetadata(
        key: string,
        value: unknown
    ): void {

        this.metadata.set(key, value);

    }

    /**
     * Reads runtime metadata.
     */
    public getMetadata<T = unknown>(
        key: string
    ): T | undefined {

        return this.metadata.get(key) as T | undefined;

    }

    /**
     * Clears transient runtime state.
     */
    public clear(): void {

        this.variables.clear();
        this.metadata.clear();

        this.workflow.active = null;
        delete this.workflow.startedAt;
        delete this.workflow.completedAt;

    }

}