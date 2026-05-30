import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

// Procedural tree
function CozyTree({ position, scale = 1 }) {
  const ref = useRef()
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + offset) * 0.03
    }
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 1.6, 8]} />
        <meshStandardMaterial color="#8B6F47" roughness={0.8} />
      </mesh>
      {/* Foliage bottom */}
      <mesh castShadow position={[0, 2, 0]}>
        <sphereGeometry args={[1.0, 12, 12]} />
        <meshStandardMaterial color="#4ade80" roughness={0.7} />
      </mesh>
      {/* Foliage top */}
      <mesh castShadow position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshStandardMaterial color="#86efac" roughness={0.7} />
      </mesh>
      {/* Cherry blossoms */}
      <mesh position={[0.5, 2.5, 0.3]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#fda4af" emissive="#fda4af" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.4, 2.2, -0.3]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#f9a8d4" emissive="#f9a8d4" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.2, 2.9, 0.4]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#fda4af" emissive="#fda4af" emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}


// Flower cluster
function FlowerCluster({ position, color = '#f9a8d4' }) {
  const ref = useRef()
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.5 + offset) * 0.08)
    }
  })

  return (
    <group ref={ref} position={position}>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        const r = 0.15
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0.15, Math.sin(angle) * r]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        )
      })}
      {/* Center */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={0.5} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 4]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
    </group>
  )
}

// Bench
function Bench({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.8, 0.1, 0.6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.85, -0.25]}>
        <boxGeometry args={[1.8, 0.7, 0.08]} />
        <meshStandardMaterial color="#c49a6c" roughness={0.8} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} castShadow position={[x, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.44, 0.5]} />
          <meshStandardMaterial color="#b08050" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// Small pond/lake
function Pond({ position }) {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.55 + Math.sin(state.clock.elapsedTime) * 0.08
    }
  })

  return (
    <group position={position}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.5, 24]} />
        <meshStandardMaterial
          color="#67b8de"
          transparent
          opacity={0.55}
          roughness={0.1}
          metalness={0.3}
          emissive="#7dd3fc"
          emissiveIntensity={0.1}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.4, 2.8, 24]} />
        <meshStandardMaterial color="#a3d9a5" roughness={0.7} />
      </mesh>
    </group>
  )
}

// Cherry Blossom Tree
const CherryBlossomTree = React.memo(function CherryBlossomTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.4, 6, 6]} />
        <meshStandardMaterial color="#4a3b2c" roughness={0.9} />
      </mesh>
      {/* Pink Foliage */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <dodecahedronGeometry args={[2.5, 1]} />
        <meshStandardMaterial color="#fbcfe8" roughness={0.6} />
      </mesh>
      <mesh position={[1.2, 7.5, -0.8]} castShadow>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#f9a8d4" roughness={0.6} />
      </mesh>
      <mesh position={[-1.2, 7.2, 0.8]} castShadow>
        <dodecahedronGeometry args={[2, 1]} />
        <meshStandardMaterial color="#fdf2f8" roughness={0.6} />
      </mesh>
    </group>
  )
})

// Yellow Flower Tree
const YellowFlowerTree = React.memo(function YellowFlowerTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 5, 6]} />
        <meshStandardMaterial color="#3f2e1a" roughness={0.9} />
      </mesh>
      {/* Yellow Foliage */}
      <mesh position={[0, 5.6, 0]} castShadow>
        <sphereGeometry args={[2.2, 8, 8]} />
        <meshStandardMaterial color="#fef08a" roughness={0.7} />
      </mesh>
      <mesh position={[1, 6.2, 0]} castShadow>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshStandardMaterial color="#fde047" roughness={0.7} />
      </mesh>
      <mesh position={[-1, 5.8, 0.6]} castShadow>
        <sphereGeometry args={[1.8, 8, 8]} />
        <meshStandardMaterial color="#facc15" roughness={0.7} />
      </mesh>
    </group>
  )
})

