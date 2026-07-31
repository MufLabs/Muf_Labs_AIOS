import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { linkStyleForType } from "./QVaultUtils";

interface QVaultLinkLineProps {
  start: [number, number, number];
  end: [number, number, number];
  type: string;
}

export function QVaultLinkLine({ start, end, type }: QVaultLinkLineProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const style = useMemo(() => linkStyleForType(type || "quantum-link"), [type]);

  // Animate as dashed pulse for backlinks
  useFrame(({ clock }) => {
    if (!ref.current || !style.dash) return;
    const t = clock.getElapsedTime();
    const offset = (t * 0.5) % 1;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    // Modulate opacity to simulate dash scroll
    mat.opacity = 0.12 + 0.08 * Math.sin(t * 2);
    // Could also adjust dashOffset if using LineDashedMaterial, but for this MVP
    // a simple mesh cylinder with opacity modulation works
  });

  // Compute midpoint + direction
  const mid = new THREE.Vector3(
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  );
  const dir = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  const length = dir.length();
  dir.normalize();

  // Rotation quaternion from default up (0,1,0) to direction
  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  return (
    <mesh
      ref={ref}
      position={mid}
      quaternion={quat}
    >
      <cylinderGeometry args={[0.04, 0.04, length, 6, 1]} />
      <meshBasicMaterial
        color={style.color}
        transparent
        opacity={style.dash ? 0.28 : 0.4}
        depthWrite={false}
      />
    </mesh>
  );
}