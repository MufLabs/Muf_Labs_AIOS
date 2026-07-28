import { Request, Response } from "express";
import { TBitService } from "../services/TBitService";

export class TBitController {
  private readonly service = new TBitService();

  // ─── Container lifecycle ────────────────────────────────

  createContainer = async (req: Request, res: Response) => {
    const result = await this.service.createContainer(req.body);
    res.status(201).json(result);
  };

  // ─── Memo operations ────────────────────────────────────

  storeMemo = async (req: Request, res: Response) => {
    const result = await this.service.storeMemo(req.body);
    res.status(201).json(result);
  };

  recallMemos = async (req: Request, res: Response) => {
    const result = await this.service.recallMemos({
      containerId: req.params.containerId,
      query: req.query.q as string,
      topK: req.query.topK ? Number(req.query.topK) : undefined,
    });
    res.json(result);
  };

  getMemoryContext = async (req: Request, res: Response) => {
    const result = await this.service.getMemoryContext(
      req.params.containerId,
      req.params.recordId,
      req.query.depth ? Number(req.query.depth) : undefined,
    );
    res.json(result);
  };

  // ─── Query index ────────────────────────────────────────

  searchIndex = async (req: Request, res: Response) => {
    const result = await this.service.searchIndex(
      req.params.containerId,
      req.query.q as string,
      req.query.topK ? Number(req.query.topK) : undefined,
    );
    res.json(result);
  };

  rebuildIndex = async (req: Request, res: Response) => {
    await this.service.rebuildIndex(req.params.containerId);
    res.json({ status: "ok" });
  };

  // ─── Container health ───────────────────────────────────

  getHealth = async (req: Request, res: Response) => {
    const result = await this.service.getHealth(req.params.containerId);
    res.json(result);
  };

  reconcileHealth = async (req: Request, res: Response) => {
    const result = await this.service.reconcileHealth(req.params.containerId);
    res.json(result);
  };

  // ─── Encryption keys ────────────────────────────────────

  getEncryptionKeyInfo = async (_req: Request, res: Response) => {
    const result = await this.service.getEncryptionKeyInfo();
    res.json(result);
  };

  getEncryptionKeyRing = async (_req: Request, res: Response) => {
    const result = await this.service.getEncryptionKeyRing();
    res.json(result);
  };

  // ─── Asset management ───────────────────────────────────

  listAssets = async (req: Request, res: Response) => {
    const result = await this.service.listContainerAssets(req.params.containerId);
    res.json(result);
  };

  getAssetStats = async (req: Request, res: Response) => {
    const result = await this.service.getAssetStats(req.params.containerId);
    res.json(result);
  };

  importBinary = async (req: Request, res: Response) => {
    const result = await this.service.importBinary(
      req.params.containerId,
      req.body.filePath,
      req.body.assetType,
    );
    res.status(201).json(result);
  };

  importMarkdown = async (req: Request, res: Response) => {
    const result = await this.service.importMarkdown(
      req.params.containerId,
      req.body.filePath,
    );
    res.status(201).json(result);
  };

  importUniversal = async (req: Request, res: Response) => {
    const result = await this.service.importUniversal(
      req.params.containerId,
      req.body.filePath,
    );
    res.status(201).json(result);
  };
}