import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Html, Sparkles } from '@react-three/drei'
import HousePujari from './HousePujari'

// A simple chair for family seating
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
      {/* Festive Ribbon */}
      <mesh position={[0, 0.8, -0.4]} castShadow>
        <boxGeometry args={[0.82, 0.2, 0.05]} />
        <meshStandardMaterial color="#ef4444" roughness={0.6} />
      </mesh>
    </group>
  )
}

// Simple Bot for Family
const FamilyBot = React.memo(function FamilyBot({ position, rotation, color, type, weddingStage }) {
  const groupRef = useRef()
  const armLRef = useRef()
  const armRRef = useRef()
  const headRef = useRef()
  
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])
  const speed = useMemo(() => 0.8 + Math.random() * 0.4, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime * speed + offset

    if (weddingStage >= 8) {
      // Grand Finale - Jumping and Cheering
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * 5)) * 0.5
      armLRef.current.rotation.x = -2.5 + Math.sin(t * 8) * 0.5
      armRRef.current.rotation.x = -2.5 + Math.cos(t * 8) * 0.5
      headRef.current.rotation.z = Math.sin(t * 4) * 0.3
    } else if (weddingStage >= 4 && weddingStage <= 5) {
      // Praying during Havan and Pheras
      groupRef.current.position.y = position[1]
      armLRef.current.rotation.x = -0.5
      armLRef.current.rotation.z = -0.3
      armRRef.current.rotation.x = -0.5
      armRRef.current.rotation.z = 0.3
      headRef.current.rotation.x = 0.2 // Bowing head slightly
    } else {
      // Idle sitting/watching
      groupRef.current.position.y = position[1]
      armLRef.current.rotation.x = 0
      armLRef.current.rotation.z = 0
      armRRef.current.rotation.x = 0
      armRRef.current.rotation.z = 0
      headRef.current.rotation.x = 0
      // Gentle bob
      headRef.current.rotation.z = Math.sin(t * 2) * 0.05
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
        </group>

        {/* Arms */}
        <group ref={armLRef} position={[-0.4, 0.9, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
        <group ref={armRRef} position={[0.4, 0.9, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  )
})

function Mandap({ position }) {
  return (
    <group position={position}>
      {/* Raised Platform */}
      <mesh receiveShadow castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[8, 0.4, 8]} />
        <meshStandardMaterial color="#fde047" roughness={0.6} metalness={0.2} /> {/* Gold-ish base */}
      </mesh>
      
      {/* 4 Pillars */}
      {[-3.5, 3.5].map((x) => 
        [-3.5, 3.5].map((z) => (
          <group key={`${x}-${z}`} position={[x, 2.4, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Flower wrap around pillar */}
            <mesh>
              <cylinderGeometry args={[0.18, 0.18, 4, 8]} />
              <meshStandardMaterial color="#f97316" wireframe opacity={0.8} transparent />
            </mesh>
          </group>
        ))
      )}

      {/* Canopy */}
      <mesh position={[0, 4.4, 0]} castShadow>
        <boxGeometry args={[7.4, 0.2, 7.4]} />
        <meshStandardMaterial color="#ef4444" roughness={0.9} />
      </mesh>
      {/* Canopy Trim */}
      <mesh position={[0, 4.3, 0]} castShadow>
        <boxGeometry args={[7.6, 0.4, 7.6]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Torans (Hanging Marigolds) */}
      {[[-3.5, 0], [3.5, 0], [0, -3.5], [0, 3.5]].map((pos, i) => {
        const isZ = pos[0] === 0;
        return (
          <group key={`toran-${i}`} position={[pos[0], 4.1, pos[1]]} rotation={[0, isZ ? Math.PI/2 : 0, 0]}>
            {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map(x => (
              <group key={x} position={[x, 0, 0]}>
                <mesh position={[0, 0, 0]}>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <meshStandardMaterial color="#f97316" roughness={0.9} />
                </mesh>
                <mesh position={[0, -0.3, 0]}>
                  <sphereGeometry args={[0.12, 8, 8]} />
                  <meshStandardMaterial color="#fcd34d" roughness={0.9} />
                </mesh>
                <mesh position={[0, -0.6, 0]}>
                  <coneGeometry args={[0.12, 0.3, 8]} />
                  <meshStandardMaterial color="#ef4444" roughness={0.9} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* Sacred Fire Pit (Havan Kund) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 0.2, 1.5]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      
      {/* Fire */}
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#fb923c" intensity={1.5} distance={10} />
      <Sparkles position={[0, 1, 0]} count={30} scale={1.5} size={4} speed={0.4} color="#fcd34d" />

      {/* Seating Aasans for Couple */}
      <mesh position={[-1.5, 0.45, 1.5]} castShadow rotation={[0, Math.PI/4, 0]}>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
      </mesh>
      <mesh position={[1.5, 0.45, 1.5]} castShadow rotation={[0, -Math.PI/4, 0]}>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.8} />
      </mesh>
    </group>
  )
}

export default function HouseMap({ globalState, bothInHouse, onWeddingAction, isPanda }) {
  const stage = globalState?.weddingStage || 0;
  const [lightsOn, setLightsOn] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownVal, setCountdownVal] = useState(3);

  // Trigger grand entry when both players enter
  useEffect(() => {
    if (bothInHouse && stage === 0 && !lightsOn && !showCountdown) {
      setShowCountdown(true);
    } else if (stage > 0) {
      setLightsOn(true); // Always on if past entry
    }
  }, [bothInHouse, stage, lightsOn, showCountdown]);

  useEffect(() => {
    if (showCountdown) {
      let count = 3;
      setCountdownVal(count);
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdownVal(count);
        } else {
          clearInterval(interval);
          setShowCountdown(false);
          setLightsOn(true);
          onWeddingAction(1); // Advance to stage 1 (Grand Entry)
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showCountdown]); // Removed onWeddingAction to prevent infinite reset

  // Generate Family Bots
  const bots = useMemo(() => {
    const arr = [];
    // Panda's Family (Left side)
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      arr.push({
        position: [-4 - col * 2, 0.4, 4 + row * 2],
        // Facing towards Mandap at [0, 0, -8]
        rotation: [0, Math.PI * 0.85, 0],
        color: ['#0369a1', '#0284c7', '#38bdf8'][Math.floor(Math.random() * 3)],
        type: 'family'
      });
    }
    // Penguin's Family (Right side)
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      arr.push({
        position: [4 + col * 2, 0.4, 4 + row * 2],
        // Facing towards Mandap at [0, 0, -8]
        rotation: [0, -Math.PI * 0.85, 0],
        color: ['#be123c', '#e11d48', '#fb7185'][Math.floor(Math.random() * 3)],
        type: 'family'
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* ── Lighting (Dynamic) ── */}
      <ambientLight intensity={lightsOn ? 1.5 : 0.05} color="#fff1f2" />
      
      {lightsOn && (
        <>
          <directionalLight position={[0, 15, 10]} intensity={1.8} color="#fde047" castShadow shadow-mapSize={[1024, 1024]} />
          {/* Key lights for the characters to make them pop */}
          <pointLight position={[0, 4, 0]} intensity={2.0} color="#ffffff" distance={15} />
          
          <pointLight position={[0, 8, -5]} intensity={2.0} color="#fef08a" distance={30} />
          <pointLight position={[-8, 4, 10]} intensity={1.2} color="#fbcfe8" distance={20} />
          <pointLight position={[8, 4, 10]} intensity={1.2} color="#fbcfe8" distance={20} />
          
          {/* Fairy Lights along walls */}
          {[-14.5, 14.5].map(x => (
            <group key={`fairy-${x}`}>
              {[-10, -5, 0, 5, 10].map(z => (
                <pointLight key={z} position={[x, 8, z]} intensity={0.5} color="#fbbf24" distance={5} />
              ))}
            </group>
          ))}
        </>
      )}

      {/* ── Room Geometry ── */}
      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 40]} />
        <meshStandardMaterial color={lightsOn ? "#fef3c7" : "#1e1b4b"} roughness={0.8} />
      </mesh>
      
      {/* Back Wall */}
      <mesh receiveShadow position={[0, 6, -15]}>
        <boxGeometry args={[30, 12, 0.5]} />
        <meshStandardMaterial color={lightsOn ? "#991b1b" : "#1e1b4b"} roughness={0.9} />
      </mesh>
      {/* Left Wall */}
      <mesh receiveShadow position={[-15, 6, 5]}>
        <boxGeometry args={[0.5, 12, 40]} />
        <meshStandardMaterial color={lightsOn ? "#b91c1c" : "#1e1b4b"} roughness={0.9} />
      </mesh>
      {/* Right Wall */}
      <mesh receiveShadow position={[15, 6, 5]}>
        <boxGeometry args={[0.5, 12, 40]} />
        <meshStandardMaterial color={lightsOn ? "#b91c1c" : "#1e1b4b"} roughness={0.9} />
      </mesh>

      {/* Entrance Archway (Z=18) */}
      <mesh castShadow position={[0, 5, 19]}>
        <boxGeometry args={[10, 10, 1]} />
        <meshStandardMaterial color={lightsOn ? "#fbbf24" : "#1e1b4b"} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Arch Cutout - Using a simple approach for now, just two pillars and a header */}
      <mesh castShadow position={[-4.5, 4, 19]}>
        <boxGeometry args={[1, 8, 1.2]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh castShadow position={[4.5, 4, 19]}>
        <boxGeometry args={[1, 8, 1.2]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh castShadow position={[0, 8.5, 19]}>
        <boxGeometry args={[10, 1, 1.2]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>

      {/* Exit Text on Archway */}
      <Text position={[0, 7.5, 18.4]} rotation={[0, Math.PI, 0]} fontSize={1.2} color="#fbbf24" outlineWidth={0.05} outlineColor="#991b1b" fontWeight="bold">
        EXIT
      </Text>

      {/* ── Ceremony Elements ── */}
      <Mandap position={[0, 0, -8]} />

      {/* Seating and Bots */}
      {bots.map((bot, i) => (
        <group key={i}>
          <Chair position={bot.position} rotation={bot.rotation} />
          <FamilyBot {...bot} weddingStage={stage} />
        </group>
      ))}

      {/* AI Pujari */}
      <HousePujari
        position={[0, 0.4, -10.5]}
        rotation={[0, 0, 0]}
        weddingStage={stage}
        isPanda={isPanda}
        onAction={() => {
          const stageMap = { 2: 3, 3: 4, 4: 5, 5: 6, 7: 8, 8: 9, 9: 10 }
          const next = stageMap[stage]
          if (next) onWeddingAction(next)
        }}
      />

      {/* ── UI Elements ── */}
      {showCountdown && (
        <Html center position={[0, 4, 5]}>
          <div style={{ color: 'white', fontSize: '100px', fontWeight: 'bold', textShadow: '0 0 20px #fbbf24' }}>
            {countdownVal}
          </div>
        </Html>
      )}

      {!bothInHouse && stage === 0 && (
        <Html center position={[0, 4, 5]}>
          <div style={{ color: '#fef08a', fontSize: '24px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '10px' }}>
            Waiting for partner...
          </div>
        </Html>
      )}
    </group>
  )
}
