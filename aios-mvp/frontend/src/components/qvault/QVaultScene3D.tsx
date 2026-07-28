import { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { TBitMemoryGraph } from "../../store/useTBitCognitiveStore";
import { coordinatesForKey, antiCoordinates, detectNodeType, nodeStyleForType } from "./QVaultUtils";
import { QVaultNode3D } from "./QVaultNode3D";
import { QVaultLinkLine } from "./QVaultLinkLine";

interface QVaultScene3DProps {
  memoryGraph: TBitMemoryGraph;
  selectedNodeKey: string | null;
  showLinks: boolean;
  showAntiVits: boolean;
  onSelectNode: (key: string | null) => void;
}

/** Central singularity glow */
function CentralOrigin() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 0.5 + 0.08 * Math.sin(t * 1.8);
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.22, 32, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
    </mesh>
  );
}

/** Circular grid ring at given radius */
function RingArc({ radius, color = "#5a72c8", opacity = 0.12 }: { radius: number; color?: string; opacity?: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.03, 6, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function SceneGrid() {
  return (
    <>
      <axesHelper args={[3]} />
      <RingArc radius={2} color="#4a5ec8" opacity={0.07} />
      <RingArc radius={4} color="#4a5ec8" opacity={0.06} />
      <RingArc radius={6} color="#4a5ec8" opacity={0.05} />
      <RingArc radius={8} color="#4a5ec8" opacity={0.04} />
      <RingArc radius={10} color="#3a4eb8" opacity={0.03} />
      <RingArc radius={12} color="#3a4eb8" opacity={0.025} />
      <Stars radius={22} depth={14} count={280} factor={4} saturation={0} fade speed={0.5} />
    </>
  );
}

interface SceneContentProps {
  memoryGraph: TBitMemoryGraph;
  selectedNodeKey: string | null;
  showLinks: boolean;
  showAntiVits: boolean;
  onSelectNode: (key: string | null) => void;
}

function SceneContent({
  memoryGraph,
  selectedNodeKey,
  showLinks,
  showAntiVits,
  onSelectNode,
}: SceneContentProps) {
  // Build node coordinate map (key → position)
  const nodePosMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const n of memoryGraph.nodes) {
      map.set(n.key, coordinatesForKey(n.key));
    }
    return map;
  }, [memoryGraph.nodes]);

  // Pre-filter visible nodes
  const visibleNodes = useMemo(
    () =>
      memoryGraph.nodes.map((n) => ({
        node: n,
        pos: nodePosMap.get(n.key)!,
        type: detectNodeType(n.key),
      })),
    [memoryGraph.nodes, nodePosMap],
  );

  // Link lines
  const linkLines = useMemo(() => {
    if (!showLinks) return [];
    return memoryGraph.links
      .map((l) => ({
        ...l,
        startPos: nodePosMap.get(l.sourceKey),
        endPos: nodePosMap.get(l.targetKey),
      }))
      .filter((l) => l.startPos && l.endPos);
  }, [memoryGraph.links, nodePosMap, showLinks]);

  return (
    <group>
      <CentralOrigin />
      <SceneGrid />

      {/* Links */}
      {linkLines.map((link, i) => (
        <QVaultLinkLine
          key={`link/${i}/${link.sourceKey}-${link.targetKey}`}
          start={link.startPos}
          end={link.endPos}
          type={link.type}
        />
      ))}

      {/* Nodes */}
      {visibleNodes.map(({ node, pos, type }) => {
        const style = nodeStyleForType(type);
        const sel = node.key === selectedNodeKey;
        return (
          <QVaultNode3D
            key={node.key}
            label={node.key}
            position={pos}
            visual={style}
            isSelected={selectedNodeKey === node.key}
            isAntiVit={false}
            onSelect={onSelectNode}
          />
        );
      })}

      {/* Anti-Vits */}
      {showAntiVits &&
        visibleNodes.map(({ node, type }) => {
          const style = nodeStyleForType(type);
          const antiPos = antiCoordinates(node.key);
          return (
            <QVaultNode3D
              key={`anti-${node.key}`}
              label={`¬${node.key}`}
              position={antiPos}
              visual={style}
              isAntiVit
              isSelected={false}
              onSelect={() => onSelectNode(null)}
            />
          );
        })}
    </group>
  );
}

/** Loading placeholder scene */
function SceneFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.6, 16, 16]} />
      <meshBasicMaterial color="#8B7CFF" wireframe transparent opacity={0.45} />
    </mesh>
  );
}

export function QVaultScene3D(props: QVaultScene3DProps) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0b1120" }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [4, 5, 12], fov: 50, near: 0.1, far: 80 }}
        style={{ background: "radial-gradient(ellipse at 30% 30%, #141e3c 0%, #0b1120 100%)" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 6, 0]} intensity={0.5} color="#2a3e80" />
        <fog attach="fog" args={["#0b1120", 14, 32]} />

        <Suspense fallback={<SceneFallback />}>
          <SceneContent
            memoryGraph={props.memoryGraph}
            selectedNodeKey={props.selectedNodeKey}
            showLinks={props.showLinks}
            showAntiVits={props.showAntiVits}
            onSelectNode={props.onSelectNode}
          />
        </Suspense>

        <OrbitControls
          enableDamping
          damping={0.12}
          minDistance={2.5}
          maxDistance={22}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}