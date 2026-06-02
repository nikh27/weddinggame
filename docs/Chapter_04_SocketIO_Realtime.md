# Chapter 04 — Real-Time Multiplayer: Socket.io & WebSockets

> **Goal:** Understand why normal HTTP can't power multiplayer games, what WebSockets are, how Socket.io makes them easy, and how PenguPanda uses them to sync two players in real time.

---

## ❌ Why HTTP is Not Enough for Multiplayer

HTTP (the normal web protocol) works like this:

```
Browser: "Hey server, give me the player positions."
Server:  "Here they are: Panda is at (5, 0, 3)."
Browser: "Thanks."

[2 seconds pass...]

Browser: "Hey server, give me the player positions AGAIN."
Server:  "Here they are: Panda is at (7, 0, 5)."
```

This is called **polling**. Problems:
- 60fps means 60 requests per second → server gets crushed
- There's always a delay (you ask, then wait for answer)
- It's wasteful — you send a request even when nothing changed

---

## ✅ WebSockets — Permanent Open Connection

A WebSocket works like a **phone call** instead of sending letters:

```
Browser: "Hello server, let's keep this connection open."
Server:  "Sure!"

[Now BOTH sides can send messages at ANY time, instantly]

Server → Browser: "Panda moved to (5, 0, 3)"   [instant!]
Browser → Server: "I moved to (2, 0, 8)"         [instant!]
Server → Browser: "Panda moved to (7, 0, 5)"   [instant!]
```

Key differences from HTTP:
- **One connection** stays open the whole time (not thousands of requests)
- **Server can PUSH data** to the browser without being asked
- **Latency is ~1-5ms** (vs 50-200ms for HTTP polling)
- **Bidirectional** — both sides can send at any time

---

## 📚 Socket.io — WebSockets Made Easy

Socket.io is built on top of WebSockets but adds:
- **Auto-reconnect** — if connection drops, it reconnects automatically
- **Event system** — instead of raw messages, you send named events
- **Fallback** — if WebSocket fails, falls back to HTTP long-polling
- **Acknowledgements** — confirm message was received

```javascript
// Server side (Node.js)
const io = new Server(httpServer)

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id)
  
  // Listen for events FROM this client
  socket.on('move', (data) => {
    console.log('Player moved to:', data.x, data.z)
  })
  
  // Send event TO this specific client
  socket.emit('welcome', { message: 'Hello!' })
  
  // Send event TO ALL connected clients
  io.emit('announcement', { text: 'New player joined!' })
  
  // Send to everyone EXCEPT this client
  socket.broadcast.emit('other_joined', { id: socket.id })
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)
  })
})
```

```javascript
// Client side (Browser)
import { io } from 'socket.io-client'
const socket = io('http://localhost:3001')

// Listen for events FROM server
socket.on('welcome', (data) => console.log(data.message))
socket.on('room_state', (state) => updateGame(state))

// Send events TO server
socket.emit('move', { x: 5, y: 0, z: 3 })
socket.emit('action', { type: 'enter_park' })
```

---

## 🔌 useSocket — Our Custom Hook

In our project, we created a custom hook to manage the socket connection:

```javascript
// client/src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

export function useSocket(serverUrl) {
  const [socket, setSocket] = useState(null)
  
  useEffect(() => {
    // Create the connection
    const s = io(serverUrl, {
      transports: ['websocket'],  // Force WebSocket (skip HTTP polling)
      reconnection: true,
      reconnectionAttempts: Infinity,  // Keep trying forever
      reconnectionDelay: 1000,         // Wait 1s between attempts
    })
    
    setSocket(s)
    
    // Cleanup: disconnect when component unmounts
    return () => s.disconnect()
  }, [serverUrl])
  
  return socket
}
```

Then in App.jsx:
```jsx
const socket = useSocket('http://localhost:3001')
// socket is null until connected, then it's the socket object
```

---

## 🎮 The Events in Our Game — Full List

Here is every single Socket.io event in our game:

### Client → Server (What the browser sends)

| Event Name | Payload | What it does |
|---|---|---|
| `join` | `{ playerId, character, phase, name }` | Player announces themselves |
| `move` | `{ x, y, z, rotation, animation }` | Position update (60x/sec) |
| `action` | `{ type, payload }` | Any game action (enter map, do ceremony, etc.) |
| `chat` | `{ message }` | Send a chat message |
| `emote` | `{ emoji }` | Send an emoji reaction |
| `webrtc_offer` | `{ offer }` | Voice chat setup (offer SDP) |
| `webrtc_answer` | `{ answer }` | Voice chat setup (answer SDP) |
| `webrtc_ice` | `{ candidate }` | Voice chat ICE candidate |

### Server → Client (What the server sends back)

| Event Name | Payload | What it does |
|---|---|---|
| `room_state` | Full game state object | Sync everything to all clients |
| `chat_message` | `{ character, message }` | Deliver a chat message |
| `emote_received` | `{ character, emoji }` | Deliver an emote |
| `reset_client` | none | Force page reload (dev tool) |

---

## 🔄 The Move Sync Loop — How Positions Stay In Sync

This is the most performance-critical part of the whole system:

