import React, { useState, useEffect, useRef } from 'react'
import { playerId } from '../hooks/useSocket'

export default function JoinScreen({ socket, connected, onJoined }) {
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState('idle') // idle | joining | error_code | full
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef()

  // Auto-rejoin if we had a character before
  useEffect(() => {
    if (!socket || !connected) return

    const savedChar = localStorage.getItem('pengupanda_character')
    const savedCode = localStorage.getItem('pengupanda_code')

    if (savedChar && savedCode) {
      // Try to silently rejoin
      setPhase('joining')
      socket.emit('join', { code: savedCode, playerId })
    }
  }, [socket, connected])

  useEffect(() => {
    if (!socket) return

    const onSuccess = ({ character }) => {
      localStorage.setItem('pengupanda_character', character)
      setPhase('idle')
      onJoined(character)
    }

    const onError = ({ message }) => {
      setPhase('idle')
      if (message === 'wrong_code') {
        setErrorMsg('Wrong code 🔒')
        localStorage.removeItem('pengupanda_character')
        localStorage.removeItem('pengupanda_code')
      } else if (message === 'room_full') {
        setPhase('full')
      }
    }

    socket.on('join_success', onSuccess)
    socket.on('join_error', onError)

    return () => {
      socket.off('join_success', onSuccess)
      socket.off('join_error', onError)
    }
  }, [socket, onJoined])

  const handleJoin = () => {
    if (!socket || !connected || !code.trim()) return
    setErrorMsg('')
    setPhase('joining')
    localStorage.setItem('pengupanda_code', code.trim().toLowerCase())
    socket.emit('join', { code: code.trim().toLowerCase(), playerId })
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleJoin()
  }

  if (phase === 'full') {
    return (
      <div className="pp-screen">
        <div className="pp-card">
          <div className="pp-logo">🐼🐧</div>
          <h1 className="pp-title">PenguPanda</h1>
          <p className="pp-full-msg">This world is full 💌</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pp-screen">
      {/* floating orbs */}
      <div className="pp-orb pp-orb-1" />
      <div className="pp-orb pp-orb-2" />

      <div className="pp-card">
        <div className="pp-logo">🐼🐧</div>
        <h1 className="pp-title">PenguPanda</h1>
        <p className="pp-subtitle">Enter your code to join</p>

        <div className="pp-input-wrap">
          <input
            ref={inputRef}
            className="pp-input"
            type="text"
            placeholder="Enter code..."
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            maxLength={20}
            disabled={phase === 'joining'}
            autoFocus
          />
        </div>

        {errorMsg && <div className="pp-error">{errorMsg}</div>}

        <button
          className="pp-btn"
          onClick={handleJoin}
          disabled={!connected || !code.trim() || phase === 'joining'}
        >
          {!connected
            ? '⏳ Connecting...'
            : phase === 'joining'
              ? '✨ Entering...'
              : 'Enter →'}
        </button>

        <div className="pp-conn-dot" style={{ background: connected ? '#86efac' : '#fdba74' }}>
          {connected ? '● Connected' : '● Connecting...'}
        </div>
      </div>
    </div>
  )
}
