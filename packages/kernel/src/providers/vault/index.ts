/**
 * Stage 8.4 — Vault-aware provider implementations.
 *
 * Each concrete provider in this directory resolves its filesystem
 * layout exclusively from the active `VaultContext` injected by
 * the Kernel. No provider hardcodes paths.
 *
 * Subsystems covered:
 *  - Memory       → `MemoryVaultProvider`
 *  - Workflow     → `WorkflowVaultProvider`
 *  - Agent        → `AgentVaultProvider`
 *  - Q-Vault      → `QVaultVaultProvider`
 *  - LLM Gateway  → `LlmVaultProvider`
 */
export { MemoryVaultProvider } from "./MemoryVaultProvider.js";
export { WorkflowVaultProvider } from "./WorkflowVaultProvider.js";
export { AgentVaultProvider } from "./AgentVaultProvider.js";
export { QVaultVaultProvider } from "./QVaultVaultProvider.js";
export { LlmVaultProvider } from "./LlmVaultProvider.js";

/**
 * Canonical list of provider ids registered by `VaultBootstrapService`.
 * Used for subsystem readiness reporting.
 */
export const VAULT_PROVIDER_IDS = [
  "memory-vault",
  "workflow-vault",
  "agent-vault",
  "qvault-vault",
  "llm-vault",
] as const;

export type VaultProviderId = (typeof VAULT_PROVIDER_IDS)[number];

