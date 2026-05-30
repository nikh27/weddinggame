import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Create a stable heart shape geometry
const heartGeo = new THREE.ShapeGeometry(
  (() => {
    const x = 0, y = 0
    const heartShape = new THREE.Shape()
    heartShape.moveTo(x + 5, y + 5)
    heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y)
    heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7)
    heartShape.bezierCurveTo(x - 6, y + 11, x - 2, y + 15.4, x + 5, y + 19)
    heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7)
    heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y)
    heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5)
    return heartShape
  })()
)

// A single floating heart
function Heart({ startPos, delay }) {
  const ref = useRef()
  const lifeRef = useRef(0)

  useFrame((state, delta) => {
    if (!ref.current) return
    lifeRef.current += delta
    const t = lifeRef.current - delay
    
    if (t > 0) {
      ref.current.visible = true
      ref.current.position.y = startPos.y + t * 1.2 // float up
      // Geometry is drawn upside down and large, so we flip and scale it
      ref.current.scale.setScalar(Math.max(0, 1 - t * 0.5) * 0.025)
      if (t > 2) {
        lifeRef.current = 0 // reset cycle
      }
    } else {
      ref.current.visible = false
    }
  })

  return (
    <mesh ref={ref} position={startPos} rotation={[0, 0, Math.PI]} visible={false}>
      <primitive object={heartGeo} attach="geometry" />
      <meshStandardMaterial color="#ff3366" emissive="#ff3366" emissiveIntensity={0.8} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function ProximityHearts({ localPosRef, remotePlayer }) {
  const groupRef = useRef()

  // Use useFrame to check distance and toggle visibility directly
  useFrame(() => {
    if (!groupRef.current) return
    
    if (!localPosRef.current || !remotePlayer) {
      groupRef.current.visible = false
      return
    }

    const lx = localPosRef.current.x
    const lz = localPosRef.current.z
    const rx = remotePlayer.x
    const rz = remotePlayer.z
    const distSq = (lx - rx) ** 2 + (lz - rz) ** 2

    // Threshold: 1.5 units distance (2.25 squared) - slightly touching
    const close = distSq < 2.25
    groupRef.current.visible = close

    // Update midpoint
    if (close) {
      groupRef.current.position.set(
        (lx + rx) / 2,
        0,
        (lz + rz) / 2
      )
    }
  })

  return (
    <group ref={groupRef} visible={false}>
      <Heart startPos={new THREE.Vector3(0, 2.5, 0)} delay={0} />
      <Heart startPos={new THREE.Vector3(0, 2.5, 0)} delay={0.6} />
      <Heart startPos={new THREE.Vector3(0, 2.5, 0)} delay={1.2} />
    </group>
  )
}
