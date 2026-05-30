import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

// Generate or retrieve a persistent player ID
function getPlayerId() {
  let id = localStorage.getItem('pengupanda_player_id')
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('pengupanda_player_id', id)
  }
  return id
}

export const playerId = getPlayerId()

export function useSocket(url) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,   // Always try to reconnect
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    })

    socket.on('connect', () => {
      setConnected(true)
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      setConnected(false)
      console.log('[Socket] Disconnected:', reason)
    })

    socket.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts')
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [url])

  return { socket: socketRef.current, connected }
}
