import { AgentContext } from "../core";
import { AgentFactory } from "../core";
import { IAgent } from "../core/IAgent";
import { MarkdownAgentLoader } from "../loaders";
import { AgentRegistry } from "../registry";
import { AgentRuntime, RuntimeResult } from "../runtime";
import { AgentRequest } from "../types";

import { IAgentManager } from "./IAgentManager";
import { ManagerOptions } from "./ManagerOptions";
import { ManagerState } from "./ManagerState";

export class AgentManager implements IAgentManager {

    /**
     * TEMPORARY DEBUG PROPERTY
     * Remove after diagnostics.
     */
    public readonly __debug = "AgentManager MODIFICADO";

    private readonly loader = new MarkdownAgentLoader();

    private readonly registry = new AgentRegistry();

    private readonly runtime: AgentRuntime;

    private state = ManagerState.Idle;

    constructor(
        private readonly options: ManagerOptions = {}
    ) {

        this.runtime = new AgentRuntime(
            this.registry,
            this.options.runtime
        );

    }

    public async initialize(): Promise<void> {

        if (this.state !== ManagerState.Idle) {
            return;
        }

        this.state = ManagerState.Initializing;

        const definitions = await this.loader.load();

        const agents = AgentFactory.createMany(definitions);

        this.registry.registerMany(agents);

        this.state = ManagerState.Ready;

    }

    /**
     * Resolves the most appropriate agent for a command.
     */
    public resolveByCommand(
        command: string
    ): IAgent | undefined {

        const normalized = command
            .trim()
            .toLowerCase();

        console.log();
        console.log("========== resolveByCommand ==========");
        console.log("Command:", command);
        console.log("Normalized:", normalized);
        console.log("Registry Size:", this.registry.size);
        console.log();

        console.log("===== REGISTERED AGENTS =====");

        for (const agent of this.registry.getAll()) {

            console.log("Agent ID:", agent.id);
            console.log("Agent Name:", agent.name);

            console.log("Capabilities:");
            console.dir(
                agent.definition.capabilities,
                { depth: 10 }
            );

            console.log(
                `supports("${command}") =`,
                agent.supports(command)
            );

            console.log("--------------------------------");
        }

        console.log("===============================");
        console.log();

        //
        // 1. Search by Agent ID
        //
        const byId = this.registry.get(normalized);

        console.log(
            "Search by ID:",
            byId?.id ?? "<NOT FOUND>"
        );

        if (byId) {
            return byId;
        }

        //
        // 2. Search by Agent Name
        //
        const byName = this.registry.findByName(command);

        console.log(
            "Search by Name:",
            byName?.name ?? "<NOT FOUND>"
        );

        if (byName) {
            return byName;
        }

        //
        // 3. Search by Capability
        //
        const byCapability =
            this.registry.findByCapability(command);

        console.log(
            "Capability Matches:",
            byCapability.length
        );

        if (byCapability.length > 0) {

            console.log(
                "Selected:",
                byCapability[0].name
            );

            return byCapability[0];

        }

        console.log("No agent matched.");

        return undefined;

    }

    public async execute(
        context: AgentContext,
        request: AgentRequest
    ): Promise<RuntimeResult> {

        if (this.state === ManagerState.Idle) {
            await this.initialize();
        }

        this.state = ManagerState.Running;

        try {

            return await this.runtime.execute(
                context,
                request
            );

        }
        finally {

            this.state = ManagerState.Ready;

        }

    }

    public getState(): ManagerState {

        return this.state;

    }

    public getRegistry(): AgentRegistry {

        return this.registry;

    }

    public getRuntime(): AgentRuntime {

        return this.runtime;

    }

}