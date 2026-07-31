// QVaultUtils — Funciones puras de coordenadas, estilos de nodo/link, proyección 2D
// Deterministic addressing: key → FNV-1a hash → spherical coordinates → 3D point
// Mirror of T-Bit WikiLinksMesh coordinate system

export type NodeType = "chat" | "markdown" | "chunk" | "generic";

export interface NodeVisualStyle {
  color: string;
  halo: string;
  ringOn: boolean;
  ringColor: string;
  size: number;
}

/** FNV-1a 32-bit hash of a string */
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    hash = hash >>> 0; // force 32-bit unsigned
  }
  return hash;
}

/** Deterministic 3D coordinates for a key string */
export function coordinatesForKey(key: string): [number, number, number] {
  const h = hashTo(key);
  const sx = ((h[0] / 0xffffffff) - 0.5) * 2;
  const sy = ((h[1] / 0xffffffff) - 0.5) * 2;
  const sz = ((h[2] / 0xffffffff) - 0.5) * 2;
  const theta = Math.acos(sy) * (180 / Math.PI); // latitude-ish
  const phi = Math.atan2(sz, sx) * (180 / Math.PI);
  const baseRadius = 7 + (h[3] % 6); // 7–12
  const thetaRad = (theta * Math.PI) / 180;
  const phiRad = (phi * Math.PI) / 180;
  const x = baseRadius * Math.sin(thetaRad) * Math.cos(phiRad);
  const y = baseRadius * Math.cos(thetaRad);
  const z = baseRadius * Math.sin(thetaRad) * Math.sin(phiRad);
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100, Math.round(z * 100) / 100];
}

/** Hash a key into 4 32-bit chunks using FNV + linear congruential re-seed */
function hashTo(key: string): [number, number, number, number] {
  let h = fnv1a(key);
  const lcg = (s: number) => ((s * 1664525 + 1013904223) >>> 0);
  const h0 = h;
  const h1 = lcg(h0);
  const h2 = lcg(h1);
  const h3 = lcg(h2);
  return [h0, h1, h2, h3];
}

/** Coordinates for Anti-Vit: mirror across origin */
export function antiCoordinates(key: string): [number, number, number] {
  const [x, y, z] = coordinatesForKey(key);
  return [-x, -y, -z];
}

export const ANTI_V_COLOR = "#ed5f6c";
export const ANTI_V_HALO = "#ff9faa";

/** Detect node type from key pattern */
export function detectNodeType(key: string): NodeType {
  const lower = key.toLowerCase();
  if (lower.includes("chat") || lower.includes("memoria-ia")) return "chat";
  if (lower.includes(".md") || lower.includes("doc") || lower.includes("book")) return "markdown";
  if (lower.includes("chunk") || lower.includes(":part:")) return "chunk";
  return "generic";
}

/** Visual styling for each node type */
export function nodeStyleForType(type: NodeType): NodeVisualStyle {
  switch (type) {
    case "chat":
      return { color: "#7e1bfd", halo: "#ffd84d", ringOn: true, ringColor: "#00ff88", size: 1.0 };
    case "markdown":
      return { color: "#009dff", halo: "#00e5ff", ringOn: false, ringColor: "", size: 1.2 };
    case "chunk":
      return { color: "#ffb000", halo: "#ff7a00", ringOn: false, ringColor: "", size: 0.6 };
    default:
      return { color: "#00f5ff", halo: "#7e1bfd", ringOn: false, ringColor: "", size: 0.8 };
  }
}

/** Link visual style by link type */
export function linkStyleForType(type: string): { color: string; dash: boolean } {
  switch (type) {
    case "quantum-link":
      return { color: "#8B7CFF", dash: false };
    case "backlink":
      return { color: "#FF5FAE", dash: true };
    default:
      return { color: "#5CD9E8", dash: true };
  }
}

/** SVG 2D projection of a 3D point */
export function projectTo2D(
  pos: [number, number, number],
  canvasW: number,
  canvasH: number,
  scale = 20,
): { cx: number; cy: number } {
  const [x, y, z] = pos;
  // Oblique projection (cabinet-like)
  const cx = canvasW / 2 + x * scale + z * scale * 0.5;
  const cy = canvasH / 2 - y * scale + z * scale * 0.3;
  return { cx, cy };
}