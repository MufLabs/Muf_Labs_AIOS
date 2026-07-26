import { AgentResult } from "../core/AgentResult";

export interface RuntimeResult {

    success: boolean;

    results: AgentResult[];

    errors: string[];

}