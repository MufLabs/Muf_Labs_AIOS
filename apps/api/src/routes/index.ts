import { Router } from "express";
import tbitCoreRoutes from "./tbit-core.routes.js";
import tbitMemoryRoutes from "./tbit-memory.routes.js";
import tbitQueryRoutes from "./tbit-query.routes.js";
import tbitSemanticRoutes from "./tbit-semantic.routes.js";
import tbitHealthRoutes from "./tbit-health.routes.js";
import tbitEncryptionRoutes from "./tbit-encryption.routes.js";
import tbitAssetsRoutes from "./tbit-assets.routes.js";
import tbitAiPermissionsRoutes from "./tbit-ai-permissions.routes.js";
import tbitDocumentsRoutes from "./tbit-documents.routes.js";
import tbitMarkdownRoutes from "./tbit-markdown.routes.js";
import tbitNetworkRoutes from "./tbit-network.routes.js";
import tbitSetupRoutes from "./tbit-setup.routes.js";
import tbitKvRoutes from "./tbit-kv.routes.js";
import tbitVaultRoutes from "./tbit-vault.routes.js";

/**
 * Register all T-Bit API routes
 * All routes are mounted under /api/v1/tbit
 */
export function registerRoutes(app: ReturnType<typeof Router>): void {
  const apiRouter = Router();

  // Core T-Bit operations (inject, recover, collapse, snapshot, rollback, stats, payloads, export, import)
  apiRouter.use("/", tbitCoreRoutes);

  // Memory Core (remember, recall, context, links, graph, delete)
  apiRouter.use("/", tbitMemoryRoutes);

  // Query Index (search, rebuild, sync, stats)
  apiRouter.use("/", tbitQueryRoutes);

  // Semantic Index (search, rebuild, stats)
  apiRouter.use("/", tbitSemanticRoutes);

  // Container Health (health report, reconcile)
  apiRouter.use("/", tbitHealthRoutes);

  // Encryption (key status, key ring, active key)
  apiRouter.use("/", tbitEncryptionRoutes);

  // Assets (list, stats, delete, reconstruct binary, delete binary)
  apiRouter.use("/", tbitAssetsRoutes);

  // AI Permissions (get policy, update policy)
  apiRouter.use("/", tbitAiPermissionsRoutes);

  // Documents (import universal, ask document, import binary, import markdown, preview markdown)
  apiRouter.use("/", tbitDocumentsRoutes);

  // Markdown (import, reconstruct, list, delete, purge orphans)
  apiRouter.use("/", tbitMarkdownRoutes);

  // Network / Anti-Entropy (state, export record, import record, compare)
  apiRouter.use("/", tbitNetworkRoutes);

  // First-Run Setup (status, bootstrap)
  apiRouter.use("/", tbitSetupRoutes);

  // Key-Value Store (get, set, delete, list, stats)
  apiRouter.use("/", tbitKvRoutes);

  // Vault Management (init, status)
  apiRouter.use("/", tbitVaultRoutes);

  // Mount all T-Bit routes under /api/v1/tbit
  app.use("/api/v1/tbit", apiRouter);
}