// Procedural Bamboo Stalk
const Bamboo = React.memo(function Bamboo({ position, height = 4, scale = 1 }) {
  const ref = useRef()
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + offset) * 0.04
      ref.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.9 + offset) * 0.04
    }
  })

  const segments = []
  const segHeight = 0.6
  const numSegs = Math.floor(height / segHeight)
  for (let i = 0; i < numSegs; i++) {
    segments.push(
      <group key={i} position={[0, i * segHeight + segHeight/2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.06, segHeight - 0.02, 6]} />
          <meshStandardMaterial color="#4ade80" roughness={0.8} />
        </mesh>
        <mesh position={[0, segHeight/2, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 6]} />
          <meshStandardMaterial color="#22c55e" roughness={0.9} />
        </mesh>
        {/* Use deterministic leaf placement instead of random to prevent flickering */}
        {i % 2 === 0 && (
          <mesh position={[0.1, segHeight/2, 0]} rotation={[0, 0, -Math.PI/4]}>
            <planeGeometry args={[0.3, 0.1]} />
            <meshStandardMaterial color="#86efac" side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    )
  }

  return (
    <group ref={ref} position={position} scale={scale}>
      {segments}
    </group>
  )
})

// Wooden Signboard to the Park
function Signboard({ position, rotation = [0, -Math.PI / 2, 0], text }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Post */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      {/* Board */}
      <mesh position={[0, 2.5, 0.05]} castShadow>
        <boxGeometry args={[2, 0.8, 0.1]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
      </mesh>
      <Text position={[0, 2.5, 0.12]} fontSize={0.3} color="#fde047" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black" fontWeight="bold">
        {text}
      </Text>
      <Text position={[0, 2.1, 0.12]} fontSize={0.15} color="white" anchorX="center" outlineWidth={0.01} outlineColor="black">
        (Stand Here)
      </Text>
    </group>
  )
}

// MDU College Building (Facade)
function CollegeBuilding({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <boxGeometry args={[4, 6, 16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
      </mesh>
      
      <mesh castShadow position={[0, 6.5, 0]}>
        <boxGeometry args={[4.4, 1, 16.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {[-6, -2, 2, 6].map((z, i) => (
        <mesh key={i} castShadow position={[2.2, 2.5, z]}>
          <cylinderGeometry args={[0.3, 0.3, 5, 8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
        </mesh>
      ))}

      {/* MDU Sign */}
      <mesh position={[2.05, 5, 0]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[6, 1.5]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <Text position={[2.1, 5, 0]} rotation={[0, Math.PI/2, 0]} fontSize={1} color="white" anchorX="center" anchorY="middle">
        MDU
      </Text>
      
      <mesh position={[3, 1, 0]}>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// Falling Leaves Particle System
function FallingLeaves() {
  const count = 30
  const leaves = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * 28 - 6,
        y: Math.random() * 8 + 2,
        z: Math.random() * 16 - 8,
        speed: 0.5 + Math.random() * 1.5,
        wobbleSpeed: 1 + Math.random() * 2,
        wobbleSize: 0.5 + Math.random() * 1,
        color: Math.random() > 0.5 ? '#fda4af' : '#f9a8d4'
      })
    }
    return arr
  }, [])

  const ref = useRef()

  useFrame((state, dt) => {
    if (!ref.current) return
    const time = state.clock.elapsedTime
    ref.current.children.forEach((leaf, i) => {
      const data = leaves[i]
      if (!data) return
      leaf.position.y -= data.speed * dt
      leaf.position.x += Math.sin(time * data.wobbleSpeed) * dt * data.wobbleSize
      leaf.rotation.x += dt
      leaf.rotation.y += dt * 0.5
      
      if (leaf.position.y < -0.2) {
        leaf.position.y = 8 + Math.random() * 2
        leaf.position.x = Math.random() * 28 - 6
      }
    })
  })

  return (
    <group ref={ref}>
      {leaves.map((data, i) => (
        <mesh key={i} position={[data.x, data.y, data.z]} rotation={[Math.random()*Math.PI, Math.random()*Math.PI, 0]}>
          <planeGeometry args={[0.15, 0.15]} />
          <meshStandardMaterial color={data.color} side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// Mushroom
function Mushroom({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.18, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} />
      </mesh>
      <mesh position={[0.08, 0.38, 0.08]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.06, 0.4, -0.05]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  )
}

// Floating particle (firefly)
function Firefly({ position }) {
  const ref = useRef()
  const speed = useMemo(() => 0.5 + Math.random() * 0.5, [])
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])
  const radius = useMemo(() => 0.5 + Math.random() * 1, [])

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * speed + offset
      ref.current.position.x = position[0] + Math.sin(t) * radius
      ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.5
      ref.current.position.z = position[2] + Math.cos(t) * radius
      ref.current.material.opacity = 0.4 + Math.sin(t * 3) * 0.4
    }
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={2} transparent opacity={0.6} />
    </mesh>
  )
}

// Background Tree (cheap, completely static)
const BgTree = React.memo(function BgTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3, 6]} />
        <meshStandardMaterial color="#3f2e1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[2.5, 6, 6]} />
        <meshStandardMaterial color="#1f4d2a" roughness={1} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <sphereGeometry args={[1.8, 6, 6]} />
        <meshStandardMaterial color="#225b31" roughness={1} />
      </mesh>
    </group>
  )
})

