import { useRef, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { NodeVisualStyle } from "./QVaultUtils";
import { ANTI_V_COLOR, ANTI_V_HALO } from "./QVaultUtils";

interface QVaultNode3DProps {
  key: string;
  label: string;
  position: [number, number, number];
  /** Visual style derived from node type */
  visual: NodeVisualStyle;
  isSelected: boolean;
  isAntiVit: boolean;
  onSelect: (key: string) => void;
}

const LABEL_MAX_LEN = 48;

function shortLabel(raw: string): string {
  if (raw.length <= LABEL_MAX_LEN) return raw;
  return raw.slice(0, LABEL_MAX_LEN) + "…";
}

export function QVaultNode3D({
  key,
  label,
  position,
  visual,
  isSelected,
  isAntiVit,
  onSelect,
}: QVaultNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // Pulse animation for selected or hovered nodes
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + 0.12 * Math.sin(t * 3);
    const s = isSelected ? pulse : hovered ? 1.08 : 1;
    meshRef.current.scale.setScalar(s);
    if (ringRef.current && visual.ringOn) {
      ringRef.current.scale.setScalar(s * 1.35);
    }
  });

  const coreColor = isAntiVit ? ANTI_V_COLOR : visual.color;
  const haloColor = isAntiVit ? ANTI_V_HALO : visual.halo;
  const size = visual.size * (isAntiVit ? 0.75 : 1);

  // Shader material for glow core
  const coreMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(coreColor) },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
            fresnel = pow(fresnel, 2.5);
            vec3 inner = uColor * 0.4;
            vec3 edge = uColor * 1.6;
            vec3 col = mix(inner, edge, fresnel);
            float alpha = 0.78 + fresnel * 0.22;
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    [coreColor],
  );

  return (
    <group>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        position={new THREE.Vector3(position[0], position[1], position[2])}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(key);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size * 0.55, 32, 32]} />
        <primitive object={coreMaterial} attach="material" />
      </mesh>

      {/* Glow halo (larger transparent ring) */}
      <mesh
        position={new THREE.Vector3(position[0], position[1], position[2])}
        scale={[1.7, 1.7, 1.7]}
      >
        <ringGeometry args={[size * 0.58, size * 0.8, 48]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={hovered || isSelected ? 0.25 : 0.10}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Answer ring (chat nodes only) */}
      {visual.ringOn && (
        <mesh
          ref={ringRef}
          position={new THREE.Vector3(position[0], position[1], position[2])}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[size * 0.75, 0.06, 16, 64]} />
          <meshBasicMaterial
            color={visual.ringColor}
            transparent
            opacity={hovered || isSelected ? 0.55 : 0.18}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Exclamation ring for anti-vit */}
      {isAntiVit && (
        <mesh
          position={new THREE.Vector3(position[0], position[1], position[2])}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[size * 0.85, 0.04, 8, 32]} />
          <meshBasicMaterial
            color={ANTI_V_HALO}
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* HTML label overlay (billboard-like via Html + pointer-events toggle) */}
      <Html
        position={new THREE.Vector3(position[0], position[1] + size * 0.9, position[2])}
        center
        style={{ pointerEvents: "none" }}
        distanceFactor={18}
      >
        <div
          style={{
            fontSize: "9px",
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            color: hovered || isSelected ? "#ffffff" : isAntiVit ? "#ffcdd2" : "#b0cce8",
            background: isSelected
              ? "rgba(139,124,255,0.70)"
              : hovered
                ? "rgba(0,0,0,0.55)"
                : "transparent",
            padding: "1px 6px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            textShadow: "0 0 6px rgba(0,0,0,0.7)",
            transition: "background 0.18s ease, color 0.18s ease",
          }}
        >
          {shortLabel(label)}
        </div>
      </Html>
    </group>
  );
}