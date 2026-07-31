import { Express } from "express";
import tbitCoreRoutes from "./routes/tbit-core.routes";
import tbitMemoryRoutes from "./routes/tbit-memory.routes";
import tbitQueryRoutes from "./routes/tbit-query.routes";
import tbitSemanticRoutes from "./routes/tbit-semantic.routes";
import tbitHealthRoutes from "./routes/tbit-health.routes";
import tbitAssetsRoutes from "./routes/tbit-assets.routes";
import tbitAiPermissionsRoutes from "./routes/tbit-ai-permissions.routes";
import tbitDocumentsRoutes from "./routes/tbit-documents.routes";
import tbitMarkdownRoutes from "./routes/tbit-markdown.routes";
import tbitNetworkRoutes from "./routes/tbit-network.routes";

import { ChatController } from "./controllers/ChatController";
import { TBitController } from "./controllers/TBitController";

export function registerRoutes(app: Express) {
    const chat = new ChatController();
    const tbit = new TBitController();

    app.post("/api/v1/chat", chat.chat);

    // ─── T-Bit First-run Setup (Phase 3) ─────────────────
    app.get("/api/v1/tbit/setup/status", tbit.getSetupStatus);
    app.post("/api/v1/tbit/setup/bootstrap", tbit.bootstrapSetup);

    // ─── T-Bit Container Lifecycle ──────────────────────
    app.post("/api/v1/tbit/containers", tbit.createContainer);

    // ─── T-Bit Memo / Memory ───────────────────────────
    app.post("/api/v1/tbit/containers/:containerId/memos", tbit.storeMemo);
    app.get("/api/v1/tbit/containers/:containerId/memos", tbit.recallMemos);
    app.get("/api/v1/tbit/containers/:containerId/memos/:recordId/context", tbit.getMemoryContext);
    app.get("/api/v1/tbit/containers/:containerId/memos/graph", tbit.getMemoryGraph);

    // ─── T-Bit Query Index ─────────────────────────────
    app.get("/api/v1/tbit/containers/:containerId/index/search", tbit.searchIndex);
    app.post("/api/v1/tbit/containers/:containerId/index/rebuild", tbit.rebuildIndex);

    // ─── T-Bit Container Health ────────────────────────
    app.get("/api/v1/tbit/containers/:containerId/health", tbit.getHealth);
    app.post("/api/v1/tbit/containers/:containerId/health/reconcile", tbit.reconcileHealth);

    // ─── T-Bit Encryption Keys ─────────────────────────
    app.get("/api/v1/tbit/encryption/keys", tbit.getEncryptionKeyInfo);
    app.get("/api/v1/tbit/encryption/ring", tbit.getEncryptionKeyRing);

    // ─── T-Bit Assets ──────────────────────────────────
    app.get("/api/v1/tbit/containers/:containerId/assets", tbit.listAssets);
    app.get("/api/v1/tbit/containers/:containerId/assets/stats", tbit.getAssetStats);
    app.post("/api/v1/tbit/containers/:containerId/assets/binary", tbit.importBinary);
    app.post("/api/v1/tbit/containers/:containerId/assets/markdown", tbit.importMarkdown);
    app.post("/api/v1/tbit/containers/:containerId/assets/universal", tbit.importUniversal);

    // ─── Modular T-Bit Routes (Phase 7.2) ──────────────
    // Base path: /api/v1/tbit/
    app.use("/api/v1/tbit", tbitCoreRoutes);
    app.use("/api/v1/tbit", tbitMemoryRoutes);
    app.use("/api/v1/tbit", tbitQueryRoutes);
    app.use("/api/v1/tbit", tbitSemanticRoutes);
    app.use("/api/v1/tbit", tbitHealthRoutes);
    app.use("/api/v1/tbit", tbitAssetsRoutes);
    app.use("/api/v1/tbit", tbitAiPermissionsRoutes);
    app.use("/api/v1/tbit", tbitDocumentsRoutes);
    app.use("/api/v1/tbit", tbitMarkdownRoutes);
    app.use("/api/v1/tbit", tbitNetworkRoutes);
}
