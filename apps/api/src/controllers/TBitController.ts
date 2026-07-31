import { Request, Response } from "express";
import { TBitService } from "../services/TBitService";

/** Cast a query param to string (Express 5 may return string | string[] | ParsedQs) */
function qs(val: unknown): string {
  if (Array.isArray(val)) return val[0] ?? "";
  if (typeof val === "string") return val;
  return String(val ?? "");
}

/** Cast a query param to optional number */
function qn(val: unknown): number | undefined {
  const s = qs(val);
  return s ? Number(s) : undefined;
}

export class TBitController {
  private readonly service = new TBitService();

  // ─── Container lifecycle ────────────────────────────────

  createContainer = async (req: Request, res: Response) => {
    const result = await this.service.createContainer(req.body);
    res.status(201).json(result);
  };

  // ─── First-run setup (Phase 3) ─────────────────────────────

  getSetupStatus = async (_req: Request, res: Response) => {
    const result = await this.service.getSetupStatus();
    res.json(result);
  };

  bootstrapSetup = async (req: Request, res: Response) => {
    const result = await this.service.bootstrapSetup(req.body);
    res.status(201).json(result);
  };

  // ─── Memo operations ────────────────────────────────────

  storeMemo = async (req: Request, res: Response) => {
    const result = await this.service.storeMemo(req.body);
    res.status(201).json(result);
  };

  recallMemos = async (req: Request, res: Response) => {
    const result = await this.service.recallMemos({
      userId: qs(req.query.userId) || undefined,
      query: qs(req.query.q),
      topK: qn(req.query.topK),
    });
    res.json(result);
  };

  getMemoryContext = async (req: Request, res: Response) => {
    const result = await this.service.getMemoryContextForRecord(
      qs(req.query.userId) || "anonimo",
      qs(req.query.q),
      qn(req.query.limit),
    );
    res.json(result);
  };

  getMemoryGraph = async (req: Request, res: Response) => {
    const result = await this.service.getMemoryGraph(qs(req.query.userId) || "anonimo");
    res.json(result);
  };

  // ─── Query index ────────────────────────────────────────

  searchIndex = async (req: Request, res: Response) => {
    const result = await this.service.searchIndex(
      qs(req.query.q),
      qn(req.query.topK),
    );
    res.json(result);
  };

  rebuildIndex = async (_req: Request, res: Response) => {
    await this.service.rebuildIndex();
    res.json({ status: "ok" });
  };

  // ─── Container health ───────────────────────────────────

  getHealth = async (_req: Request, res: Response) => {
    const result = await this.service.getHealth();
    res.json({ health: result });
  };

  reconcileHealth = async (_req: Request, res: Response) => {
    const result = await this.service.reconcileHealth();
    res.json(result);
  };

  // ─── Encryption keys ────────────────────────────────────

  getEncryptionKeyInfo = async (_req: Request, res: Response) => {
    const result = this.service.getEncryptionKeyInfo();
    res.json(result);
  };

  getEncryptionKeyRing = async (_req: Request, res: Response) => {
    const result = this.service.getEncryptionKeyRing();
    res.json(result);
  };

  // ─── Asset management ───────────────────────────────────

  listAssets = async (req: Request, res: Response) => {
    const userId = qs(req.query.userId) || undefined;
    const result = await this.service.listAllAssets(userId);
    res.json(result);
  };

  getAssetStats = async (req: Request, res: Response) => {
    const userId = qs(req.query.userId) || undefined;
    const result = await this.service.getAssetStatistics(userId);
    res.json(result);
  };

  importBinary = async (req: Request, res: Response) => {
    const result = await this.service.importBinaryAsset(
      req.body.filePath,
      req.body.assetType,
    );
    res.status(201).json(result);
  };

  importMarkdown = async (req: Request, res: Response) => {
    const result = await this.service.importMarkdownFile(req.body.filePath);
    res.status(201).json(result);
  };

  importUniversal = async (req: Request, res: Response) => {
    const result = await this.service.importUniversalFile(req.body.filePath);
    res.status(201).json(result);
  };
}