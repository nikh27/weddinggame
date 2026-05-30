import React, { useMemo, useRef } from 'react'
import { useFrame, createPortal } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { buildPanda, buildPenguin, animateCharacter } from './characterBuilder'

const COLORS = {
  panda:   { accent: '#a99cff' }, // from charter_look_moment.html var(--panda)
  penguin: { accent: '#ffb14a' }, // from var(--pengu)
}

export default function CharacterModel({ character, animRef, animation, emote, name, speaking, rings = 0, isSitting, weddingStage = 0 }) {
  const colors = COLORS[character] || { accent: '#ffffff' }
  const groupRef = useRef()

  // Build the underlying Three.js Group only once per character type
  const model = useMemo(() => {
    const root = character === 'panda' ? buildPanda() : buildPenguin()
    return root
  }, [character])

  useFrame((state, delta) => {
    if (!model) return

    // Read animation from ref (local player) or prop (remote player)
    const anim = animRef?.current ?? animation ?? 'idle'
    const targetAmt = anim === 'walk' ? 1 : 0
    
    // Smoothly interpolate between idle (0) and walk (1)
    model.userData.moveAmt += (targetAmt - model.userData.moveAmt) * Math.min(1, delta * 12)
    
    // Animate bones/limbs/breathing based on moveAmt and time
    animateCharacter(model, delta, state.clock.elapsedTime)
  })

  // Scale factor to make characters fit perfectly with trees/benches
  const SCALE = 0.55

  // Dynamic heights for UI overlays, adjusted by scale
  const uiHeight = (model.userData.height * SCALE) + 0.5
  const emoteHeight = uiHeight + 0.8

  const ringPortals = useMemo(() => {
    if (rings === 0 || !model.userData.rightArm) return null;
    
    const portals = [];
    
    // First ring (Right hand)
    const pos1 = character === 'panda' ? [0, -1.0, 0.2] : [0, -0.6, 0.3];
    portals.push(
      createPortal(
        <group key="ring1" position={pos1} scale={SCALE * 1.5} rotation={[Math.PI / 4, 0, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.12, 0.04, 16, 32]} />
            <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.1} />
          </mesh>
          <mesh castShadow position={[0, 0.15, 0]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#0284c7" emissiveIntensity={1.5} metalness={0.9} roughness={0.1} transparent opacity={0.9} />
          </mesh>
        </group>,
        model.userData.rightArm
      )
    )

    // Second ring (Left hand - only Penguin gets this)
    if (rings > 1 && character === 'penguin' && model.userData.swingArm && model.userData.swingArm[0]) {
      const leftArm = model.userData.swingArm[0]; // wingL
      const pos2 = [0, -0.6, 0.3]; // Same relative pos for left wing
      portals.push(
        createPortal(
          <group key="ring2" position={pos2} scale={SCALE * 1.5} rotation={[Math.PI / 4, 0, 0]}>
            <mesh castShadow>
              <torusGeometry args={[0.12, 0.04, 16, 32]} />
              <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.1} />
            </mesh>
            <mesh castShadow position={[0, 0.15, 0]}>
              <octahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={1.5} metalness={0.9} roughness={0.1} transparent opacity={0.9} />
            </mesh>
          </group>,
          leftArm
        )
      )
    }

    return portals;
  }, [rings, model, character, SCALE])

  const weddingPortals = useMemo(() => {
    if (weddingStage < 2) return null;
    const portals = [];

    // 1. Garland (Jai Mala)
    // Penguin gets it at stage 3 (after Panda gives it at stage 2)
    // Panda gets it at stage 4 (after Penguin gives it at stage 3)
    const hasGarland = (character === 'penguin' && weddingStage >= 3) || (character === 'panda' && weddingStage >= 4);
    
    if (hasGarland) {
      // Tall oval standing up, tilted back to rest over shoulders and stomach
      const neckPos = character === 'panda' ? [0, 2.5, 0.45] : [0, 1.9, 0.35];
      const garlandColor = character === 'panda' ? '#f97316' : '#ef4444'; 
      const radius = character === 'panda' ? 0.7 : 0.55;
      const thickness = character === 'panda' ? 0.12 : 0.1;
      
      portals.push(
        <mesh key="garland" position={neckPos} rotation={[-0.6, 0, 0]} scale={[1, 1.6, 1]}>
          <torusGeometry args={[radius, thickness, 16, 32]} />
          {/* Striped/textured look for flowers */}
          <meshStandardMaterial color={garlandColor} roughness={0.9} wireframe={false} />
          {/* Outer yellow flower layer */}
          <mesh>
            <torusGeometry args={[radius, thickness + 0.02, 8, 24]} />
            <meshStandardMaterial color="#fcd34d" roughness={1} wireframe={true} />
          </mesh>
        </mesh>
      );
    }

    // 2. Sindoor (Penguin only) - Stage 8+
    if (weddingStage >= 8 && character === 'penguin' && model.userData.head) {
      portals.push(
        createPortal(
          <mesh key="sindoor" position={[0, 0.79, 0.43]} rotation={[-0.8, 0, 0]}>
            <boxGeometry args={[0.06, 0.35, 0.05]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>,
          model.userData.head
        )
      );
    }

    // 3. Mangalsutra (Penguin only) - Stage 9+
    if (weddingStage >= 9 && character === 'penguin') {
      portals.push(
        <group key="mangalsutra" position={[0, 2.0, 0.55]} rotation={[-0.7, 0, 0]} scale={[1, 1.05, 1]}>
          {/* Chain (Pure Gold) */}
          <mesh>
            <torusGeometry args={[0.6, 0.03, 16, 48]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.5} metalness={1.0} roughness={0.1} />
          </mesh>
          {/* Gold Pendant at the bottom of the chain */}
          <mesh position={[0, -0.55, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.8} metalness={1.0} roughness={0.1} />
          </mesh>
          <mesh position={[-0.08, -0.53, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.8} metalness={1.0} roughness={0.1} />
          </mesh>
          <mesh position={[0.08, -0.53, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.8} metalness={1.0} roughness={0.1} />
          </mesh>
        </group>
      );
    }

    return portals;
  }, [weddingStage, character, model]);

  return (
    <group ref={groupRef} position={[0, isSitting ? -0.3 : 0, 0]}>
      {/* The 3D Character geometry scaled down */}
      <primitive object={model} scale={SCALE} />
      
      {/* The Diamond Ring(s) (attached to hand) */}
      {ringPortals}

      {/* Wedding Ornaments (scaled to match character) */}
      <group scale={SCALE}>
        {weddingPortals}
      </group>

      {/* ── NAME TAG + SPEAKING INDICATOR ── */}
      <Html position={[0, uiHeight, 0]} center>
        <div style={{
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          transform: 'translateX(-50%) translateY(-50%)',
          whiteSpace: 'nowrap',
        }}>
          {/* Speaking waves */}
          {speaking && (
            <div style={{
              display: 'flex', gap: '3px', alignItems: 'flex-end',
              height: '18px', marginBottom: '2px',
            }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: '3px',
                  background: colors.accent,
                  borderRadius: '3px',
                  animation: `speakBar 0.6s ease-in-out ${i*0.12}s infinite alternate`,
                  minHeight: '4px',
                }} />
              ))}
            </div>
          )}
          {/* Name */}
          <div style={{
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            padding: '3px 11px',
            borderRadius: '20px',
            border: `1.5px solid ${speaking ? colors.accent : 'rgba(255,255,255,0.12)'}`,
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 800,
            fontSize: '13px',
            color: '#fff',
            boxShadow: speaking ? `0 0 10px ${colors.accent}55` : 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}>
            {name}
          </div>
        </div>
        <style>{`
          @keyframes speakBar {
            from { height: 4px; }
            to   { height: 16px; }
          }
        `}</style>
      </Html>

      {/* Emote */}
      {emote && (
        <Html position={[0, emoteHeight, 0]} center>
          <div style={{
            fontSize: '32px',
            animation: 'emoteFloat 2.5s ease-out forwards',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {emote}
          </div>
          <style>{`
            @keyframes emoteFloat {
              0%   { transform: scale(0) translateY(0); opacity: 0; }
              15%  { transform: scale(1.3) translateY(-6px); opacity: 1; }
              80%  { transform: scale(1) translateY(-18px); opacity: 1; }
              100% { transform: scale(0.8) translateY(-50px); opacity: 0; }
            }
          `}</style>
        </Html>
      )}

      {/* Ground glow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI/2,0,0]}>
        <circleGeometry args={[0.85, 24]} />
        <meshStandardMaterial color={colors.accent} transparent opacity={0.15} emissive={colors.accent} emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}
