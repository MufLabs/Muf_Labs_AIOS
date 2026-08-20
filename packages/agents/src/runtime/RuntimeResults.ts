import { AgentResult } from "../core/AgentResult.js";

export interface RuntimeResult {

    success: boolean;

    results: AgentResult[];

    errors: string[];

}
