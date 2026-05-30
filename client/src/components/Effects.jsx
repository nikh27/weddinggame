import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Simple confetti / fireworks burst
export function Fireworks({ position }) {
  const count = 150
  const meshRef = useRef()

  const particles = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const vels = []
    const colors = new Float32Array(count * 3)
    const colorGen = new THREE.Color()

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = 0
      arr[i * 3 + 1] = 0
      arr[i * 3 + 2] = 0

      // Random spherical velocity
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos((Math.random() * 2) - 1)
      const speed = 2 + Math.random() * 4
      vels.push(new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.cos(phi) + 4, // slight upward bias
        speed * Math.sin(phi) * Math.sin(theta)
      ))

      // Pink / Purple / White colors
      const r = Math.random()
      if (r < 0.33) colorGen.set('#ff6b9d')
      else if (r < 0.66) colorGen.set('#c084fc')
      else colorGen.set('#ffffff')
      
      colors[i * 3 + 0] = colorGen.r
      colors[i * 3 + 1] = colorGen.g
      colors[i * 3 + 2] = colorGen.b
    }
    return { positions: arr, velocities: vels, colors }
  }, [count])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const v = particles.velocities[i]
      pos[i * 3 + 0] += v.x * delta
      pos[i * 3 + 1] += v.y * delta
      pos[i * 3 + 2] += v.z * delta
      v.y -= 9.8 * delta * 0.4 // gravity

      if (pos[i * 3 + 1] < -5) {
        // Respawn burst!
        pos[i * 3 + 0] = 0
        pos[i * 3 + 1] = 0
        pos[i * 3 + 2] = 0
        const theta = Math.random() * 2 * Math.PI
        const phi = Math.acos((Math.random() * 2) - 1)
        const speed = 2 + Math.random() * 5
        v.set(
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.cos(phi) + 5,
          speed * Math.sin(phi) * Math.sin(theta)
        )
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points position={position} ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.3} vertexColors transparent opacity={0.8} />
    </points>
  )
}

// Falling flowers / petals across the whole map
export function FlowerRain() {
  const count = 300
  const meshRef = useRef()

  const particles = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const phases = []
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 40
      arr[i * 3 + 1] = Math.random() * 20 + 10 // Start high up
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40
      phases.push(Math.random() * Math.PI * 2)
    }
    return { positions: arr, phases }
  }, [count])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= delta * 2.5 // fall speed
      pos[i * 3 + 0] += Math.sin(state.clock.elapsedTime * 2 + particles.phases[i]) * 0.05 // sway
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 20 + Math.random() * 10
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.4} color="#ffb7b2" transparent opacity={0.9} map={null} />
    </points>
  )
}
