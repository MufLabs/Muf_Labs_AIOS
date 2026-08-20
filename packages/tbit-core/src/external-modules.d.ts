declare module "mammoth" {
  export function convertToHtml(input: { buffer: Buffer }): Promise<{ value: string }>;
  export function extractRawText(input: { buffer: Buffer }): Promise<{ value: string }>;
}

declare module "pdf-parse" {
  interface PDFResult {
    text?: string;
    numpages?: number;
    numrender?: number;
    info?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    version?: string;
  }
  export default function PDFParse(
    dataBuffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<PDFResult>;
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
