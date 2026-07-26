import { Kernel } from "@aios/kernel";
import { WorkflowEngine } from "@aios/workflow";
import * as Agents from "@aios/agents";

async function bootstrap() {

    console.log();
    console.log("========== MODULE ==========");
    console.log("Exports:", Object.keys(Agents));

    const { AgentManager } = Agents;

    console.log("AgentManager:", AgentManager);
    console.dir(AgentManager, { depth: 2 });
    console.log(
        "Prototype:",
        Object.getOwnPropertyNames(AgentManager.prototype)
    );
    console.log("============================");
    console.log();

    const kernel = new Kernel();

    const workflow = new WorkflowEngine();

    const agents = new AgentManager();

    console.log();
    console.log("========== INSTANCE ==========");
    console.log("Constructor:", agents.constructor.name);
    console.log("Debug:", (agents as any).__debug);
    console.log(
        "resolveByCommand:",
        typeof (agents as any).resolveByCommand
    );
    console.log("Instance:");
    console.dir(agents, { depth: 3 });
    console.log("==============================");
    console.log();

    kernel.context.services.register(
        "AgentManager",
        agents
    );

    kernel.context.services.register(
        "WorkflowEngine",
        workflow
    );

    kernel.boot();

    await agents.initialize();

    const result = await workflow.execute(
        kernel.context,
        {
            command: "Analyze",
            prompt: "AIOS bootstrap test."
        }
    );

    console.log();
    console.log("========== AIOS ==========");
    console.log(result.output);
    console.log("==========================");
    console.log();

}

bootstrap().catch(error => {

    console.error();
    console.error("========== ERROR ==========");
    console.error(error);
    console.error("===========================");
    console.error();

});