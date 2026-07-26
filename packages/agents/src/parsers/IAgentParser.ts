import { AgentDefinition } from "../core/AgentDefinition";
import { ParserResult } from "./ParserResult";

export interface IAgentParser {

    parse(content: string): Promise<ParserResult<AgentDefinition>>;

}