import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useTBitStore } from "../store/useTBitStore";
import type { TBitVector3 } from "../store/useTBitCognitiveStore";

export function QuantumTelemetryRay() {
  const quantumPulseLine = useTBitStore((state) => state.quantumPulseLine);
  const isGravityCompressing = useTBitStore((state) => state.isGravityCompressing);
  const lineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineDashedMaterial> | null>(null);

  useFrame(({ clock }) => {
    const line = lineRef.current;
    if (line?.material && line.material instanceof THREE.LineDashedMaterial) {
      // @ts-ignore - dashOffset exists on LineDashedMaterial but TypeScript doesn't recognize it
      line.material.dashOffset = -clock.getElapsedTime() * 3;
      line.material.needsUpdate = true;
    }
  });

  const geometry = useMemo(() => {
    if (!quantumPulseLine) return null;
    const points = [
      new THREE.Vector3(...quantumPulseLine.from),
      new THREE.Vector3(...quantumPulseLine.to),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [quantumPulseLine]);

  const antiGeometry = useMemo(() => {
    if (!quantumPulseLine) return null;
    const antiTo: [number, number, number] = [
      -quantumPulseLine.to[0],
      -quantumPulseLine.to[1],
      -quantumPulseLine.to[2],
    ];
    const points = [new THREE.Vector3(...quantumPulseLine.from), new THREE.Vector3(...antiTo)];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [quantumPulseLine]);

  if (isGravityCompressing) {
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.82, 32, 32]} />
          <meshBasicMaterial color="#7c3aed" transparent opacity={0.32} wireframe />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshBasicMaterial color="#111827" transparent opacity={0.85} />
        </mesh>
      </group>
    );
  }

  if (!quantumPulseLine || !geometry || !antiGeometry) return null;

  return (
    <group>
      <primitive
        ref={lineRef as React.RefObject<THREE.Line<THREE.BufferGeometry, THREE.LineDashedMaterial>>}
        object={new THREE.Line(geometry, new THREE.LineDashedMaterial({
          color: quantumPulseLine.color,
          dashSize: 0.4,
          gapSize: 0.15,
          linewidth: 4,
          transparent: true,
          opacity: 0.9,
        }))}
      />

      <primitive
        object={new THREE.Line(antiGeometry, new THREE.LineDashedMaterial({
          color: "#ff3366",
          dashSize: 0.4,
          gapSize: 0.15,
          linewidth: 2,
          transparent: true,
          opacity: 0.5,
        }))}
      />

      <mesh position={quantumPulseLine.to}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={quantumPulseLine.color} transparent opacity={0.3} wireframe />
      </mesh>
    </group>
  );
}

export default QuantumTelemetryRay;
