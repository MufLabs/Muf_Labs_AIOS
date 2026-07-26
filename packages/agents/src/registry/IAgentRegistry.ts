import { IAgent } from "../core/IAgent";

export interface IAgentRegistry {

    register(agent: IAgent): void;

    registerMany(agents: readonly IAgent[]): void;

    unregister(id: string): boolean;

    get(id: string): IAgent | undefined;

    getAll(): IAgent[];

    exists(id: string): boolean;

    clear(): void;

}