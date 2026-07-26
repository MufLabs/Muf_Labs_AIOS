import { AgentDefinition } from "../core";

export class PromptBuilder {

    public build(
        agent: AgentDefinition,
        userPrompt: string
    ): string {

        const sections: string[] = [];

        sections.push(agent.prompt.trim());

        if (agent.rules.length > 0) {

            sections.push(
                "",
                "## Rules",
                ...agent.rules.map(rule => `- ${rule}`)
            );

        }

        if (agent.constraints.length > 0) {

            sections.push(
                "",
                "## Constraints",
                ...agent.constraints.map(item => `- ${item}`)
            );

        }

        if (agent.workflow.length > 0) {

            sections.push(
                "",
                "## Workflow",
                ...agent.workflow.map(step => `- ${step}`)
            );

        }

        sections.push(
            "",
            "## User Request",
            userPrompt.trim()
        );

        return sections.join("\n");

    }

}