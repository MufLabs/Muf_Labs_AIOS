import { randomUUID } from "crypto";

import {
    type VaultContext,
    type VaultProviderConfig,
    type VaultOpenedPayload,
    type VaultClosedPayload,
    type VaultSwitchedPayload,
    VAULT_EVENTS,
} from "@aios/shared";

import { KernelContext } from "../context";

import {
    KernelRequest,
    KernelResponse
} from "../types";

import { IKernel } from "./IKernel";

import {
    ProviderManager
} from "../providers";

import {
    ProviderRegistry
} from "../registry";

import {
    ExecutionPipeline
} from "../execution";

/**
 * Stage 8.4 — Vault-Aware Kernel
 *
 * The Kernel is the **single orchestration point** for every subsystem
 * (Phase 8 frozen decision: "Kernel Responsibilities"). Stage 8.4 makes
 * the Kernel completely Vault-aware:
 *
 * - The constructor accepts an optional `VaultContext`.
 * - `initializeProviders()` fans out the context to every registered
 *   provider via `ProviderManager.initializeAll({ vaultContext })`.
 * - Vault lifecycle events (`vault.opened`, `vault.closed`,
 *   `vault.switched`) are emitted on the Kernel event bus.
 * - Subsystems obtain their filesystem layout through the injected
 *   `VaultContext.spacesRoot`; the Kernel itself stores no paths.
 *
 * **Architectural compliance:**
 * - "Kernel Responsibilities" (§16 Audit): Kernel does NOT manage
 *   vault paths, storage, or encryption. It only fans out the
 *   `VaultContext` to providers.
 * - "Provider Architecture" (§16 Audit): Providers receive vault
 *   config via `initializeProvider({ vaultContext })`, not via
 *   hardcoded paths or global state.
 * - "Memory Architecture" (§16 Audit): Providers read paths via
 *   `tbitRuntimePaths` keyed off `VaultContext.spacesRoot`.
 *
 * **Deterministic bootstrap order** (per `AIOS_ENGINEERING_AUDIT_v2.md` §5):
 *  1. VaultBootstrapService sets `setActiveTBitSpacesRoot(...)`.
 *  2. `VaultBootstrapService.initializeKernel()` constructs a `Kernel`
 *     with the resolved `VaultContext`.
 *  3. `kernel.initializeProviders()` fans out to every registered
 *     provider.
 *  4. Subsystems verify readiness; readiness is reported by
 *     `VaultBootstrapService.verifySubsystems()`.
 */
export class Kernel implements IKernel {

    private readonly registry: ProviderRegistry;

    private readonly providerManager: ProviderManager;

    private readonly pipeline: ExecutionPipeline;

    /**
     * Vault context received from the constructor. `null` until the
     * Kernel is constructed by `VaultBootstrapService`.
     */
    private _vaultContext: VaultContext | null = null;

    /**
     * Tracks whether `initializeProviders()` has already been called
     * for the current vault context. Used to enforce idempotency.
     */
    private providersInitialized = false;

    /**
     * Stage 8.4 — Snapshot of the last provider fan-out readiness.
     * Exposed via `getProviderReadiness()` for `VaultBootstrapService`.
     */
    private lastReadiness: Record<string, boolean> = {};

    /**
     * Lazy accessor for the underlying Kernel context. Constructs
     * the context on first access so that `vault.opened` events can be
     * emitted even when the Kernel was constructed without an explicit
     * `KernelContext`.
     */
    private contextRef: KernelContext | null = null;

    /**
     * Stage 8.4 — Boot state, preserved for Phase 7 services
     * (`ConversationService`) that still rely on `kernel.boot()`.
     */
    private booted = false;

    constructor(vaultContext?: VaultContext) {

        this.registry = new ProviderRegistry();

        this.providerManager = new ProviderManager(
            this.registry
        );

        this.pipeline = new ExecutionPipeline(
            this.providerManager
        );

        if (vaultContext) {
            this._vaultContext = vaultContext;
        }
    }

    /**
     * Permite registrar proveedores dinámicamente.
     */
    public get providers(): ProviderRegistry {
        return this.registry;
    }

    /**
     * Active vault context — `null` if the Kernel was constructed
     * without a vault (e.g. legacy/test paths).
     */
    public get vaultContext(): VaultContext | null {
        return this._vaultContext;
    }

    /**
     * Whether `initializeProviders()` has run for the current vault.
     */
    public get isVaultInitialized(): boolean {
        return this._vaultContext !== null && this.providersInitialized;
    }

    /**
     * Whether the Kernel has been booted via `boot()` (Phase 7 surface).
     */
    public get isRunning(): boolean {
        return this.booted;
    }

    /**
     * Stage 8.4 — Snapshot of provider readiness from the last
     * `initializeProviders()` call.
     *
     * Used by `VaultBootstrapService.verifySubsystems()` to map
     * per-provider readiness to subsystem readiness. Returns an
     * empty object before `initializeProviders()` runs.
     */
    public getProviderReadiness(): Record<string, boolean> {
        return { ...this.lastReadiness };
    }

