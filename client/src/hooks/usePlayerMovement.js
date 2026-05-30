import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const SPEED = 2.8
const BOUNDARY_MIN_X = -6
const BOUNDARY_MAX_X = 40
const BOUNDARY_MIN_Z = -10
const BOUNDARY_MAX_Z = 10
const SEND_RATE = 50 // ms

export function usePlayerMovement(socket, character, joystickRef, frozen = false, externalPosRef = null, isSitting = false, weddingStage = 0) {
  // Spawn panda slightly left, penguin further right
  const internalPosRef = useRef(new THREE.Vector3(character === 'panda' ? -4 : 8, 0, 0))
  const posRef = externalPosRef || internalPosRef
  
  if (posRef.current === null) {
    posRef.current = new THREE.Vector3(character === 'panda' ? -4 : 8, 0, 0)
  }

  const rotRef = useRef(character === 'panda' ? 0.4 : -0.4)
  const animRef = useRef('idle')
  const keysRef = useRef({ w: false, a: false, s: false, d: false })
  const meshRef = useRef()
  const lastSendRef = useRef(0)

  const handleKeyDown = useCallback((e) => {
    const k = e.key.toLowerCase()
    if (k in keysRef.current) keysRef.current[k] = true
  }, [])

  const handleKeyUp = useCallback((e) => {
    const k = e.key.toLowerCase()
    if (k in keysRef.current) keysRef.current[k] = false
  }, [])

  const { camera } = useThree()

  useFrame((_, delta) => {
    if (!meshRef.current) return
    if (frozen) { animRef.current = 'idle'; return } // frozen in camera mode

    const k = keysRef.current
    const joy = joystickRef?.current ?? { x: 0, y: 0 }

    // Screen-space input (un-inverted standard)
    let ix = 0, iz = 0
    if (k.a) ix -= 1
    if (k.d) ix += 1
    if (k.w) iz -= 1
    if (k.s) iz += 1
    if (Math.abs(joy.x) > 0.1) ix += joy.x
    if (Math.abs(joy.y) > 0.1) iz += joy.y

    const moving = ix !== 0 || iz !== 0

    if (isSitting) {
      animRef.current = 'idle'
      // Face the table when sitting (left bench X=-2 faces +X (rot=Math.PI/2), right bench X=2 faces -X (rot=-Math.PI/2))
      if (posRef.current.x < 0) {
        rotRef.current = Math.PI / 2
      } else {
        rotRef.current = -Math.PI / 2
      }
      meshRef.current.position.copy(posRef.current)
      meshRef.current.rotation.y = rotRef.current

      // If user tries to move while sitting, stand up
      if (moving && socket) {
        // Prevent spamming
        if (Date.now() - lastSendRef.current > 500) {
          socket.emit('action', { type: 'stand' })
          lastSendRef.current = Date.now()
        }
      }
      return
    }

    let mx = 0, mz = 0
    if (moving) {
      // Calculate camera-relative forward and right vectors
      const camFwd = new THREE.Vector3()
      camera.getWorldDirection(camFwd)
      camFwd.y = 0
      if (camFwd.lengthSq() < 0.001) camFwd.set(0, 0, -1)
      else camFwd.normalize()
      
      const camRight = new THREE.Vector3(-camFwd.z, 0, camFwd.x)

      // Map screen input to world movement
      mx = camFwd.x * (-iz) + camRight.x * ix
      mz = camFwd.z * (-iz) + camRight.z * ix

      const len = Math.sqrt(mx * mx + mz * mz)
      if (len > 0.001) {
        mx /= len; mz /= len
      }

      const targetRot = Math.atan2(mx, mz)
      let diff = targetRot - rotRef.current
      while (diff > Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      rotRef.current += diff * Math.min(1, 12 * delta)
      
      let bMinX = -6, bMaxX = 40, bMinZ = -10, bMaxZ = 10;
      if (window.gamePhase === 'house' || window.location.href.includes('house')) {
        bMinX = -14.5; bMaxX = 14.5; bMinZ = -14.5; bMaxZ = 18.5; // House walls are at X=+-15, Z=-15, Z=19
      } else if (window.gamePhase === 'hall' || window.location.href.includes('hall')) {
        bMinX = -14.5; bMaxX = 14.5; bMinZ = -14.5; bMaxZ = 14.5; // Hall walls
      } else if (window.gamePhase === 'park' || window.location.href.includes('park')) {
        bMinX = -14.5; bMaxX = 14.5; bMinZ = -14.5; bMaxZ = 14.5; // Park boundaries
      }

      posRef.current.x = Math.max(bMinX, Math.min(bMaxX, posRef.current.x + mx * SPEED * delta))
      posRef.current.z = Math.max(bMinZ, Math.min(bMaxZ, posRef.current.z + mz * SPEED * delta))
      animRef.current = 'walk'
    } else {
      animRef.current = 'idle'
    }

    // Dynamic height mapping to prevent clipping into ground/platforms
    let targetY = 0;
    if (isSitting) {
      targetY = 0.45; // Height for benches/chairs
    } else if (window.location.href.includes('house') || (window.gamePhase === 'house')) {
      // Mandap platform: X between -4 and 4, Z between -12 and -4
      if (posRef.current.x > -4 && posRef.current.x < 4 && posRef.current.z < -4 && posRef.current.z > -12) {
        targetY = 0.4;
      }
    } else if (window.location.href.includes('hall') || (window.gamePhase === 'hall')) {
      // Hall stage: X between -5 and 5, Z between -12 and -4
      if (posRef.current.x > -5 && posRef.current.x < 5 && posRef.current.z < -4 && posRef.current.z > -12) {
        targetY = 0.4;
      }
    }
    
    // Smoothly step up/down
    posRef.current.y = THREE.MathUtils.lerp(posRef.current.y, targetY, 15 * delta);

    meshRef.current.position.copy(posRef.current)
    meshRef.current.rotation.y = rotRef.current

    const now = Date.now()
    if (now - lastSendRef.current > SEND_RATE && socket) {
      lastSendRef.current = now
      socket.emit('move', {
        x: posRef.current.x, y: posRef.current.y, z: posRef.current.z,
        rotation: rotRef.current, animation: animRef.current,
      })
    }
  })

  return { meshRef, posRef, animRef, handleKeyDown, handleKeyUp }
}
