import { Kernel } from "@aios/kernel";

import {

    WorkflowEngine

} from "@aios/workflow";

import {

    AgentManager

} from "@aios/agents";

export class ConversationService {

    private readonly kernel =

        new Kernel();

    private readonly workflow =

        new WorkflowEngine();

    private readonly manager =

        new AgentManager();

    constructor() {

        this.kernel.context.services.register(

            "AgentManager",

            this.manager

        );

    }

    async execute(

        prompt: string

    ) {

        this.kernel.boot();

        await this.manager.initialize();

        return this.workflow.execute(

            this.kernel.context,

            {

                command: "Analyze",

                prompt

            }

        );

    }

}