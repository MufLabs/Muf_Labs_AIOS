import { Express } from "express";

import { ChatController } from "./controllers/ChatController";
import { TBitController } from "./controllers/TBitController";

export function registerRoutes(

    app: Express

) {

    const chat = new ChatController();
    const tbit = new TBitController();

    app.post("/api/v1/chat", chat.chat);

    // ─── T-Bit Container Lifecycle ──────────────────────

    app.post("/api/v1/tbit/containers", tbit.createContainer);

    // ─── T-Bit Memo / Memory ───────────────────────────

    app.post("/api/v1/tbit/containers/:containerId/memos", tbit.storeMemo);
    app.get("/api/v1/tbit/containers/:containerId/memos", tbit.recallMemos);
    app.get("/api/v1/tbit/containers/:containerId/memos/:recordId/context", tbit.getMemoryContext);

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

}
