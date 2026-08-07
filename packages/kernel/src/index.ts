/**
 * @aios/kernel - Barrel exports
 */

export * from "./monitoring/GuardianObserver";
export * from "./monitoring/ContainerHealth";
export * from "./monitoring/HealthReconciliation";
export * from "./security/AiPermissions";
export * from "./context";
export * from "./Kernel";
export * from "./orchestration/TaskIntent";
export * from "./orchestration/ExecutionPlan";
export * from "./orchestration/TaskClassifier";
export * from "./orchestration/GoalAnalyzer";
export * from "./orchestration/ContextManager";
export * from "./orchestration/SelectionEngine";
export * from "./consensus/ConsensusTypes";
export * from "./consensus/ConsensusEngine";

// Stage 8.4 — Vault-aware provider implementations and types.
export * from "./providers/vault";

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
