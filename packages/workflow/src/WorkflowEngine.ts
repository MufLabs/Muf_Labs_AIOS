import { KernelContext } from "@aios/kernel";

import {
    WorkflowRequest,
    WorkflowResult
} from "./types/WorkflowTypes";

export class WorkflowEngine {

    /**
     * Ejecuta un workflow.
     */
    async execute(

        context: KernelContext,

        request: WorkflowRequest

    ): Promise<WorkflowResult> {

        /**
         * Obtiene el AgentManager
         * desde el contenedor del Kernel.
         */
        const agentManager =
            context.services.resolve<any>(
                "AgentManager"
            );

        console.log();
        console.log("======= WORKFLOW =======");
        console.log(
            "Constructor:",
            agentManager?.constructor?.name
        );
        console.log(
            "resolveByCommand:",
            typeof agentManager?.resolveByCommand
        );

        console.log(
            "Manager State:",
            agentManager?.getState?.()
        );

        console.log(
            "Registry Size:",
            agentManager?.getRegistry?.().size
        );

        try {

            const registry =
                agentManager?.getRegistry?.();

            if (registry) {

                const agents =
                    registry.getAll();

                console.log();
                console.log("======= REGISTERED AGENTS =======");

                console.table(

                    agents.map((agent: any) => ({

                        id: agent.id,

                        name: agent.name,

                        capabilities:
                            agent.definition?.capabilities?.map(
                                (c: any) =>
                                    typeof c === "string"
                                        ? c
                                        : c.name
                            ) ?? []

                    }))

                );

                console.log("===============================");
                console.log();

            }

        }
        catch (error) {

            console.error(
                "Unable to inspect registry:",
                error
            );

        }

        console.log(
            "Incoming Command:",
            request.command
        );

        console.log("Instance:");
        console.dir(agentManager, { depth: 2 });

        console.log("========================");
        console.log();

        /**
         * Busca el agente
         * capaz de ejecutar
         * el comando solicitado.
         */
        const agent =
            agentManager.resolveByCommand(
                request.command
            );

        console.log(
            "Resolved Agent:",
            agent?.name ?? "<NOT FOUND>"
        );

        if (!agent) {

            throw new Error(

                `No agent found for command '${request.command}'.`

            );

        }

        /**
         * Actualiza el estado
         * del Kernel.
         */
        context.workflow.active =
            request.command;

        context.workflow.startedAt =
            new Date();

        delete context.workflow.completedAt;

        context.setActiveAgent(
            agent.name
        );

        /**
         * Evento de inicio.
         */
        context.events.emit(
            "workflow.started",
            request
        );

        /**
         * Ejecuta el workflow mediante AgentManager.
         */
        const result =
            await agentManager.execute(

                {
                    executionId: crypto.randomUUID(),

                    variables: {},

                    memory: {},

                    runtime: agentManager.getRuntime(),

                    startedAt: new Date()

                },

                {
                    command: request.command,

                    prompt: request.prompt

                }

            );

        /**
         * Finaliza el workflow.
         */
        context.workflow.completedAt =
            new Date();

        context.workflow.active =
            null;

        /**
         * Evento de finalización.
         */
        context.events.emit(
            "workflow.finished",
            result
        );

        return {

            success: result.success,

            output:
                result.results?.[0]?.output ?? ""

        };

    }

}