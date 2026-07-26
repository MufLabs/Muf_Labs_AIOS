import { basename } from "node:path";

import { AgentDefinition } from "../core";
import { AgentCapability } from "../types";

import { FrontMatterParser } from "./FrontMatterParser";
import { PromptExtractor } from "./PromptExtractor";
import { ParserResult } from "./ParserResult";
import { IAgentParser } from "./IAgentParser";

export class MarkdownAgentParser implements IAgentParser {

    private readonly frontMatter = new FrontMatterParser();

    private readonly promptExtractor = new PromptExtractor();

    public async parse(
        content: string,
        filename?: string
    ): Promise<ParserResult<AgentDefinition>> {

        const metadata = this.frontMatter.parse(content);

        const prompt = this.promptExtractor.extract(content);

        const errors: string[] = [];

        const generatedId = filename
            ? basename(filename, ".agent.md")
                .replace(/([a-z])([A-Z])/g, "$1-$2")
                .replace(/[_\s]+/g, "-")
                .toLowerCase()
            : "";

        const id = String(
            metadata.id ??
            generatedId ??
            metadata.name ??
            ""
        ).trim();

        const name = String(metadata.name ?? "").trim();

        const description = String(
            metadata.description ?? ""
        ).trim();

        if (!id) {
            errors.push("Missing required field 'id'.");
        }

        if (!name) {
            errors.push("Missing required field 'name'.");
        }

        if (!prompt) {
            errors.push("Prompt section is empty.");
        }

        const capabilities: AgentCapability[] = (
            Array.isArray(metadata.capabilities)
                ? metadata.capabilities
                : []
        ).map(capability => ({
            name: String(capability)
        }));

        const definition: AgentDefinition = {

            id,

            name,

            description,

            version: metadata.version?.toString(),

            author: metadata.author?.toString(),

            prompt,

            capabilities,

            tools: Array.isArray(metadata.tools)
                ? [...metadata.tools as string[]]
                : [],

            workflow: Array.isArray(metadata.workflow)
                ? [...metadata.workflow as string[]]
                : [],

            rules: Array.isArray(metadata.rules)
                ? [...metadata.rules as string[]]
                : [],

            examples: Array.isArray(metadata.examples)
                ? [...metadata.examples as string[]]
                : [],

            constraints: Array.isArray(metadata.constraints)
                ? [...metadata.constraints as string[]]
                : [],

            tags: Array.isArray(metadata.tags)
                ? [...metadata.tags as string[]]
                : [],

            priority: Number(metadata.priority ?? 100),

            enabled: Boolean(metadata.enabled ?? true),

            model: metadata.model?.toString(),

            provider: metadata.provider?.toString(),

            timeout: metadata.timeout !== undefined
                ? Number(metadata.timeout)
                : undefined,

            maxRetries: metadata.maxRetries !== undefined
                ? Number(metadata.maxRetries)
                : undefined,

            metadata

        };

        return {

            success: errors.length === 0,

            value: errors.length === 0
                ? definition
                : undefined,

            errors

        };

    }

}