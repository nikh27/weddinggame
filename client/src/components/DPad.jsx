import React, { useRef, useState, useCallback } from 'react'

const DIRS = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y:  1 },
  left:  { x: -1, y:  0 },
  right: { x: 1,  y:  0 },
}

export default function DPad({ joystickRef }) {
  const active  = useRef(new Set())
  const [pressed, setPressed] = useState(new Set())

  const sync = () => {
    let x = 0, y = 0
    for (const d of active.current) { x += DIRS[d].x; y += DIRS[d].y }
    const len = Math.sqrt(x * x + y * y) || 1
    joystickRef.current = { x: x / len, y: y / len }
    setPressed(new Set(active.current))
  }

  const press = useCallback((dir, e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    active.current.add(dir)
    sync()
  }, [])

  const release = useCallback((dir) => {
    active.current.delete(dir)
    sync()
  }, [])

  const Btn = ({ dir, label }) => (
    <button
      className={`dpad-btn${pressed.has(dir) ? ' dpad-active' : ''}`}
      onPointerDown={e => press(dir, e)}
      onPointerUp={() => release(dir)}
      onPointerLeave={() => release(dir)}
      onPointerCancel={() => release(dir)}
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      aria-label={dir}
    >
      {label}
    </button>
  )

  return (
    <div className="dpad" style={{ pointerEvents: 'all' }}>
      <Btn dir="up"    label="▲" />
      <div className="dpad-row">
        <Btn dir="left"  label="◄" />
        <div className="dpad-mid" />
        <Btn dir="right" label="►" />
      </div>
      <Btn dir="down"  label="▼" />
    </div>
  )
}
