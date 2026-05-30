import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

// Wooden Signboard to the College
function Signboard({ position, text }) {
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* Post */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      {/* Board */}
      <mesh position={[0, 2.5, 0.05]} castShadow>
        <boxGeometry args={[3, 0.8, 0.1]} />
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

// Coffee Bot
function CoffeeBot({ botState }) {
  const groupRef = useRef()
  
  // Bot starts at Cafe (-12, 1.5, 0), moves to Table (0, 1.5, -2)
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    if (botState === 'idle') {
      groupRef.current.position.set(-12, 1.5, 0)
      groupRef.current.visible = false
    } else if (botState === 'delivering') {
      groupRef.current.visible = true
      // Move towards (0, 1.5, -2)
      const targetX = 0
      const targetZ = -2
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * delta * 2
      groupRef.current.position.z += (targetZ - groupRef.current.position.z) * delta * 2
      // Bobbing
      groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 8) * 0.2
    } else if (botState === 'delivered') {
      groupRef.current.visible = true
      groupRef.current.position.set(0, 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1, -2)
    }
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Bot Body */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 16]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Bot Eye */}
      <mesh position={[0, 0.2, 0.35]}>
        <boxGeometry args={[0.4, 0.15, 0.1]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
      </mesh>
      {/* Propeller */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.1]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      {/* Tray with Coffee */}
      <group position={[0, -0.2, 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.05, 0.6]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.25, 16]} />
          <meshStandardMaterial color="#fef08a" />
        </mesh>
      </group>
    </group>
  )
}

// Center Table
function CenterTable({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[1, 1, 0.1, 32]} />
        <meshStandardMaterial color="#fffbeb" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
    </group>
  )
}

// Modern Neon Shop (Zudio)
function ZudioBuilding({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <boxGeometry args={[8, 6, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>
      {/* Entrance Glass */}
      <mesh position={[0, 2, 4.1]}>
        <boxGeometry args={[4, 4, 0.2]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} metalness={0.8} />
      </mesh>
      {/* Zudio Sign */}
      <mesh position={[0, 5, 4.05]}>
        <planeGeometry args={[6, 1.5]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <Text position={[0, 5, 4.1]} fontSize={1.2} color="#f43f5e" anchorX="center" anchorY="middle">
        ZUDIO
      </Text>
      {/* Neon Strips */}
      <mesh position={[-3.8, 3, 4.1]}>
        <boxGeometry args={[0.1, 6, 0.1]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={2} />
      </mesh>
      <mesh position={[3.8, 3, 4.1]}>
        <boxGeometry args={[0.1, 6, 0.1]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

// Cute Cafe (Activity)
function ActivityCafe({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
        <boxGeometry args={[7, 5, 6]} />
        <meshStandardMaterial color="#fde047" roughness={0.9} />
      </mesh>
      {/* Awning */}
      <mesh position={[0, 4, 3.5]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[7, 0.2, 2]} />
        <meshStandardMaterial color="#ef4444" roughness={0.8} />
      </mesh>
      {/* Sign */}
      <Text position={[0, 5.5, 3.1]} fontSize={0.8} color="#1e293b" anchorX="center" anchorY="middle">
        ACTIVITY CAFE
      </Text>
      {/* Counter */}
      <mesh position={[0, 1.2, 3]}>
        <boxGeometry args={[4, 2.4, 1]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
    </group>
  )
}

// Central Fountain
function Fountain({ position }) {
  const waterRef = useRef()
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })
  return (
    <group position={position}>
      {/* Base */}
      <mesh receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[4, 4, 0.4, 32]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
      </mesh>
      {/* Inner Pool */}
      <mesh receiveShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[3.6, 3.6, 0.4, 32]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.9} />
      </mesh>
      {/* Water */}
      <mesh ref={waterRef} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[3.5, 3.5, 0.2, 32]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} metalness={0.5} roughness={0.1} />
      </mesh>
      {/* Center Pillar */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 2.6, 16]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
      </mesh>
    </group>
  )
}

// Park Bench
function ParkBench({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[2.2, 0.1, 0.8]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.0, -0.35]}>
        <boxGeometry args={[2.2, 0.8, 0.1]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} castShadow position={[x, 0.22, 0]}>
          <boxGeometry args={[0.1, 0.44, 0.7]} />
          <meshStandardMaterial color="#1c1917" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// Simple Tree
const ParkTree = React.memo(function ParkTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3, 6]} />
        <meshStandardMaterial color="#3f2e1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[2.5, 8, 8]} />
        <meshStandardMaterial color="#bef264" roughness={1} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <sphereGeometry args={[1.8, 8, 8]} />
        <meshStandardMaterial color="#a3e635" roughness={1} />
      </mesh>
    </group>
  )
})

export default function ParkMap({ botState }) {
  const trees = useMemo(() => {
    const arr = []
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 15 + Math.random() * 10
      arr.push({
        pos: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        scale: 0.8 + Math.random() * 0.5
      })
    }
    return arr
  }, [])

  return (
    <group>
      {/* Sunset Ambient Light overrides */}
      <ambientLight intensity={0.5} color="#ffedd5" />
      <directionalLight 
        position={[-10, 8, -10]} 
        intensity={2.5} 
        color="#fb923c" 
        castShadow 
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-20} shadow-camera-right={20}
        shadow-camera-top={20}  shadow-camera-bottom={-20}
      />
      {/* Rim light */}
      <pointLight position={[10, 5, 10]} intensity={1.5} color="#f472b6" distance={30} />

      {/* Infinite Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#4ade80" roughness={1} />
      </mesh>

      {/* Straight Walkable Path down the middle */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]}>
        <planeGeometry args={[6, 24]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.9} />
      </mesh>

      {/* Buildings facing each other on left and right */}
      {/* Cafe on the left (-X), rotated to face right (+X) */}
      <ActivityCafe position={[-10, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      {/* Zudio on the right (+X), rotated to face left (-X) */}
      <ZudioBuilding position={[10, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Centerpiece at the end of the road (-Z) */}
      <Fountain position={[0, 0, -8]} />
      
      {/* Center Table and Benches (Coffee Date spot) */}
      <CenterTable position={[0, 0, -3]} />
      <ParkBench position={[-2, 0, -3]} rotation={[0, Math.PI / 2, 0]} />
      <ParkBench position={[2, 0, -3]} rotation={[0, -Math.PI / 2, 0]} />

      <CoffeeBot botState={botState} />

      {/* Exit Sign at the start of the road (+Z) */}
      <Signboard position={[0, 0, 10]} text="Exit Park" />

      {/* Surrounding Trees */}
      {trees.map((t, i) => (
        <ParkTree key={i} position={t.pos} scale={t.scale} />
      ))}
    </group>
  )
}
