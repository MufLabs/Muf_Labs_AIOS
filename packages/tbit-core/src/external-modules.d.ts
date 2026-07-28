declare module "mammoth" {
  export function convertToHtml(input: { buffer: Buffer }): Promise<{ value: string }>;
  export function extractRawText(input: { buffer: Buffer }): Promise<{ value: string }>;
}

declare module "pdf-parse" {
  interface PDFResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    total: number;
  }
  interface PDFOptions {
    data: Buffer;
  }
  export class PDFParse {
    constructor(options: PDFOptions);
    getText(): Promise<PDFResult>;
    destroy(): Promise<void>;
  }
}

declare module "read-excel-file/node" {
  interface ExcelSheet {
    sheet: string;
    data: unknown[][];
  }
  export default function readXlsxFile(
    input: Buffer | string,
    options?: { sheet?: string }
  ): Promise<ExcelSheet[]>;
}
