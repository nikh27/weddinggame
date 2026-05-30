import React, { useState, useCallback, useEffect } from 'react'
import JoinScreen from './components/JoinScreen'
import Game from './components/Game'
import WeddingEnding from './components/WeddingEnding'
import { useSocket } from './hooks/useSocket'

// Auto-detect server URL so it works on phone over WiFi
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
const SERVER_URL = isLocalhost ? `${window.location.protocol}//${window.location.hostname}:3001` : window.location.origin;

export default function App() {
  const [screen, setScreen] = useState('join')
  const [myCharacter, setMyCharacter] = useState(null)
  const [weddingComplete, setWeddingComplete] = useState(false)

  const { socket, connected } = useSocket(SERVER_URL)

  useEffect(() => {
    if (!socket) return
    const onRoomState = (state) => {
      if (state.globalState?.weddingStage >= 10) {
        setWeddingComplete(true)
      }
    }
    socket.on('room_state', onRoomState)
    return () => socket.off('room_state', onRoomState)
  }, [socket])

  const handleJoined = useCallback((character) => {
    setMyCharacter(character)
    setScreen('game')
  }, [])

  useEffect(() => {
    if (!socket) return
    const onActionEvent = ({ type }) => {
      if (type === 'reset_client') {
        localStorage.clear()
        window.location.reload()
      }
    }
    socket.on('action_event', onActionEvent)
    return () => socket.off('action_event', onActionEvent)
  }, [socket])

  if (weddingComplete) {
    return <WeddingEnding socket={socket} />
  }

  if (screen === 'join') {
    return <JoinScreen socket={socket} connected={connected} onJoined={handleJoined} />
  }

  return (
    <Game
      socket={socket}
      myCharacter={myCharacter}
      onDisconnected={() => {
        // If kicked back to join, rejoin automatically
      }}
    />
  )
}
