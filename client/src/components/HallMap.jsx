import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Html, Stars, Sparkles } from '@react-three/drei'

// A simple boxy bot representing family/friends
const Bot = React.memo(function Bot({ position, rotation, type, color, messages, engagementStatus }) {
  const groupRef = useRef()
  const armLRef = useRef()
  const armRRef = useRef()
  const headRef = useRef()
  
  const [chat, setChat] = useState(null)
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])
  const speed = useMemo(() => 0.8 + Math.random() * 0.4, [])

  const isCelebrating = engagementStatus === 'done'

  // Random chatter logic
  useEffect(() => {
    if (isCelebrating) {
      setChat(messages[Math.floor(Math.random() * messages.length)])
      const t = setTimeout(() => setChat(null), 8000)
      return () => clearTimeout(t)
    }

    if (!messages || messages.length === 0) return
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance to say something
        setChat(messages[Math.floor(Math.random() * messages.length)])
        setTimeout(() => setChat(null), 4000)
      }
    }, 5000 + Math.random() * 5000)
    return () => clearInterval(interval)
  }, [messages, isCelebrating])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime * speed + offset

    // Bobbing motion for all
    groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * 2)) * 0.1

    if (isCelebrating) {
      // Overridden Celebration Animation!
      groupRef.current.position.y += Math.abs(Math.sin(t * 5)) * 0.5 // High jumping
      armLRef.current.rotation.x = -2.5 + Math.sin(t * 8) * 0.5
      armRRef.current.rotation.x = -2.5 + Math.cos(t * 8) * 0.5
      headRef.current.rotation.z = Math.sin(t * 4) * 0.3
      // Face the stage if not already
      if (type !== 'cheer') {
        const targetRot = Math.atan2(0 - position[0], -8 - position[2])
        groupRef.current.rotation.y = targetRot - rotation[1]
      }
      return;
    }

    if (type === 'dance') {
      groupRef.current.position.y += Math.abs(Math.sin(t * 4)) * 0.4 // Jumping
      groupRef.current.rotation.y = rotation[1] + Math.sin(t) * 0.5
      armLRef.current.rotation.x = Math.sin(t * 4) * 0.5 - 2
      armRRef.current.rotation.x = Math.cos(t * 4) * 0.5 - 2
      headRef.current.rotation.z = Math.sin(t * 3) * 0.2
    } else if (type === 'eat') {
      // One hand moving to mouth
      armRRef.current.rotation.x = Math.abs(Math.sin(t * 2)) * -2
      armLRef.current.rotation.x = -0.2
      headRef.current.rotation.x = Math.sin(t * 2) * 0.2
    } else if (type === 'cheer') {
      // Gentle waving and focus
      armLRef.current.rotation.x = -1.5 + Math.sin(t * 3) * 0.2
      armRRef.current.rotation.x = -1.5 + Math.cos(t * 3) * 0.2
      headRef.current.rotation.y = Math.sin(t) * 0.2 // Small head movement
    }
  })

  return (
    <group position={position} rotation={rotation}>
      <group ref={groupRef}>
        {/* Body */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.6, 0.8, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        
        {/* Head */}
        <group ref={headRef} position={[0, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.5} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.12, 0.05, 0.26]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="black" />
          </mesh>
          <mesh position={[0.12, 0.05, 0.26]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="black" />
          </mesh>
          {/* Mouth */}
          <mesh position={[0, -0.1, 0.26]}>
            <boxGeometry args={[0.15, 0.04, 0.02]} />
            <meshStandardMaterial color="black" />
          </mesh>
        </group>

        {/* Arms */}
        <group ref={armLRef} position={[-0.4, 0.9, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.15, 0.6, 0.15]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.5} />
          </mesh>
        </group>
        <group ref={armRRef} position={[0.4, 0.9, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.15, 0.6, 0.15]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.5} />
          </mesh>
        </group>

        {/* Legs */}
        <mesh position={[-0.15, 0.15, 0]} castShadow>
          <boxGeometry args={[0.18, 0.3, 0.18]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.15, 0.15, 0]} castShadow>
          <boxGeometry args={[0.18, 0.3, 0.18]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        {/* Chat Bubble */}
        {chat && (
          <Html position={[0, 1.8, 0]} center zIndexRange={[100, 0]}>
            <div style={{
              background: 'white',
              padding: '6px 10px',
              borderRadius: '12px',
              border: '2px solid #ccc',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#333',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap',
              animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              {chat}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
})

function DanceFloor({ position }) {
  const ref = useRef()
  const matRef = useRef()

  useFrame((state) => {
    if (matRef.current) {
      // Dynamic color shifting for the dance floor
      const t = state.clock.elapsedTime
      matRef.current.color.setHSL((t * 0.2) % 1, 0.8, 0.5)
      matRef.current.emissive.setHSL((t * 0.2) % 1, 0.8, 0.3)
    }
  })

  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[10, 0.1, 8]} />
        <meshStandardMaterial ref={matRef} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Grid lines */}
      <gridHelper args={[10, 10, 0xffffff, 0xffffff]} position={[0, 0.11, 0]} />
    </group>
  )
}

function FoodTable({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Table */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[4, 1.2, 1.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      
      {/* Food items */}
      <mesh castShadow position={[-1, 1.3, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#ff7eb3" roughness={0.4} /> {/* Cake */}
      </mesh>
      <mesh castShadow position={[0, 1.3, -0.2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.15, 16]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.6} /> {/* Pie */}
      </mesh>
      <mesh castShadow position={[1.2, 1.4, 0.2]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#7dd3fc" metalness={0.2} roughness={0.1} transparent opacity={0.8} /> {/* Drink */}
      </mesh>
      <mesh castShadow position={[1.5, 1.35, -0.1]}>
        <boxGeometry args={[0.2, 0.3, 0.2]} />
        <meshStandardMaterial color="#fde047" metalness={0.2} roughness={0.1} transparent opacity={0.8} /> {/* Drink */}
      </mesh>
    </group>
  )
}

// Simple Chair for Audience
function Chair({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
      </mesh>
      {/* Legs */}
      {[-0.3, 0.3].map((x) => 
        [-0.3, 0.3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.2, z]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.1]} />
            <meshStandardMaterial color="#5c3a21" />
          </mesh>
        ))
      )}
      {/* Backrest */}
      <mesh position={[0, 0.8, -0.35]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
      </mesh>
    </group>
  )
}

// Stylized Royal Throne
function Throne({ position, rotation = [0, 0, 0], color = "#b91c1c" }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.2, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.3, 0.1, 1.3]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Backrest */}
      <mesh position={[0, 1.4, -0.5]} castShadow>
        <boxGeometry args={[1.2, 2, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Gold Trim */}
      <mesh position={[0, 1.4, -0.6]} castShadow>
        <boxGeometry args={[1.4, 2.2, 0.1]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.5, -0.55]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.2, 16]} rotation={[Math.PI/2, 0, 0]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Armrests */}
      <mesh position={[-0.65, 0.8, 0]} castShadow>
        <boxGeometry args={[0.2, 0.8, 1.2]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.65, 0.8, 0]} castShadow>
        <boxGeometry args={[0.2, 0.8, 1.2]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  )
}

