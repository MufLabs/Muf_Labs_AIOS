/**
 * @aios/database - textEncoding
 *
 * Migrated from T-Bit (c:\Git\T-Bit\textEncoding.ts)
 * Provides Unicode normalization and key normalization utilities
 * used throughout the .tbit storage engine.
 */

/**
 * Normalizes Unicode text to NFC form to ensure consistent
 * byte-level representation across platforms.
 */
export function normalizeUnicodeText(text: string): string {
  return text.normalize("NFC");
}

/**
 * Normalizes a T-Bit storage key by:
 * 1. NFC Unicode normalization
 * 2. Lowercasing
 * 3. Collapsing whitespace
 * 4. Trimming leading/trailing whitespace
 */
export function normalizeTBitKey(key: string): string {
  return normalizeUnicodeText(key)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}