import { useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface NetworkProps {
  nodeCount?: number
  spread?: number
  className?: string
}

function NetworkNodes({ nodeCount = 60, spread = 6 }: NetworkProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Stable pseudo-random positions
  const { positions, linePairs } = useMemo(() => {
    let seed = 17
    const rand = () => {
      // Mulberry32 deterministic PRNG
      seed = (seed + 0x6d2b79f5) | 0
      let t = seed
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    const pts: THREE.Vector3[] = []
    for (let i = 0; i < nodeCount; i++) {
      pts.push(
        new THREE.Vector3(
          (rand() - 0.5) * spread * 2,
          (rand() - 0.5) * spread,
          (rand() - 0.5) * spread,
        ),
      )
    }
    const pairs: Array<[number, number]> = []
    const maxDist = spread * 0.55
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i]!.distanceTo(pts[j]!) < maxDist) pairs.push([i, j])
      }
    }
    return { positions: pts, linePairs: pairs }
  }, [nodeCount, spread])

  const lineGeometry = useMemo(() => {
    const positionsArray = new Float32Array(linePairs.length * 6)
    linePairs.forEach(([a, b], idx) => {
      const pa = positions[a]!
      const pb = positions[b]!
      positionsArray.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], idx * 6)
    })
    const geom = new THREE.BufferGeometry()
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(positionsArray, 3),
    )
    return geom
  }, [positions, linePairs])

  const nodeGeometry = useMemo(() => {
    const positionsArray = new Float32Array(positions.length * 3)
    positions.forEach((p, i) => {
      positionsArray.set([p.x, p.y, p.z], i * 3)
    })
    const geom = new THREE.BufferGeometry()
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(positionsArray, 3),
    )
    return geom
  }, [positions])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.04
    groupRef.current.rotation.x =
      Math.sin(performance.now() * 0.00015) * 0.12
  })

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color={new THREE.Color("#a78bfa")}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </lineSegments>
      <points geometry={nodeGeometry}>
        <pointsMaterial
          color={new THREE.Color("#e879f9")}
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

export function NetworkScene({
  nodeCount = 60,
  spread = 6,
  className,
}: NetworkProps) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <NetworkNodes nodeCount={nodeCount} spread={spread} />
      </Canvas>
    </div>
  )
}