function BambooScreen({ position, rotation = [0, 0, 0] }) {
  const poles = [];
  for (let i = 0; i < 20; i++) {
    poles.push(
      <mesh key={i} position={[(i - 10) * 0.4, 3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
        <meshStandardMaterial color="#b4a070" roughness={0.9} />
      </mesh>
    );
  }
  return (
    <group position={position} rotation={rotation}>
      {poles}
      {/* Horizontal binders */}
      <mesh position={[0, 1.5, 0.1]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 8, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6b5b3d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.5, 0.1]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 8, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6b5b3d" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Stage({ position }) {
  return (
    <group position={position}>
      {/* Red Carpet leading to stage */}
      <mesh receiveShadow position={[0, 0.02, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 12]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.8} />
      </mesh>
      {/* Gold border for carpet */}
      <mesh receiveShadow position={[0, 0.03, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.4, 12.2]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Royal Stage Base (Flush with ground, 0.4m height) */}
      <mesh receiveShadow castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[6, 6, 0.4, 32]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.8} />
      </mesh>
      {/* Gold Trim for Stage */}
      <mesh receiveShadow castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[6.2, 6.2, 0.2, 32]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Small stairs front */}
      <mesh receiveShadow position={[0, 0.1, 5]}>
        <boxGeometry args={[3, 0.2, 1.5]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.8} />
      </mesh>

      {/* Stage Ring Glow */}
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5, 5.3, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} side={THREE.DoubleSide} />
      </mesh>

      {/* Royal Archway */}
      <mesh castShadow position={[0, 3.5, -3]}>
        <torusGeometry args={[4, 0.3, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Archway Flowers */}
      {[-3.5, -1.5, 1.5, 3.5].map((x, i) => (
        <mesh key={i} position={[x, 3.5 + Math.abs(x)*0.2, -3]} scale={0.7}>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#fda4af" roughness={0.6} emissive="#fda4af" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Thrones */}
      <Throne position={[-2, 0.4, -1]} rotation={[0, Math.PI/6, 0]} color="#1e3a8a" />
      <Throne position={[2, 0.4, -1]} rotation={[0, -Math.PI/6, 0]} color="#b91c1c" />
    </group>
  )
}

// DJ Lights that rotate
function DJLights() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 1.5
    }
  })
  
  return (
    <group position={[-12, 5, -8]} ref={ref}>
      <spotLight position={[0,0,0]} angle={0.3} penumbra={0.5} color="#ff00ff" intensity={3} castShadow distance={30} />
      <spotLight position={[0,0,0]} angle={0.3} penumbra={0.5} color="#00ffff" intensity={3} rotation={[0, Math.PI/2, 0]} distance={30} />
      <spotLight position={[0,0,0]} angle={0.3} penumbra={0.5} color="#ffff00" intensity={3} rotation={[0, Math.PI, 0]} distance={30} />
    </group>
  )
}

