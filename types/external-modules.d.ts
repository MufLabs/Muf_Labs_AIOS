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
  export interface PdfParseResult { text?: string; total?: number; numpages?: number; numrender?: number; info?: Record<string, unknown>; metadata?: Record<string, unknown> | null; version?: string; }
  export default class PDFParse {
    constructor(options: PdfParseOptions);
    getText(): Promise<PdfParseResult>;
    destroy(): Promise<void>;
  }
}
declare module "sql.js" {
  export interface Statement {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
    reset(): void;
    run(params?: unknown[]): void;
    get(params?: unknown[]): unknown;
  }
  export interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string): { columns: string[]; values: unknown[][]; }[];
    prepare(sql: string): Statement;
    close(): void;
    getRowsModified(): number;
    export(): Uint8Array;
  }
  export interface SqlJsStatic {
    Database: { new (data?: ArrayLike<number> | Buffer | null): Database; };
  }
  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }
  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
