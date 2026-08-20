/**
 * @aios/kernel - Barrel exports
 */

export * from "./monitoring/GuardianObserver.js";
export * from "./monitoring/ContainerHealth.js";
export * from "./monitoring/HealthReconciliation.js";
export * from "./security/AiPermissions.js";
export * from "./context/index.js";
export * from "./Kernel.js";
export * from "./orchestration/TaskIntent.js";
export * from "./orchestration/ExecutionPlan.js";
export * from "./orchestration/TaskClassifier.js";
export * from "./orchestration/GoalAnalyzer.js";
export * from "./orchestration/ContextManager.js";
export * from "./orchestration/SelectionEngine.js";
export * from "./consensus/ConsensusTypes.js";
export * from "./consensus/ConsensusEngine.js";

// Stage 8.4 — Vault-aware provider implementations and types.
export * from "./providers/vault/index.js";

// Re-export vault context primitives so consumers (apps/api, apps/web) can
// import the VaultContext / VAULT_EVENTS / VaultProviderConfig contract
// from @aios/kernel directly.
export {
    VAULT_EVENTS,
    type VaultContext,
    type VaultCapability,
    type VaultProviderConfig,
    type VaultOpenedPayload,
    type VaultClosedPayload,
    type VaultSwitchedPayload,
} from "@aios/shared";
