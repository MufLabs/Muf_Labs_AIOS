import { AgentDefinition } from "../core/AgentDefinition.js";
import { ParserResult } from "./ParserResult.js";

export interface IAgentParser {

    parse(content: string): Promise<ParserResult<AgentDefinition>>;

}
