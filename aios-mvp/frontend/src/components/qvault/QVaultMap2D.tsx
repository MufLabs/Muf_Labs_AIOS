import { useMemo, useState } from "react";
import type { TBitMemoryGraph } from "../../store/useTBitCognitiveStore";
import {
  coordinatesForKey,
  antiCoordinates,
  detectNodeType,
  nodeStyleForType,
  projectTo2D,
  ANTI_V_COLOR,
  ANTI_V_HALO,
} from "./QVaultUtils";

interface QVaultMap2DProps {
  memoryGraph: TBitMemoryGraph;
  selectedNodeKey: string | null;
  showLinks: boolean;
  showAntiVits: boolean;
  onSelectNode: (key: string | null) => void;
}

const W = 860;
const H = 600;
const SCALE = 18;

export function QVaultMap2D({
  memoryGraph,
  selectedNodeKey,
  showLinks,
  showAntiVits,
  onSelectNode,
}: QVaultMap2DProps) {
  const [tooltip, setTooltip] = useState<{ key: string; cx: number; cy: number } | null>(null);

  // Build node projections
  const nodePos2D = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number; type: string }>();
    for (const n of memoryGraph.nodes) {
      const pos3 = coordinatesForKey(n.key);
      map.set(n.key, {
        ...projectTo2D(pos3, W, H, SCALE),
        type: detectNodeType(n.key),
      });
    }
    return map;
  }, [memoryGraph.nodes]);

  // Anti-Vit projections
  const antiPos2D = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number }>();
    if (!showAntiVits) return map;
    for (const n of memoryGraph.nodes) {
      const pos3 = antiCoordinates(n.key);
      map.set(n.key, projectTo2D(pos3, W, H, SCALE));
    }
    return map;
  }, [memoryGraph.nodes, showAntiVits]);

  // Link lines in 2D
  const linkLines2D = useMemo(() => {
    if (!showLinks) return [];
    return memoryGraph.links
      .map((l) => {
        const s = nodePos2D.get(l.sourceKey);
        const t = nodePos2D.get(l.targetKey);
        return s && t ? { ...l, x1: s.cx, y1: s.cy, x2: t.cx, y2: t.cy } : null;
      })
      .filter(Boolean) as Array<{
      sourceKey: string;
      targetKey: string;
      type: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }>;
  }, [memoryGraph.links, nodePos2D, showLinks]);

  // Node style for 2D node circle rendering
  const styleMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof nodeStyleForType>>();
    for (const n of memoryGraph.nodes) {
      m.set(n.key, nodeStyleForType(detectNodeType(n.key)));
    }
    return m;
  }, [memoryGraph.nodes]);

  return (
    <div style={{ position: "relative", width: W, height: H, margin: "0 auto", background: "rgba(11,17,32,0.92)", borderRadius: 12 }}>
      <svg width={W} height={H} style={{ display: "block" }}>
        {/* Grid lines */}
        <defs>
          <filter id="glow2d">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="gradCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* Origin glow */}
        <circle cx={W / 2} cy={H / 2} r={28} fill="url(#gradCenter)" />

        {/* Links */}
        {linkLines2D.map((l, i) => (
          <line
            key={`l2d-${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.type === "quantum-link" ? "#8B7CFF" : l.type === "backlink" ? "#FF5FAE" : "#5CD9E8"}
            strokeWidth={1.2}
            strokeOpacity={0.28}
            strokeDasharray={l.type !== "quantum-link" ? "4 4" : undefined}
          />
        ))}

        {/* Nodes */}
        {[...nodePos2D.entries()].map(([key, pos]) => {
          const style = styleMap.get(key) || nodeStyleForType("generic");
          const sel = key === selectedNodeKey;
          const r = sel ? 6.5 : 5;
          return (
            <g
              key={key}
              onMouseEnter={() => setTooltip({ key, cx: pos.cx, cy: pos.cy })}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => onSelectNode(key === selectedNodeKey ? null : key)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={r}
                fill={style.color}
                stroke={sel ? "#ffffff" : "transparent"}
                strokeWidth={sel ? 1.5 : 0}
                opacity={sel ? 1 : 0.82}
                filter="url(#glow2d)"
              />
              {sel && (
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={r + 5}
                  fill="none"
                  stroke="#8B7CFF"
                  strokeWidth={1}
                  opacity={0.5}
                />
              )}
            </g>
          );
        })}

        {/* Anti-Vits */}
        {showAntiVits &&
          [...antiPos2D.entries()].map(([key, pos]) => {
            const style = styleMap.get(key) || nodeStyleForType("generic");
            return (
              <g key={`anti2d-${key}`} style={{ cursor: "default" }}>
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={3.8}
                  fill={ANTI_V_COLOR}
                  stroke={ANTI_V_HALO}
                  strokeWidth={0.7}
                  opacity={0.45}
                />
                <text x={pos.cx + 6} y={pos.cy + 4} fill={ANTI_V_HALO} fontSize={7} fontFamily="monospace" opacity={0.55}>
                  ¬{key.slice(0, 14)}
                </text>
              </g>
            );
          })}
      </svg>

      {/* Tooltip overlay */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.cx + 12,
            top: tooltip.cy - 10,
            background: "rgba(0,0,0,0.82)",
            color: "#c8d4f8",
            fontSize: 10,
            fontFamily: "'Fira Code', monospace",
            padding: "2px 8px",
            borderRadius: 5,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          {tooltip.key}
        </div>
      )}
    </div>
  );
}