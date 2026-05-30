import { useThree, useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

const _target = new THREE.Vector3()
const _look   = new THREE.Vector3()

/**
 * Follow camera with free orbit + zoom.
 * - Single finger drag on canvas  → rotate camera around player
 * - Two finger pinch               → zoom in / out
 * - Scroll wheel (desktop)         → zoom in / out
 */
export default function FollowCamera({ playerRef }) {
  const { camera, gl } = useThree()

  // Spherical coords: theta=horizontal angle, phi=vertical angle, r=distance
  // Initial radius is set to 10 for a much closer look at start
  const cam = useRef({ theta: 0, phi: 0.88, r: 10 })

  // Pointer tracking (handles both single-drag and pinch)
  const ptrs = useRef(new Map())   // pointerId → {x, y}

  useEffect(() => {
    const el = gl.domElement

    // ── Pointer down: only from canvas itself ───────────────────────────
    const onDown = (e) => {
      if (e.target !== el) return   // ignore UI overlays
      el.setPointerCapture(e.pointerId)
      ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    // ── Pointer move ───────────────────────────────────────────────────
    const onMove = (e) => {
      if (!ptrs.current.has(e.pointerId)) return
      const prev = ptrs.current.get(e.pointerId)

      if (ptrs.current.size === 1) {
        // Single finger → orbit (horizontal = yaw, vertical = pitch)
        const dx = e.clientX - prev.x
        const dy = e.clientY - prev.y
        cam.current.theta -= dx * 0.007
        cam.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, cam.current.phi - dy * 0.005))
      } else if (ptrs.current.size === 2) {
        // Two fingers → pinch zoom
        const ids = [...ptrs.current.keys()]
        const otherId = ids.find(id => id !== e.pointerId)
        const other = ptrs.current.get(otherId)
        const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y)
        const newDist  = Math.hypot(e.clientX - other.x, e.clientY - other.y)
        cam.current.r = Math.max(5, Math.min(30, cam.current.r + (prevDist - newDist) * 0.05))
      }

      ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    const onUp = (e) => {
      ptrs.current.delete(e.pointerId)
    }

    // ── Scroll wheel zoom (desktop) ────────────────────────────────────
    const onWheel = (e) => {
      e.preventDefault()
      cam.current.r = Math.max(5, Math.min(30, cam.current.r + e.deltaY * 0.018))
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup',   onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup',   onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame(() => {
    if (!playerRef?.current) return
    const p = playerRef.current.position
    const { theta, phi, r } = cam.current

    // Camera position in spherical coords around player
    _target.set(
      p.x + r * Math.sin(phi) * Math.sin(theta),
      p.y + r * Math.cos(phi),
      p.z + r * Math.sin(phi) * Math.cos(theta),
    )
    camera.position.lerp(_target, 0.1)
    _look.set(p.x, p.y + 1.2, p.z)
    camera.lookAt(_look)
  })

  return null
}
