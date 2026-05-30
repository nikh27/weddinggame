import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CharacterModel from './CharacterModel'

export default function RemotePlayer({ data, emote, speaking, rings, isSitting, weddingStage }) {
  const meshRef = useRef()
  const targetPos = useRef(new THREE.Vector3(data.x, data.y, data.z))
  const targetRot = useRef(data.rotation || 0)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    targetPos.current.set(data.x, data.y, data.z)
    targetRot.current = data.rotation || 0
    meshRef.current.position.lerp(targetPos.current, 0.1)
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.current, 0.15)
  })

  return (
    <group ref={meshRef}>
      <CharacterModel
        character={data.character}
        animation={data.animation}
        emote={emote}
        name={data.character === 'panda' ? '🐼 Panda' : '🐧 Penguin'}
        speaking={speaking}
        rings={rings}
        isSitting={isSitting}
        weddingStage={weddingStage}
      />
    </group>
  )
}