    /**
     * Set the active vault context (Stage 8.4 wiring point).
     *
     * `VaultBootstrapService.initializeKernel()` calls this to attach
     * the freshly built `VaultContext` to the Kernel. If a previous
     * vault was attached, a `vault.switched` event is emitted before
     * the swap so that subscribers can flush their state.
     *
     * @param context The active vault context.
     */
    public setVaultContext(context: VaultContext): void {
        const previous = this._vaultContext;
        this._vaultContext = context;
        // A new vault invalidates prior provider initialization.
        this.providersInitialized = false;
        this.lastReadiness = {};

        if (previous) {
            const payload: VaultSwitchedPayload = { previous, current: context };
            this.getContext().events.emit(VAULT_EVENTS.SWITCHED, payload);
        }
    }

    /**
     * Fan-out vault-aware initialization to every registered provider.
     *
     * The Kernel calls `provider.initializeProvider({ vaultContext })`
     * for each provider that supports it. Providers without a
     * vault-aware initializer are skipped (their readiness is reported
     * as `false` by `verifySubsystems()`).
     *
     * After fan-out, a `vault.opened` event is emitted on the Kernel
     * context event bus so that subscribers (Workflow, Agents, LLM)
     * can react to the new vault.
     *
     * @throws {Error} if no vault context has been attached.
     */
    public async initializeProviders(): Promise<void> {
        if (!this._vaultContext) {
            throw new Error(
                "Kernel.initializeProviders() requires an active VaultContext. " +
                "Set it via the constructor or setVaultContext() before calling."
            );
        }

        const config: VaultProviderConfig = {
            vaultContext: this._vaultContext,
        };

        const readiness = await this.providerManager.initializeAll(config);
        this.lastReadiness = readiness;
        this.providersInitialized = true;

        const payload: VaultOpenedPayload = {
            vaultContext: this._vaultContext,
            subsystems: readiness,
        };
        this.getContext().events.emit(VAULT_EVENTS.OPENED, payload);
    }

    /**
     * Notify subscribers that the active vault has been closed.
     *
     * Emits `vault.closed` on the Kernel event bus, then clears the
     * internal vault reference. Stage 8.4 MVP does not implement a
     * full teardown — providers retain their state for inspection.
     */
    public async disposeVault(): Promise<void> {
        if (!this._vaultContext) return;

        const vaultId = this._vaultContext.vaultId;
        const payload: VaultClosedPayload = {
            vaultId,
            closedAt: new Date().toISOString(),
        };
        this.getContext().events.emit(VAULT_EVENTS.CLOSED, payload);

        this._vaultContext = null;
        this.providersInitialized = false;
        this.lastReadiness = {};
    }

    /**
     * Generate a stable, unique vault id.
     *
     * Exposed for `VaultBootstrapService` so the helper is the only
     * place that fabricates vault identifiers.
     */
    public static generateVaultId(): string {
        return `vault-${randomUUID()}`;
    }

    private getContext(): KernelContext {
        if (!this.contextRef) {
            this.contextRef = new KernelContext();
        }
        return this.contextRef;
    }

    /**
     * Phase 7 surface — boot the Kernel.
     *
     * Idempotent. Emits `kernel.started` on the first call so that
     * services that still rely on the Phase 7 lifecycle continue
     * to function.
     */
    public boot(): void {
        if (this.booted) return;
        this.booted = true;
        this.getContext().events.emit("kernel.started", {
            session: this.getContext().sessionId,
            timestamp: new Date(),
        });
    }

    /**
     * Phase 7 surface — shut down the Kernel.
     */
    public shutdown(): void {
        if (!this.booted) return;
        this.booted = false;
        this.getContext().events.emit("kernel.stopped", {
            session: this.getContext().sessionId,
            timestamp: new Date(),
        });
    }

    /**
     * Direct accessor for the Kernel event bus.
     *
     * Subsystems that need to listen for vault lifecycle events
     * subscribe via `kernel.events.on('vault.opened', handler)`.
     * Exposed primarily for integration tests and the
     * `VaultBootstrapService` orchestration layer.
     */
    public get events(): KernelContext["events"] {
        return this.getContext().events;
    }

    /**
     * Direct accessor for the underlying `KernelContext`.
     *
     * Phase 7 services (e.g. `ConversationService`) register their
     * managers via `kernel.context.services.register(...)`. This
     * getter preserves that surface so the Phase 7 API keeps
     * working under the Stage 8.4 vault-aware Kernel.
     */
    public get context(): KernelContext {
        return this.getContext();
    }

    public async execute(
        context: KernelContext,
        request: KernelRequest
    ): Promise<KernelResponse> {
        // Propagate the active vault id into the request metadata so
        // downstream pipelines can scope operations to the vault.
        const enrichedRequest: KernelRequest = this._vaultContext
            ? {
                ...request,
                metadata: {
                    ...(request.metadata ?? {}),
                    vaultId: this._vaultContext.vaultId,
                    spaceId: this._vaultContext.spaceId,
                },
            }
            : request;

        const result = await this.pipeline.execute({
            kernel: context,
            request: enrichedRequest,
        });

        return result.response;
    }
}
