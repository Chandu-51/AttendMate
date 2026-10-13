import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";

interface OrbProps {
  percentage: number;
  detail?: "high" | "low";
}

function Ring({ percentage, radius, tube, color, opacity = 1 }: {
  percentage: number;
  radius: number;
  tube: number;
  color: string;
  opacity?: number;
}) {
  const geometry = useMemo(
    () => new THREE.TorusGeometry(radius, tube, 20, 160, (Math.PI * 2 * percentage) / 100),
    [radius, tube, percentage],
  );
  return (
    <mesh geometry={geometry} rotation={[0, 0, Math.PI / 2]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.65}
        roughness={0.25}
        metalness={0.6}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

function Nodes({ count, radius }: { count: number; radius: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return [Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * 2) * 0.35] as [
          number,
          number,
          number,
        ];
      }),
    [count, radius],
  );
  return (
    <>
      {items.map((position, i) => (
        <mesh key={i} position={position}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </>
  );
}

function Particles({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#67e8f9" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function Scene({ percentage, detail = "high" }: OrbProps) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!group.current) return;
    const { x, y } = state.pointer;
    group.current.rotation.y += (x * 0.35 - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-y * 0.25 - group.current.rotation.x) * 0.05;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
  });

  const scale = Math.min(1, viewport.width / 7);

  return (
    <group ref={group} scale={scale}>
      <Ring percentage={100} radius={2} tube={0.055} color="#334155" opacity={0.5} />
      <Ring percentage={percentage} radius={2} tube={0.09} color="#22d3ee" />
      <Ring percentage={100} radius={1.55} tube={0.012} color="#38bdf8" opacity={0.35} />
      {detail === "high" && (
        <>
          <Nodes count={5} radius={2.55} />
          <Particles count={140} />
        </>
      )}
      <mesh>
        <sphereGeometry args={[1.32, 48, 48]} />
        <meshStandardMaterial
          color="#0b1220"
          emissive="#0e7490"
          emissiveIntensity={0.18}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}

export default function AttendanceOrb({ percentage }: { percentage: number }) {
  const isMobile = useIsMobile();
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative h-[320px] w-full sm:h-[420px] lg:h-[480px]">
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 45 }}
        dpr={isMobile ? 1 : [1, 1.8]}
        frameloop={reduced ? "demand" : "always"}
        gl={{ antialias: !isMobile, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 6]} intensity={45} color="#22d3ee" />
        <pointLight position={[-5, -3, 3]} intensity={25} color="#818cf8" />
        <Suspense fallback={null}>
          <Scene percentage={percentage} detail={isMobile ? "low" : "high"} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          {percentage}%
        </span>
        <span className="mt-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Attendance
        </span>
      </div>
    </div>
  );
}
