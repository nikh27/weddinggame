import React, { useRef, useEffect } from 'react'

const RADIUS = 46

export default function Joystick({ joystickRef }) {
  const baseRef = useRef(null)
  const knobRef = useRef(null)
  const activeRef = useRef(false)
  const originRef = useRef({ x: 0, y: 0 })

  const move = (cx, cy) => {
    const dx = cx - originRef.current.x
    const dy = cy - originRef.current.y
    const dist = Math.sqrt(dx*dx + dy*dy)
    const clamp = Math.min(dist, RADIUS)
    const angle = Math.atan2(dy, dx)
    const kx = Math.cos(angle) * clamp
    const ky = Math.sin(angle) * clamp

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`
    }
    if (joystickRef) {
      joystickRef.current = { x: kx / RADIUS, y: ky / RADIUS }
    }
  }

  const reset = () => {
    activeRef.current = false
    if (knobRef.current) knobRef.current.style.transform = 'translate(-50%,-50%)'
    if (joystickRef) joystickRef.current = { x: 0, y: 0 }
  }

  useEffect(() => {
    const base = baseRef.current
    if (!base) return

    const onDown = (e) => {
      e.preventDefault()
      e.stopPropagation()
      base.setPointerCapture(e.pointerId)
      activeRef.current = true
      const rect = base.getBoundingClientRect()
      originRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      move(e.clientX, e.clientY)
    }

    const onMove = (e) => {
      if (!activeRef.current) return
      e.preventDefault()
      move(e.clientX, e.clientY)
    }

    const onUp = (e) => {
      e.preventDefault()
      reset()
    }

    base.addEventListener('pointerdown', onDown, { passive: false })
    base.addEventListener('pointermove', onMove, { passive: false })
    base.addEventListener('pointerup', onUp, { passive: false })
    base.addEventListener('pointercancel', onUp, { passive: false })

    return () => {
      base.removeEventListener('pointerdown', onDown)
      base.removeEventListener('pointermove', onMove)
      base.removeEventListener('pointerup', onUp)
      base.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return (
    <div ref={baseRef} className="joystick-base">
      <div ref={knobRef} className="joystick-knob" />
    </div>
  )
}
