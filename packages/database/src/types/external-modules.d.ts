declare module "mammoth" {
  export interface ExtractRawTextOptions {
    buffer?: Buffer;
    path?: string;
  }
  export interface ExtractRawTextResult {
    value: string;
    messages: unknown[];
  }
  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
}

declare module "pdf-parse" {
  export interface PdfParseOptions { data: Buffer; }
  export interface PdfParseResult { text?: string; total?: number; numpages?: number; info?: Record<string, unknown>; }
  export default class PDFParse {
    constructor(options: PdfParseOptions);
    getText(): Promise<PdfParseResult>;
    destroy(): Promise<void>;
  }
}
