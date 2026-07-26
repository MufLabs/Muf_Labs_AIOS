/**
 * @aios/database - RuntimePaths
 * Migrated from T-Bit (c:\Git\T-Bit\tbitRuntimePaths.ts)
 */
import { resolve } from "path";
const DEFAULT_DATA_DIR = resolve(process.cwd(), "data", "tbit");
export function getTBitDataDir(): string {
  return process.env.TBIT_ACTIVE_DATA_DIR ? resolve(process.env.TBIT_ACTIVE_DATA_DIR) : DEFAULT_DATA_DIR;
}
export function resolveActiveTBitDataPath(relativePath: string): string {
  return resolve(getTBitDataDir(), relativePath);
}
export function resolveContainerPath(name: string = "universo"): string {
  return resolveActiveTBitDataPath(`${name}.tbit`);
}
export function resolveMetadataPath(name: string = "universo"): string {
  return resolveActiveTBitDataPath(`${name}.tbit.meta.json`);
}
export function resolveWalPath(name: string = "universo"): string {
  return resolveActiveTBitDataPath(`${name}.tbit.wal.jsonl`);
}
export function resolveSnapshotsDir(name: string = "universo"): string {
  return resolveActiveTBitDataPath("snapshots");
}
export function resolveReplicasDir(): string {
  return resolveActiveTBitDataPath("replicas");
}
export function resolveExportsDir(): string {
  return resolveActiveTBitDataPath("exports");
}
export function resolveLockPath(name: string = "universo"): string {
  return resolveActiveTBitDataPath(`${name}.tbit.lock`);
}
