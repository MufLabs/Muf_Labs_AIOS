import { AgentCapability } from "../types";

/**
 * Static definition of an agent loaded from a .agent.md file.
 *
 * This interface contains only declarative metadata.
 * Runtime state belongs to IAgent implementations.
 */
export interface AgentDefinition {
    /**
     * Globally unique identifier.
     */
    id: string;

    /**
     * Human readable name.
     */
    name: string;

    /**
     * Short description.
     */
    description: string;

    /**
     * Optional semantic version.
     */
    version?: string;

    /**
     * Optional author.
     */
    author?: string;

    /**
     * System prompt used by the runtime.
     */
    prompt: string;

    /**
     * Supported capabilities.
     */
    capabilities: AgentCapability[];

    /**
     * External tools that may be invoked.
     */
    tools: string[];

    /**
     * Workflow identifiers supported by the agent.
     */
    workflow: string[];

    /**
     * Non-negotiable execution rules.
     */
    rules: string[];

    /**
     * Prompt examples.
     */
    examples: string[];

    /**
     * Execution constraints.
     */
    constraints: string[];

    /**
     * Search tags.
     */
    tags: string[];

    /**
     * Higher values mean higher selection priority.
     */
    priority: number;

    /**
     * Indicates whether the agent can be selected.
     */
    enabled: boolean;

    /**
     * Optional model override.
     * Example:
     * "gpt-5.5"
     * "claude-opus"
     * "deepseek-v4"
     */
    model?: string;

    /**
     * Optional provider override.
     * Example:
     * "openai"
     * "anthropic"
     * "ollama"
     */
    provider?: string;

    /**
     * Optional execution timeout in milliseconds.
     */
    timeout?: number;

    /**
     * Maximum execution retries.
     */
    maxRetries?: number;

    /**
     * Arbitrary metadata preserved by the loader.
     */
    metadata: Record<string, unknown>;
}