// The Signboard back to MDU
function HallSignboard({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.5, 0.05]} castShadow>
        <boxGeometry args={[2, 0.8, 0.1]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      <Text position={[0, 2.5, 0.12]} fontSize={0.3} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black" fontWeight="bold">
        Exit Hall
      </Text>
    </group>
  )
}

export default function HallMap({ globalState }) {
  const botColors = ['#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#fb923c']
  const cheerMsgs = ["Congratulations!", "So cute!", "Finally!", "Woohoo!", "Beautiful!"]
  const eatMsgs = ["This cake is good", "Yum!", "I love food", "Cheers!"]
  const danceMsgs = ["Nice moves!", "Drop the beat!", "Party time!"]

  const bots = useMemo(() => {
    const arr = []
    // Dance floor bots (left side X: -14 to -6, Z: -2 to 6)
    for (let i = 0; i < 6; i++) {
      arr.push({
        position: [-10 + (Math.random() - 0.5) * 8, 0, 2 + (Math.random() - 0.5) * 6],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        type: 'dance',
        color: botColors[Math.floor(Math.random() * botColors.length)],
        messages: danceMsgs
      })
    }
    
    // Food area bots (right side X: 6 to 14, Z: -2 to 6)
    for (let i = 0; i < 5; i++) {
      arr.push({
        position: [10 + (Math.random() - 0.5) * 6, 0, 2 + (Math.random() - 0.5) * 6],
        rotation: [0, (Math.random() - 0.5) * Math.PI, 0], // Mostly facing food
        type: 'eat',
        color: botColors[Math.floor(Math.random() * botColors.length)],
        messages: eatMsgs
      })
    }
    
    // Stage cheer bots (around stage X: -5 to 5, Z: -2 to 2)
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI
      const radius = 6 + Math.random() * 2
      const x = Math.cos(angle) * radius
      const z = -4 + Math.sin(angle) * radius
      
      // Face the stage exactly (stage is at 0, 0, -8)
      const targetX = 0
      const targetZ = -8
      const rotY = Math.atan2(targetX - x, targetZ - z) // Correct rotation towards target
      
      arr.push({
        position: [x, 0, z],
        rotation: [0, rotY, 0],
        type: 'cheer',
        color: botColors[Math.floor(Math.random() * botColors.length)],
        messages: cheerMsgs
      })
    }
    return arr
  }, [])

  return (
    <group>
      {/* Glamorous Hall Lighting & Environment */}
      <ambientLight intensity={0.5} color="#fef3c7" />
      <directionalLight position={[0, 20, 10]} intensity={1.2} color="#fde047" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 8, -6]} intensity={2} color="#fef08a" distance={30} /> {/* Stage light */}
      <DJLights />

      {/* Night Sky Details */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={200} scale={30} size={4} speed={0.4} opacity={0.3} color="#fef08a" />

      {/* Massive Marble Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Decorative Boundaries */}
      <BambooScreen position={[-20, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <BambooScreen position={[20, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <BambooScreen position={[0, 0, -20]} rotation={[0, 0, 0]} />
      <BambooScreen position={[-10, 0, -20]} rotation={[0, 0, 0]} />
      <BambooScreen position={[10, 0, -20]} rotation={[0, 0, 0]} />
      
      <BambooScreen position={[-10, 0, 20]} rotation={[0, Math.PI, 0]} />
      <BambooScreen position={[10, 0, 20]} rotation={[0, Math.PI, 0]} />

      {/* Far Background Mountains */}
      {[-30, 0, 30].map((x, i) => (
        <mesh key={i} position={[x, 0, -40]} receiveShadow>
          <coneGeometry args={[15 + Math.random() * 10, 20 + Math.random() * 15, 4]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
      ))}

      {/* Dance Floor */}
      <DanceFloor position={[-10, 0, 2]} />
      
      {/* Food Area */}
      <FoodTable position={[10, 0, 0]} rotation={[0, -Math.PI/6, 0]} />
      <FoodTable position={[14, 0, 4]} rotation={[0, Math.PI/6, 0]} />

      {/* Chairs around the stage */}
      <Chair position={[-4, 0, -2]} rotation={[0, Math.PI/4, 0]} />
      <Chair position={[4, 0, -2]} rotation={[0, -Math.PI/4, 0]} />
      <Chair position={[-5, 0, -4]} rotation={[0, Math.PI/3, 0]} />
      <Chair position={[5, 0, -4]} rotation={[0, -Math.PI/3, 0]} />

      {/* The Main Stage */}
      <Stage position={[0, 0, -8]} />

      {/* Bots */}
      {bots.map((bot, i) => (
        <Bot key={i} {...bot} engagementStatus={globalState?.engagementStatus} />
      ))}

      {/* Exit Signboard */}
      <HallSignboard position={[0, 0, 16]} rotation={[0, Math.PI, 0]} />

    </group>
  )
}