export default function CozyMap() {
  const fireflies = useMemo(() => {
    const arr = []
    for (let i = 0; i < 20; i++) {
      arr.push([
        (Math.random() * 28) - 6,
        0.5 + Math.random() * 1.5,
        (Math.random() * 16) - 8,
      ])
    }
    return arr
  }, [])

  // Generate Bamboo positions ONCE so they don't rerender/fluctuate
  const bambooData = useMemo(() => {
    const arr = []
    for (let i = 0; i < 50; i++) {
      let xPos = 12 + Math.random() * 16 // from X=12 to X=28
      let zPos = (Math.random() - 0.5) * 16 // from Z=-8 to Z=8
      
      // Keep main horizontal path clear (Z=0)
      if (zPos > -2 && zPos < 2) {
        zPos = zPos > 0 ? zPos + 2 : zPos - 2
      }

      // Keep park branch path clear (X=17 to 19, Z from 1 to -9)
      if (xPos > 16 && xPos < 20 && zPos < 1 && zPos > -9) {
        xPos -= 3
      }

      // Keep the new Hall branch path clear (X=23 to 25, Z from -1 to 9)
      if (xPos > 22 && xPos < 26 && zPos > -1 && zPos < 9) {
        xPos += 3
      }

      // Keep snow area clear
      if (xPos > 22 && zPos > 6) {
        continue;
      }
      
      arr.push({
        position: [xPos, 0, zPos],
        height: 4 + Math.random() * 3,
        scale: 0.8 + Math.random() * 0.4
      })
    }
    return arr
  }, [])

  // Static border trees placed just outside the movement boundaries
  const bgTrees = useMemo(() => {
    const arr = []
    // Left boundary
    for (let i = 0; i < 12; i++) arr.push([-14 - Math.random() * 4, 0, (Math.random() - 0.5) * 25])
    // Right boundary (Past X=40)
    for (let i = 0; i < 24; i++) arr.push([40 + Math.random() * 6, 0, (Math.random() - 0.5) * 25])
    // Top boundary (Z > 10)
    for (let i = 0; i < 30; i++) arr.push([(Math.random() * 50) - 8, 0, 11 + Math.random() * 5])
    // Bottom boundary (Z < -10)
    for (let i = 0; i < 30; i++) arr.push([(Math.random() * 50) - 8, 0, -11 - Math.random() * 5])
    
    return arr.map(pos => ({ pos, scale: 0.7 + Math.random() * 0.5 }))
  }, [])

  return (
    <group>
      {/* Lighting restored from old Game.jsx */}
      <ambientLight intensity={0.9} color="#ffe0ff" />
      <directionalLight
        position={[8, 16, 6]} intensity={1.6} color="#fff5e0" castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-16} shadow-camera-right={16}
        shadow-camera-top={16}  shadow-camera-bottom={-16}
      />
      <pointLight position={[0, 6, 16]} intensity={0.8} color="#ffd6ec" distance={28} />
      <pointLight position={[-6, 5, -6]} intensity={0.7} color="#c084fc" distance={18} />
      <pointLight position={[7, 4, 7]}   intensity={0.6} color="#ff6b9d" distance={15} />

      {/* Infinite Background Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[8, -0.1, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#2d6a36" roughness={1} />
      </mesh>

      {/* Static Border Trees */}
      {bgTrees.map((data, i) => (
        <BgTree key={`bg-${i}`} position={data.pos} scale={data.scale} />
      ))}

      {/* Main Walkable Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[16, 0, 0]}>
        <planeGeometry args={[44, 20]} />
        <meshStandardMaterial color="#3a7d44" roughness={0.9} />
      </mesh>

      <CollegeBuilding position={[-9, 0, 0]} />

      {/* Main Walkable Path */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[16, 0.015, 0]}>
        <planeGeometry args={[44, 2]} />
        <meshStandardMaterial color="#d4a574" roughness={0.9} />
      </mesh>

      {/* Branch Path to Park (Downwards) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.015, -4]}>
        <planeGeometry args={[2, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.9} />
      </mesh>

      {/* Branch Path to Hall (Upwards) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[24, 0.015, 4]}>
        <planeGeometry args={[2, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.9} />
      </mesh>

      {/* Branch Path to House (Downwards) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[32, 0.015, -4]}>
        <planeGeometry args={[2, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.9} />
      </mesh>

      {/* Snow Patches at the end of the Hall branch */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[24, 0.018, 8]}>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[22, 0.018, 7]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[26, 0.018, 7]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>

      {/* House Signboard */}
      <Signboard position={[32, 0, -8]} rotation={[0, 0, 0]} text="To House" />

      {/* Cherry Blossoms and Yellow Flowers around the House Branch */}
      <CherryBlossomTree position={[29, 0, -3]} scale={1.2} />
      <CherryBlossomTree position={[35, 0, -2]} scale={1.1} />
      <CherryBlossomTree position={[30, 0, -7]} scale={1.3} />
      <CherryBlossomTree position={[34, 0, -8]} scale={1.2} />
      <CherryBlossomTree position={[37, 0, 2]} scale={1.1} />

      <YellowFlowerTree position={[28, 0, 2]} scale={1.2} />
      <YellowFlowerTree position={[36, 0, -5]} scale={1.1} />
      <YellowFlowerTree position={[31, 0, -1]} scale={1.3} />
      <YellowFlowerTree position={[34, 0, 3]} scale={1.2} />

      {bambooData.map((data, i) => (
        <Bamboo key={`bamboo-${i}`} position={data.position} height={data.height} scale={data.scale} />
      ))}

      <CozyTree position={[-2, 0, -4]} scale={1.2} />
      <CozyTree position={[2, 0, 5]} scale={1.0} />
      <CozyTree position={[8, 0, -6]} scale={1.1} />

      <Pond position={[6, 0, 4]} />

      <Bench position={[-3, 0, -1.8]} rotation={[0, 0, 0]} />
      <Bench position={[4, 0, 1.8]} rotation={[0, Math.PI, 0]} />
      <Bench position={[11, 0, -1.8]} rotation={[0, 0, 0]} />

      <FlowerCluster position={[-2, 0, 2]} color="#f9a8d4" />
      <FlowerCluster position={[3, 0, 3]} color="#fda4af" />
      <FlowerCluster position={[7, 0, -3]} color="#c4b5fd" />
      <FlowerCluster position={[14, 0, 4]} color="#f9a8d4" />
      <FlowerCluster position={[18, 0, -8]} color="#fda4af" />

      <Mushroom position={[-3, 0, 3]} scale={0.8} />
      <Mushroom position={[4, 0, -4]} scale={1} />
      <Mushroom position={[12, 0, 5]} scale={0.6} />
      <Mushroom position={[16, 0, -2]} scale={0.9} />

      <mesh castShadow position={[-1, 0.2, 5]}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[5, 0.15, -4]}>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#a3a3a3" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[13, 0.18, 3]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#8b8b8b" roughness={0.9} />
      </mesh>

      {fireflies.map((pos, i) => (
        <Firefly key={i} position={pos} />
      ))}
      <FallingLeaves />

      <Signboard position={[18, 0, -6.5]} rotation={[0, 0, 0]} text="To Park" />
      <Signboard position={[24, 0, 8]} rotation={[0, Math.PI, 0]} text="To Hall" />

    </group>
  )
}
