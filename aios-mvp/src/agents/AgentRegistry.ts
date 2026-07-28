// AgentRegistry - MufLabs AIOS MVP
// Registry and discovery of available agents

import type { IAgent, EngineeringCommand } from '../types/index.js';
import { DeveloperAgent } from './DeveloperAgent.js';

export class AgentRegistry {
  private agents: Map<string, IAgent>;
  private commandMap: Map<EngineeringCommand, string[]>;
  private static instance: AgentRegistry;

  private constructor() {
    this.agents = new Map();
    this.commandMap = new Map();
    this.initialize();
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  private initialize(): void {
    // Register default agents for MVP
    const developerAgent = new DeveloperAgent();
    this.registerAgent(developerAgent);
  }

  registerAgent(agent: IAgent): void {
    this.agents.set(agent.id, agent);

    for (const capability of agent.capabilities) {
      const existing = this.commandMap.get(capability.command) || [];
      existing.push(agent.id);
      this.commandMap.set(capability.command, existing);
    }
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);

    // Clean up command map
    for (const [command, agentIds] of this.commandMap.entries()) {
      const filtered = agentIds.filter(id => id !== agentId);
      if (filtered.length === 0) {
        this.commandMap.delete(command);
      } else {
        this.commandMap.set(command, filtered);
      }
    }
  }

  findAgent(command: EngineeringCommand): IAgent | undefined {
    const agentIds = this.commandMap.get(command);
    if (!agentIds || agentIds.length === 0) return undefined;

    // For MVP, return the first available agent
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent && agent.getStatus() !== 'offline') {
        return agent;
      }
    }

    return undefined;
  }

  findBestAgent(command: EngineeringCommand): IAgent | undefined {
    const agentIds = this.commandMap.get(command);
    if (!agentIds || agentIds.length === 0) return undefined;

    let bestAgent: IAgent | undefined;
    let bestConfidence = 0;

    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent && agent.getStatus() !== 'offline') {
        const capability = agent.capabilities.find(c => c.command === command);
        if (capability && capability.confidence > bestConfidence) {
          bestAgent = agent;
          bestConfidence = capability.confidence;
        }
      }
    }

    return bestAgent;
  }

  getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }

  listAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentsForCommand(command: EngineeringCommand): IAgent[] {
    const agentIds = this.commandMap.get(command) || [];
    return agentIds
      .map(id => this.agents.get(id))
      .filter((a): a is IAgent => a !== undefined && a.getStatus() !== 'offline');
  }
}