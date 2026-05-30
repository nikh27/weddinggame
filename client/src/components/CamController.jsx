import { useThree, useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

/**
 * Photo-mode camera: PAN + ZOOM
 *
 * ▲▼◄► arrows  → pan camera on screen plane
 * Single finger drag → same as arrows (pan)
 * Pinch two fingers  → zoom in / out
 * Scroll wheel       → zoom in / out
 */
export default function CamController({ joystickRef, active, targetRef }) {
  const { camera, gl } = useThree()

  const s = useRef({
    phi: 0.88, theta: 0,
    r: 18
  })

  // Single-finger drag tracking
  const drag  = useRef({ on: false, x: 0, y: 0 })
  // Two-finger pinch tracking
  const pinch = useRef({ on: false, dist: 0 })

  // ── Init when entering photo mode ──────────────────────────────────────
  useEffect(() => {
    if (!active) return
    const p = camera.position
    
    // If we have a target (the player), calculate relative rotation from them
    const target = targetRef?.current || new THREE.Vector3(0, 0, 0)
    const relX = p.x - target.x
    const relY = p.y - target.y
    const relZ = p.z - target.z
    
    const r = Math.max(4, Math.sqrt(relX*relX + relY*relY + relZ*relZ))
    const phi   = Math.acos(Math.max(-1, Math.min(1, relY / r)))
    const theta = Math.atan2(relX, relZ)

    s.current = { phi, theta, r }
    drag.current  = { on: false, x: 0, y: 0 }
    pinch.current = { on: false, dist: 0 }
  }, [active, camera, targetRef])

  // ── Input listeners ────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return
    const el = gl.domElement

    /* ---------- single finger drag -> ROTATE ---------- */
    const onPtrDown = (e) => {
      if (e.target !== el) return
      if (pinch.current.on) return
      el.setPointerCapture(e.pointerId)
      drag.current = { on: true, x: e.clientX, y: e.clientY, id: e.pointerId }
    }
    const onPtrMove = (e) => {
      if (!drag.current.on || drag.current.id !== e.pointerId) return
      if (pinch.current.on) { drag.current.on = false; return } 
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      // Rotate camera angle instead of pan
      s.current.theta -= dx * 0.005
      s.current.phi   = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, s.current.phi - dy * 0.005))
      drag.current.x = e.clientX
      drag.current.y = e.clientY
    }
    const onPtrUp = () => { drag.current.on = false }

    /* ---------- two-finger pinch zoom ---------- */
    const getTouchDist = (t) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onTouchStart = (e) => {
      if (e.touches.length >= 2) {
        drag.current.on = false            
        pinch.current = { on: true, dist: getTouchDist(e.touches) }
      }
    }
    const onTouchMove = (e) => {
      if (!pinch.current.on || e.touches.length < 2) return
      const newDist = getTouchDist(e.touches)
      const delta   = pinch.current.dist - newDist  
      s.current.r = Math.max(3, Math.min(40, s.current.r + delta * 0.05))
      pinch.current.dist = newDist
    }
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinch.current.on = false
    }

    /* ---------- scroll wheel zoom ---------- */
    const onWheel = (e) => {
      e.preventDefault()
      s.current.r = Math.max(3, Math.min(40, s.current.r + e.deltaY * 0.018))
    }

    el.addEventListener('pointerdown',   onPtrDown)
    el.addEventListener('pointermove',   onPtrMove)
    el.addEventListener('pointerup',     onPtrUp)
    el.addEventListener('pointercancel', onPtrUp)
    el.addEventListener('touchstart',    onTouchStart, { passive: true })
    el.addEventListener('touchmove',     onTouchMove,  { passive: true })
    el.addEventListener('touchend',      onTouchEnd,   { passive: true })
    el.addEventListener('wheel',         onWheel,      { passive: false })

    return () => {
      el.removeEventListener('pointerdown',   onPtrDown)
      el.removeEventListener('pointermove',   onPtrMove)
      el.removeEventListener('pointerup',     onPtrUp)
      el.removeEventListener('pointercancel', onPtrUp)
      el.removeEventListener('touchstart',    onTouchStart)
      el.removeEventListener('touchmove',     onTouchMove)
      el.removeEventListener('touchend',      onTouchEnd)
      el.removeEventListener('wheel',         onWheel)
    }
  }, [active, gl])

  // ── Per-frame camera update ────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!active) return
    const joy = joystickRef?.current ?? { x: 0, y: 0 }
    const c   = s.current
    const ROT_SPEED = 2

    // Arrow buttons / Joystick → rotate
    if (Math.abs(joy.x) > 0.04) c.theta -= joy.x * delta * ROT_SPEED
    if (Math.abs(joy.y) > 0.04) c.phi   = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, c.phi + joy.y * delta * ROT_SPEED))

    const { r, phi, theta } = c

    // Base camera position (spherical) relative to the target
    const target = targetRef?.current || { x: 0, y: 0, z: 0 }
    
    const bx = target.x + r * Math.sin(phi) * Math.sin(theta)
    const by = target.y + r * Math.cos(phi)
    const bz = target.z + r * Math.sin(phi) * Math.cos(theta)

    camera.position.set(bx, by, bz)
    camera.lookAt(target.x, target.y + 1.5, target.z)
  })

  return null
}