```
DEVICE 1 (Panda)                    SERVER                    DEVICE 2 (Penguin)
     │                                 │                              │
     │  Keyboard: W pressed            │                              │
     │  posRef.current.z -= 0.05       │                              │
     │                                 │                              │
     │──── emit('move', {x,y,z}) ─────▶│                              │
     │                                 │  io.emit('room_state',       │
     │                                 │    { panda: {x,y,z}, ... }) ─────▶│
     │                                 │                              │  CharacterModel
     │                                 │                              │  updates to new position
     │  [16ms later - next frame]      │                              │
     │──── emit('move', {x,y,z}) ─────▶│                              │
     │                                 │  io.emit('room_state') ──────────▶│
```

In code:
```javascript
// usePlayerMovement.js — sends every 50ms (not every frame to save bandwidth)
const SEND_RATE = 50  // ms

useFrame(() => {
  // ... movement calculation ...

  const now = Date.now()
  if (now - lastSendRef.current > SEND_RATE && socket) {
    lastSendRef.current = now
    socket.emit('move', {
      x: posRef.current.x,
      y: posRef.current.y,
      z: posRef.current.z,
      rotation: rotRef.current,
      animation: animRef.current,
    })
  }
})
```

```javascript
// server/index.js — receives move and broadcasts to others
socket.on('move', ({ x, y, z, rotation, animation }) => {
  if (!char) return  // Not a registered player
  room[char].x = x
  room[char].y = y
  room[char].z = z
  room[char].rotation = rotation
  room[char].animation = animation
  // Broadcast updated state to EVERYONE
  io.emit('room_state', getRoomState())
})
```

---

## 🔁 Reconnection — Handling Drops

Players can disconnect (phone sleeps, WiFi drops). We handle this with a **player registry**:

```javascript
// server/index.js
const registry = new Map()  // Stores player data by their persistent playerId

socket.on('join', ({ playerId, character, phase }) => {
  // Check if this player was here before
  const existing = registry.get(playerId)
  
  if (existing) {
    // RESTORE! Player reconnected within 10 minutes
    console.log(`[RESTORE] ${playerId} → ${character}`)
    room[character] = {
      ...existing,  // Use their old position and phase
      socketId: socket.id  // Update to their new socket
    }
  } else {
    // NEW player
    registry.set(playerId, { playerId, character, phase })
    room[character] = { socketId: socket.id, playerId, character, phase, x: 0, y: 0, z: 0 }
  }
  
  io.emit('room_state', getRoomState())
})

socket.on('disconnect', () => {
  // Don't delete immediately! Give them 10 minutes to come back
  if (reg) {
    reg.expiresAt = Date.now() + 10 * 60 * 1000  // 10 minutes
    reg.lastPhase = room[char].phase  // Remember where they were
  }
  room[char] = null  // Remove from active room
})
```

---

## 📡 The Room State Object

Every time something changes, the server sends a `room_state` event with the complete game state:

```javascript
function getRoomState() {
  return {
    // Player positions and info
    panda: room.panda ? {
      x: room.panda.x, y: room.panda.y, z: room.panda.z,
      rotation: room.panda.rotation,
      animation: room.panda.animation,
      phase: room.panda.phase,  // which map they're in
      name: room.panda.name,
    } : null,
    
    penguin: room.penguin ? { /* same */ } : null,
    
    // Global game state
    weddingStage: globalState.weddingStage,     // 0-10
    proposalStatus: globalState.proposalStatus, // 'none' | 'active' | 'accepted'
    engagementStatus: globalState.engagementStatus,
    pandaHasRing: globalState.pandaHasRing,
    // ... etc
  }
}
```

The client receives this and updates everything:
```javascript
// App.jsx
socket.on('room_state', (state) => {
  setGlobalState(state)  // React re-renders with new data
})
```

---

## ⚡ Action Events — How Game Progress Happens

Game actions (entering a new map, doing a ceremony step) are different from movement. They're discrete events:

```javascript
// Client sends an action
socket.emit('action', { type: 'set_phase', payload: { phase: 'park' } })

// Server handles it
socket.on('action', ({ type, payload }) => {
  if (type === 'set_phase') {
    room[char].phase = payload.phase
    io.emit('room_state', getRoomState())  // Tell everyone
  }
  
  if (type === 'wedding_action') {
    globalState.weddingStage = payload.stage
    saveState()  // Persist to disk
    io.emit('room_state', getRoomState())
  }
  
  // ... many more action types
})
```

---

## ✅ Chapter 04 Summary

| Concept | Key Point |
|---|---|
| **HTTP** | Request-response — browser asks, server answers. Not good for realtime. |
| **WebSocket** | Persistent open connection — both sides can send at any time |
| **Socket.io** | Adds events, auto-reconnect, rooms on top of WebSocket |
| **socket.emit()** | Send an event to the other side |
| **socket.on()** | Listen for an event from the other side |
| **io.emit()** | Server sends to ALL connected clients |
| **socket.broadcast.emit()** | Server sends to everyone EXCEPT this socket |
| **room_state** | Our "single source of truth" — server sends full state on every change |
| **SEND_RATE** | We send position every 50ms (not every frame) to save bandwidth |

---

> **Next Chapter →** [Chapter 05: The Backend Server — Node.js & Express](Chapter_05_NodeJS_Express.md)
