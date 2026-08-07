# Phase 8 - Architecture Baseline

> The definitive Phase 8 Architecture Baseline. Future development uses this as the official reference.
> Baseline Date: 2026-08-07 | Baseline Commit: b3cfbd7da58047dc8acddad7a7855a6a49383e60

## 1. Overall System Architecture
AIOS is a local-first, modular operating system for AI agents built on the T-Bit (Temporal Bit) primitive. The repository is a pnpm + Turborepo monorepo: 9 packages, 3 apps, and a standalone reference implementation (aios-mvp). A user-selected local folder (the Vault) is the single source of truth for all persistent data.

## 2. Kernel Responsibilities
@aios/kernel is the single orchestration point. IKernel executes; ProviderRegistry manages providers; ExecutionPipeline runs requests. The Kernel owns NO storage, vault paths, or encryption. It receives VaultContext (constructor / setVaultContext()), fans out initializeProviders(VaultProviderConfig), emits lifecycle events, exposes getProviderReadiness(), and preserves Phase 7 boot()/shutdown()/context/isRunning.

## 3. Vault Lifecycle
Exactly one active vault per session. Client picks a folder (File System Access API on Web; native FS on Desktop) -> VaultContext persisted (IndexedDB/local) -> VaultBootstrapService.initialize(vaultRoot, userId, label) runs the linear sequence: T-Bit paths -> Encryption -> Default Space Manifest -> Storage Recovery -> Kernel(vaultRoot) -> initializeProviders() -> Memory -> Workflow -> Providers -> Agents -> Q-Vault -> Health Verification -> return VaultInitResponse. Q-Vault initializes last.

## 4. Provider Architecture
ProviderRegistry + ProviderManager. Optional initializeProvider(VaultProviderConfig) hook; initializeAll(config) fans out with per-provider error isolation, returning Record<id, boolean>. ProviderInfo and ProviderCapabilities (vaultRead/vaultWrite object flags). Five vault providers: Memory, Workflow, Agent, QVault, LLM (VAULT_PROVIDER_IDS). Providers never import the Kernel and never own storage.

## 5. Workflow Architecture
@aios/workflow owns Engine, DSL, Nodes, State; persistence via @aios/database repository pattern. WorkflowVaultProvider scopes persistent/temp context, logs, and sessions to the vault.

## 6. Agent Architecture
@aios/agents owns Base Agent, Runtime, Memory, Tools, Permissions, Communication, Templates; persistence via @aios/database. AgentVaultProvider scopes prompt library, knowledge base, and runtime cache to the vault.

## 7. Runtime Initialization Sequence
1 Vault (client pick) -> 2 setActiveTBitSpacesRoot(vaultRoot + /spaces) -> 3 Encryption key -> 4 createSpaceManifest -> 5 TBitStorageService.recover() -> 6 new Kernel(vaultRoot) + setVaultContext() -> 7 initializeProviders() (Memory, Workflow, LLM, Agent, QVault last) -> 8 verifySubsystems() -> 9 emit vault.opened -> 10 return readiness.

## 8. Event Flow
Kernel-level event bus (@muf/tbit-core/events.ts). VAULT_EVENTS = vault.opened / vault.closed / vault.switched (constants in @aios/shared). Kernel emits vault.opened after successful initializeProviders() and vault.closed on disposeVault(). Consumers subscribe via the Kernel events getter.

## 9. Package Dependency Graph
@muf/tbit-core (0 @aios deps) -> @aios/shared (re-exports only) -> @aios/database + @aios/llm -> @aios/kernel -> @aios/agents + @aios/workflow -> @aios/api -> @aios/web. @aios/ui is an independent React design system; @aios/sdk and @aios/desktop are empty placeholders.

## 10. Runtime Dependency Graph
VaultContext is injected only (constructor / setVaultContext()); providers receive VaultProviderConfig via initializeProvider(). No global state; no process.env inside the Kernel.

## 11. Persistence Model
- T-Bit semantics (canonical @muf/tbit-core): TBitStorageService (WAL, recovery, inject, collapse, snapshot, rollback), TBitContainer/AllocationMap, EncryptionKeyManager (AES-256-GCM, HMAC), createSpaceManifest/listSpaceManifests, anti-entropy/gossip sync.
- Persistence plumbing (@aios/database): sqlite/libsql/postgres adapters, connection pool, migrations, generic Repository<T>, type-safe query builder.

## 12. Runtime Path Resolution
tbitRuntimePaths.ts (@muf/tbit-core) is the single authority. VaultBootstrapService calls setActiveTBitSpacesRoot(vaultRoot + /spaces). All providers resolve via these helpers - zero hardcoded paths. @aios/shared only re-exports. Paths use path.posix semantics (portable to macOS/Linux).

## 13. Security Model
- Local-first; user owns the vault; application never assumes a path.
- AES-256-GCM encryption; versioned key activation; HIPI signing. Phase 8 adds key generation/activation only; rotation is Phase 10+.
- Vault endpoints (POST /vault/init, GET /vault/status) guarded by requireSymbolicApiKey.
- No remote/network sync (Phase 11+); vault is purely local for Phase 8.

## 14. Boundary Contracts
- Stage 8.2 boundary: vaultReady=true, kernelReady=false (frontend gates on vaultReady, not kernelReady).
- Stage 8.4: kernelReady=true reachable only after initializeProviders() completes.
- Vault abstraction is the platform boundary: subsystems never know whether the vault is web or desktop.

---

*End of Phase 8 Architecture Baseline.*
