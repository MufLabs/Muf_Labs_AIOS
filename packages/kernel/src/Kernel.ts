/**
 * Stage 8.4 — Kernel barrel re-export.
 *
 * The vault-aware implementation lives in `./core/Kernel.ts`. This file
 * re-exports that implementation under the public `Kernel` symbol so
 * external consumers (apps/api, apps/web) get the vault-aware API
 * without having to know about the internal `core/` layout.
 *
 * The legacy high-level orchestration primitives (`boot`, `shutdown`,
 * `orchestrate`, etc.) are preserved on the same class so that the
 * Phase 7 surface keeps working.
 *
 * **Architecture compliance:**
 * - "Kernel Responsibilities" (§16 Audit): Kernel is the single
 *   orchestration point for every subsystem.
 * - "Provider Architecture" (§16 Audit): Vault-aware Kernel exposes
 *   `setVaultContext`, `initializeProviders`, `disposeVault`,
 *   `getProviderReadiness`, and `events` for vault-aware providers.
 */
export { Kernel } from "./core/Kernel";
export type { IKernel } from "./core/IKernel";
