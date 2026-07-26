import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { AgentDefinition } from "../core/AgentDefinition";
import { MarkdownAgentParser } from "../parsers";

import { AgentFileLocator } from "./AgentFileLocator";
import { IAgentLoader } from "./IAgentLoader";

export class MarkdownAgentLoader implements IAgentLoader {

    private readonly parser = new MarkdownAgentParser();

    constructor(
        private readonly locator = new AgentFileLocator()
    ) { }

    public async load(): Promise<AgentDefinition[]> {

        const folder = this.locator.getAgentsDirectory();

        const files = (await readdir(folder))
            .filter(file => file.endsWith(".agent.md"))
            .sort((a, b) => a.localeCompare(b));

        const definitions: AgentDefinition[] = [];
        const ids = new Set<string>();

        for (const file of files) {

            try {

                const content = await readFile(
                    join(folder, file),
                    "utf8"
                );

                const result = await this.parser.parse(
                    content,
                    file
                );

                if (!result.success || !result.value) {

                    console.warn(
                        `[MarkdownAgentLoader] Unable to parse '${file}'.`,
                        result.errors
                    );

                    continue;

                }

                const definition = result.value;

                if (ids.has(definition.id)) {

                    console.warn(
                        `[MarkdownAgentLoader] Duplicate agent id '${definition.id}'.`
                    );

                    continue;

                }

                ids.add(definition.id);

                definitions.push(definition);

            }
            catch (error) {

                console.error(
                    `[MarkdownAgentLoader] Failed to load '${file}'.`,
                    error
                );

            }

        }

        return definitions;

    }

}