# Chapter 08 — Maps & Environments: Building 3D Worlds

> **Goal:** Understand how our 4 different 3D environments (MDU, Park, Hall, House) are designed and built using primitive geometries.

---

## 🗺️ The 4 Maps

| Map | File | Phase Name | Purpose |
|---|---|---|---|
| MDU Campus | `CozyMap.jsx` | `mdu` | Starting hub with gates to all other maps |
| Cherry Park | `ParkMap.jsx` | `park` | Proposal scene with NPCs |
| Engagement Hall | `HallMap.jsx` | `hall` | Ring exchange ceremony |
| Wedding House | `HouseMap.jsx` | `house` | Full wedding ceremony |

---

## 🏗️ Building Architecture with Primitives

Every wall, floor, ceiling is a `<mesh>` with a `<boxGeometry>`:

```jsx
function Room({ width = 30, depth = 35, height = 10, wallColor = '#c8a882' }) {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5e6d3" />
      </mesh>

      {/* Back wall (at negative Z = back of room) */}
      <mesh position={[0, height/2, -depth/2]}>
        <boxGeometry args={[width, height, 0.5]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-width/2, height/2, 0]}>
        <boxGeometry args={[0.5, height, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Right wall */}
      <mesh position={[width/2, height/2, 0]}>
        <boxGeometry args={[0.5, height, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Front wall with arch gap (two pillars + top piece) */}
      <mesh position={[-7, height/2, depth/2]}>
        <boxGeometry args={[16, height, 0.5]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* ... entrance arch on the right side */}
    </group>
  )
}
```

---

## 🌸 The Mandap — Wedding Stage

The Mandap is the raised platform where the couple stands. Built from boxes with decorative elements:

```jsx
function Mandap({ position }) {
  return (
    <group position={position}>
      {/* Raised platform */}
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[10, 0.4, 10]} />
        <meshStandardMaterial color="#d4a017" />
      </mesh>

      {/* 4 corner pillars */}
      {[[-4, 0, -4], [4, 0, -4], [-4, 0, 4], [4, 0, 4]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
          <meshStandardMaterial color="#8B0000" roughness={0.4} />
        </mesh>
      ))}

      {/* Sacred fire in center */}
      <SacredFire position={[0, 0.4, 0]} />

      {/* Sparkles decoration */}
      <Sparkles count={60} scale={8} size={2} color="#ffd700" />
    </group>
  )
}
```

---

## 🧭 Proximity Detection — Action Prompts

When a player walks near a gate or special zone, an action button appears. This is done by calculating distance in the game loop:

```javascript
// In Game.jsx — runs every 30ms
useEffect(() => {
  const interval = setInterval(() => {
    const myPos = myPosRef.current
    if (!myPos || myPhase !== 'mdu') return

    let prompt = null

    // Check distance to Park entrance gate (at position [18, 0, -4.5])
    const distToPark = Math.sqrt(
      Math.pow(myPos.x - 18, 2) + Math.pow(myPos.z - (-4.5), 2)
    )
    if (distToPark < 3.5) {  // Within 3.5 units
      prompt = { text: '🌸 Enter Park', action: 'set_phase', payload: { phase: 'park' } }
    }

    // Check other gates...
    
    setActivePrompt(prompt)
  }, 30)
  
  return () => clearInterval(interval)
}, [myPhase, myPosRef])
```

---

## ✅ Chapter 08 Summary

Building a 3D world is just placing box/cylinder/sphere meshes in the right positions. The key skills are: understanding the 3D coordinate system, group positioning, and proximity-based interaction.

---
---

# Chapter 09 — The Camera System: Following & Controlling

---

## 👁️ The Follow Camera

The camera always follows the player from behind/above. This is implemented in `FollowCamera.jsx`:

```javascript
// FollowCamera.jsx
function FollowCamera({ playerRef }) {
  const cam = useRef({ r: 12, theta: 0, phi: 1.1 })  // Spherical coordinates

  useFrame(({ camera }) => {
    const target = playerRef.current?.position ?? new THREE.Vector3()
    
    // Camera orbits around player using spherical coordinates
    const x = target.x + cam.current.r * Math.sin(cam.current.phi) * Math.sin(cam.current.theta)
    const y = target.y + cam.current.r * Math.cos(cam.current.phi)
    const z = target.z + cam.current.r * Math.sin(cam.current.phi) * Math.cos(cam.current.theta)
    
    // Smoothly move camera (lerp = linear interpolation)
    camera.position.lerp(new THREE.Vector3(x, y, z), 0.1)
    camera.lookAt(target.x, target.y + 1, target.z)
  })
}
```

### Spherical Coordinates:
```
r     = distance from player (zoom level)
theta = horizontal rotation (looking left/right around player)
phi   = vertical angle (how high above player you're looking from)
```

---

## 🖱️ Mouse/Touch Camera Control

Users can drag to orbit the camera:

```javascript
// Touch/Mouse drag → rotate camera
window.addEventListener('pointermove', (e) => {
  if (!isDragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  
  cam.current.theta -= dx * 0.005  // Horizontal drag = horizontal orbit
  cam.current.phi = Math.max(0.15, Math.min(Math.PI/2 - 0.05, 
    cam.current.phi - dy * 0.005   // Vertical drag = vertical orbit
  ))
  
  lastX = e.clientX
  lastY = e.clientY
})
```

---

## 📷 Camera Mode — Photography

When Panda activates camera mode, the controls switch from player movement to free camera panning:

```jsx
// In Game.jsx
const [cameraMode, setCameraMode] = useState(false)

// Pass frozen=true to Player to disable keyboard movement
<Player frozen={cameraMode} ... />

// CamController takes over when cameraMode=true
<CamController active={cameraMode} joystickRef={joystickRef} targetRef={myPosRef} />
```

---
---

# Chapter 10 — Voice Chat: WebRTC Peer-to-Peer

> **Goal:** Understand how real browser-to-browser audio calling works WITHOUT a server in the middle — just like Zoom or Google Meet.

---

## 📞 What is WebRTC?

WebRTC (Web Real-Time Communication) is a browser API that allows direct peer-to-peer connections for:
- Audio/video calls
- File sharing
- Data channels

The key thing: **audio goes directly between browsers**, NOT through your server. The server only helps them find each other (called "signaling").

---

## 🤝 The WebRTC Handshake — SDP Offer/Answer

```
PANDA'S BROWSER                  SERVER              PENGUIN'S BROWSER
      │                             │                        │
      │  1. Create offer (SDP)      │                        │
      │  (describes: "I can do      │                        │
      │   audio, here's my codecs") │                        │
      │──── emit('webrtc_offer') ──▶│                        │
      │                             │──── emit to penguin ──▶│
      │                             │                        │  2. Create answer SDP
      │                             │◀─── emit('webrtc_answer')─│
      │◀─── forward answer ─────────│                        │
      │                             │                        │
      │  3. Exchange ICE candidates  │                        │
      │     (finding network path)  │                        │
      │──── emit('webrtc_ice') ────▶│──── forward ─────────▶│
      │◀─── emit('webrtc_ice') ─────│◀──── forward ──────────│
      │                             │                        │
      │◀══════ Direct Audio Stream ══════════════════════════│
      │                             │  (server NOT involved) │
```

---

## 💻 The Code — VoiceChat.jsx

```javascript
// Get microphone
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

// Create peer connection
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  // STUN server: a free Google server that helps find your public IP
})

// Add local audio to the connection
stream.getTracks().forEach(track => pc.addTrack(track, stream))

// When we get ICE candidates, send them to the other peer via server
pc.onicecandidate = (e) => {
  if (e.candidate) {
    socket.emit('webrtc_ice', { candidate: e.candidate })
  }
}

// When we receive the other peer's audio
pc.ontrack = (e) => {
  const audio = new Audio()
  audio.srcObject = e.streams[0]  // Play their audio!
  audio.play()
}

// Create and send the offer
const offer = await pc.createOffer()
await pc.setLocalDescription(offer)
socket.emit('webrtc_offer', { offer })

// Receive answer and complete connection
socket.on('webrtc_answer', async ({ answer }) => {
  await pc.setRemoteDescription(new RTCSessionDescription(answer))
})
```

---

## ✅ Chapter 10 Summary

| Concept | Key Point |
|---|---|
| **WebRTC** | Browser-to-browser direct connection (no server for media) |
| **SDP** | Session Description Protocol — describes audio/video capabilities |
| **ICE** | Interactive Connectivity Establishment — finds network path |
| **STUN server** | Helps browsers discover their public IP address |
| **Signaling** | Server only passes SDP/ICE messages, doesn't handle media |

---
---

# Chapter 11 — Photos & Memories: The File Upload System

---

## 📸 How In-Game Photos Work

1. Player clicks the camera button.
2. `html2canvas` (or Three.js's `gl.domElement.toDataURL()`) takes a screenshot of the canvas.
3. The screenshot is converted to a Base64 string.
4. The string is sent to the server via `POST /api/photos`.
5. The server decodes it and saves it as a JPEG file.
6. The wedding ending screen fetches and displays all photos.

---

## 🖼️ Capturing the 3D Canvas

```javascript
// CaptureHelper.jsx — captures the WebGL canvas
function CaptureHelper({ captureRef }) {
  const { gl } = useThree()  // gl = the WebGL renderer
  
  captureRef.current = (callback) => {
    // Force render a fresh frame
    gl.render(scene, camera)
    // Get the pixel data as base64 PNG
    const dataUrl = gl.domElement.toDataURL('image/jpeg', 0.9)
    callback(dataUrl)
  }
}
```

---

## 📤 Uploading the Photo

```javascript
// In Game.jsx
const takePhoto = useCallback(() => {
  captureRef.current(async (dataUrl) => {
    // Flash animation effect
    setFlashAnim(true)
    setTimeout(() => setFlashAnim(false), 450)
    
    // Send to server
    const resp = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataUrl })  // Base64 string
    })
    
    if (resp.ok) setPhotoCount(c => c + 1)
  })
}, [])
```

---

## 📥 Server: Saving the Photo

```javascript
// server/index.js
app.post('/api/photos', (req, res) => {
  const { data } = req.body  // "data:image/jpeg;base64,/9j/4AAQ..."
  
  // Remove the data URL prefix to get raw base64
  const base64 = data.replace(/^data:image\/\w+;base64,/, '')
  
  // Convert base64 string to binary Buffer
  const buffer = Buffer.from(base64, 'base64')
  
  // Save with unique timestamp filename
  const filename = `memory_${Date.now()}.jpg`
  fs.writeFileSync(path.join(PHOTOS_DIR, filename), buffer)
  
  res.json({ ok: true, url: `/photos/${filename}` })
})
```

---
---

# Chapter 12 — The Wedding Ceremony: Pheras & Stage Logic

---

## 🔥 The Phera Tracker

7 sacred circles (pheras) around the fire. Each phera requires both players to walk the full circle:

```javascript
// PheraTracker.jsx
function PheraTracker({ stage, myPosRef, remotePlayer, onComplete }) {
  const [pherasCompleted, setPherasCompleted] = useState(0)
  
  useFrame(() => {
    if (stage < 2 || stage >= 7) return  // Only during phera stage
    
    const firePos = { x: 0, z: -8 }  // Sacred fire is at center of mandap
    const myPos = myPosRef.current
    
    // Calculate angle of player around the fire
    const angle = Math.atan2(myPos.x - firePos.x, myPos.z - firePos.z)
    
    // Track if player completes a full 360° circle
    // (using angle change detection)
  })
}
```

---

## 🗣️ The Pujari — NPC Priest

The priest NPC (`HousePujari.jsx`) walks to specific positions and displays dialogue based on the wedding stage:

```javascript
const PUJARI_SCRIPT = [
  { stage: 1, text: "Welcome, blessed souls. Today we begin a sacred journey...", position: [0, 0, -6] },
  { stage: 2, text: "Now, let us begin the Saat Phere — Seven Sacred Steps...", position: [0, 0, -4] },
  { stage: 3, text: "First Phera: For nourishment and togetherness...", position: [-2, 0, -6] },
  // ...
]

// Pujari walks to target position smoothly
useFrame((_, delta) => {
  if (!pujariRef.current) return
  
  const target = currentScript.position
  const pos = pujariRef.current.position
  
  // Move towards target (lerp)
  pos.x = THREE.MathUtils.lerp(pos.x, target[0], delta * 2)
  pos.z = THREE.MathUtils.lerp(pos.z, target[2], delta * 2)
  
  // Show next dialogue when stage changes
  if (stage !== prevStage) {
    showNextLine(stage)
  }
})
```

---
---

# Chapter 13 — Visual Magic: Effects & Animations

---

## ✨ Fireworks

```javascript
// Fireworks.jsx
function Fireworks() {
  const particles = useRef([])
  
  useFrame((state, delta) => {
    particles.current.forEach(p => {
      p.velocity.y -= 9.8 * delta  // Gravity
      p.position.add(p.velocity.clone().multiplyScalar(delta))
      p.life -= delta
      p.mesh.material.opacity = p.life  // Fade out
      
      // Respawn when dead
      if (p.life <= 0) resetParticle(p)
    })
  })
}
```

## 🌸 Flower Rain

```javascript
function FlowerRain() {
  const ref = useRef([])
  
  useFrame((state, delta) => {
    ref.current.forEach(flower => {
      flower.position.y -= delta * 2      // Fall down
      flower.rotation.z += delta          // Spin as they fall
      flower.position.x += Math.sin(state.clock.elapsedTime + flower.offset) * 0.02  // Sway
      
      // Respawn at top when they reach the floor
      if (flower.position.y < -5) {
        flower.position.y = 15
        flower.position.x = (Math.random() - 0.5) * 20
      }
    })
  })
}
```

## 🌊 Water Animation

```javascript
// Pond with animated ripples
function Pond({ position }) {
  const ref = useRef()
  
  useFrame((state) => {
    // Animate opacity for shimmer effect
    ref.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05
  })
  
  return (
    <group position={position}>
      <mesh ref={ref} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[2.5, 24]} />
        <meshStandardMaterial color="#67b8de" transparent opacity={0.55} />
      </mesh>
    </group>
  )
}
```

---
---

# Chapter 14 — The Ending: Certificate & Music Player

---

## 📜 The Certificate — html2canvas

`html2canvas` converts a DOM element to a canvas image:

```javascript
import html2canvas from 'html2canvas'

const downloadCertificate = () => {
  const el = document.getElementById('wedding-certificate')
  
  html2canvas(el, {
    scale: 2,           // 2x resolution (sharper)
    useCORS: true,      // Allow cross-origin images
    backgroundColor: '#ffffff'  // White background
  }).then(canvas => {
    // Convert canvas to downloadable image
    const imgData = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = imgData
    a.download = `Wedding_Certificate.png`
    a.click()           // Trigger download
  })
}
```

---

## 🎵 The Music Player

A fully custom audio player built using the HTML5 Audio API:

```javascript
const audioRef = useRef(null)  // <audio> element reference
const [songIdx, setSongIdx] = useState(0)
const [isPlaying, setIsPlaying] = useState(true)

const SONGS = [
  { title: 'Aaj Se Teri', url: '/Aaj Se Teri.mp3' },
  { title: 'Tu Chahiye', url: '/Tu Chahiye.mp3' },
  // ...
]

// Play/switch song
useEffect(() => {
  const audio = audioRef.current
  audio.src = SONGS[songIdx].url
  audio.volume = 0.6
  if (isPlaying) audio.play().catch(() => {})
  else audio.pause()
}, [songIdx, isPlaying])

// Controls
const togglePlay = () => setIsPlaying(p => !p)
const nextSong = () => setSongIdx(i => (i + 1) % SONGS.length)
const prevSong = () => setSongIdx(i => (i - 1 + SONGS.length) % SONGS.length)
```

---

## 📖 Story Animation

Text lines appear one by one with timed delays:

```javascript
const STORY_LINES = [
  { delay: 0,    text: "And so it was written in the stars..." },
  { delay: 2800, text: "A little Panda and a little Penguin found each other..." },
  // ...
]

useEffect(() => {
  if (phase !== 'story') return
  
  const timers = STORY_LINES.map((line, idx) =>
    setTimeout(() => {
      setVisibleLines(prev => [...prev, idx])  // Reveal line by line
    }, line.delay)
  )
  
  // After all lines → switch to certificate
  const endTimer = setTimeout(() => setPhase('certificate'), 28500)
  
  return () => { timers.forEach(clearTimeout); clearTimeout(endTimer) }
}, [phase])
```

---
---

# Chapter 15 — Deployment: Going Live on Render

---

## 🏗️ Production vs Development

| Development | Production |
|---|---|
| Vite dev server on :5173 | React built into static files |
| Node.js server on :3001 | One server on one port |
| Hot module replacement | Minified, optimized bundle |
| Source maps (debugging) | No source maps |
| npm run dev | npm start |

---

## 📦 The Build Process

```json
// Root package.json
{
  "scripts": {
    "build": "cd client && npm install && npm run build && cd ../server && npm install",
    "start": "cd server && node index.js"
  }
}
```

1. `npm run build` installs client dependencies and runs `vite build`
2. Vite compiles all React code into `client/dist/` (HTML + JS + CSS)
3. `npm start` starts the Node.js server
4. Express serves `client/dist/` as static files
5. All WebSocket and API requests go to the same server

---

## ☁️ Render Configuration

```
Build Command: npm run build
Start Command: npm start
Port: process.env.PORT (Render sets this automatically)
```

```javascript
// server/index.js — use Render's dynamic port
const PORT = process.env.PORT || 3001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server → http://localhost:${PORT}`)
})
```

---

## 🔄 Environment Detection

The client auto-detects whether it's running locally or on Render:

```javascript
// client/src/App.jsx
const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname.startsWith('192.168.')

const SERVER_URL = isLocalhost 
  ? `${window.location.protocol}//${window.location.hostname}:3001`  // Dev: separate ports
  : window.location.origin  // Production: same origin
```

---
---

# Chapter 16 — Interview Masterclass: 40+ Q&A

---

## 🟢 React Questions

**Q: What is the difference between state and props?**
A: Props are inputs passed from parent to child (read-only). State is internal data managed by the component itself (can change, triggers re-render).

**Q: What is the purpose of useEffect's dependency array?**
A: It controls when the effect re-runs. Empty `[]` = run once on mount. `[value]` = re-run when value changes. No array = run on every render.

**Q: Why do we use useRef instead of useState for player position?**
A: `useState` triggers a React re-render every time it changes. Position updates 60 times per second — that would re-render React 60x/sec, killing performance. `useRef` just updates the value without re-rendering.

**Q: What is useCallback and why is it used?**
A: `useCallback` memoizes a function so the same function reference is returned on re-renders unless dependencies change. Prevents unnecessary re-creation of functions passed as props.

**Q: What is the virtual DOM?**
A: React keeps an in-memory copy of the DOM. When state changes, React computes the diff between old and new virtual DOM, then applies only the minimal changes to the real DOM.

---

## 🟡 Three.js / 3D Questions

**Q: What is WebGL?**
A: WebGL (Web Graphics Library) is a browser API that provides access to the GPU for rendering 2D and 3D graphics without plugins. It's based on OpenGL ES.

**Q: What is the difference between MeshStandardMaterial and MeshBasicMaterial?**
A: MeshStandardMaterial uses Physically Based Rendering (PBR) and reacts to lights with realistic shading. MeshBasicMaterial ignores all lights and always shows at full brightness.

**Q: What are spherical coordinates and why are they used for cameras?**
A: Spherical coordinates (r, theta, phi) describe a point by its distance from center and two angles. They're perfect for orbiting cameras because changing theta rotates around the target, and changing phi moves up/down.

**Q: What is useFrame in React Three Fiber?**
A: A hook that runs a callback on every animation frame (typically 60fps). It's the game loop — used for movement, animations, and any per-frame logic.

**Q: What is delta time and why is it important?**
A: Delta is the time elapsed since the last frame. Multiplying speed by delta makes movement framerate-independent — objects move the same speed whether running at 30fps or 144fps.

---

## 🔵 WebSocket / Socket.io Questions

**Q: What is the difference between WebSocket and HTTP?**
A: HTTP is request-response (browser must ask first). WebSocket is a persistent bidirectional connection where either side can send at any time. WebSocket is better for real-time apps.

**Q: What does socket.emit() vs io.emit() do?**
A: `socket.emit()` sends to that specific client only. `io.emit()` sends to ALL connected clients. `socket.broadcast.emit()` sends to everyone EXCEPT the sender.

**Q: How do you handle player reconnection in a multiplayer game?**
A: Assign each player a persistent ID (stored in localStorage). When they reconnect, look up their previous state in a registry and restore their position and phase instead of starting fresh.

**Q: What is the "room state" pattern?**
A: Instead of sending delta updates (only what changed), send the complete current state on every change. Simpler to implement, easier to sync — works well for small games with few players.

**Q: Why do we throttle position updates to every 50ms instead of every frame?**
A: At 60fps, sending every frame = 60 socket messages/second/player. At 50ms throttle = 20 messages/sec. Reduces bandwidth by 67% with barely noticeable difference in smoothness.

---

## 🔴 WebRTC Questions

**Q: What is WebRTC?**
A: Web Real-Time Communication — a browser API for peer-to-peer audio, video, and data without a central server relaying the media.

**Q: What is a STUN server?**
A: A STUN (Session Traversal Utilities for NAT) server helps a browser discover its public IP address and port. Needed because most devices are behind NAT (routers). We use Google's free STUN server.

**Q: What is SDP?**
A: Session Description Protocol — a text format that describes a connection's capabilities: what codecs are supported, what IP/port to connect to, etc. Shared during offer/answer handshake.

**Q: What is an ICE candidate?**
A: ICE (Interactive Connectivity Establishment) candidates are potential network paths for connecting. The browser generates several candidates (direct IP, STUN-discovered IP, TURN relay) and sends them all. The best working one is chosen.

**Q: Why does WebRTC still need a server (signaling)?**
A: The two browsers don't know each other's address before connecting. They need a way to exchange SDP offers/answers and ICE candidates. Our Socket.io server acts as the "matchmaker" just for this initial exchange.

---

## 🟣 Node.js / Backend Questions

**Q: What is Node.js?**
A: A JavaScript runtime built on Chrome's V8 engine that lets JavaScript run on servers. It's non-blocking and event-driven, making it excellent for I/O-heavy applications like real-time servers.

**Q: What is Express?**
A: A minimal web framework for Node.js that provides routing (app.get, app.post), middleware, and request/response handling for building REST APIs.

**Q: What is CORS and why do we need it?**
A: Cross-Origin Resource Sharing — browsers block requests between different origins by default. CORS headers tell the browser "this server allows requests from other origins." Needed in development when frontend (port 5173) calls backend (port 3001).

**Q: What is Base64 encoding and why do we use it for photos?**
A: Base64 converts binary data (like image bytes) into ASCII text. We use it because JSON (what our API sends) can only contain text, not raw binary. The image is encoded to Base64, sent as JSON, then decoded back to binary on the server.

**Q: What is the difference between synchronous and asynchronous file reading?**
A: `fs.readFileSync()` blocks execution until the file is read. `fs.readFile()` starts reading and calls a callback when done — other code runs in the meantime. Use async for performance in production.

---

## ⚪ General / Architecture Questions

**Q: What is a state machine?**
A: A system that is always in exactly one defined state. Transitions between states happen only on specific events. Our `weddingStage` (0-10) is a state machine — it can only go forward.

**Q: What is a monorepo?**
A: A single repository that contains multiple projects (our client + server). We used a root `package.json` with build/start scripts to manage both together for deployment.

**Q: How does the game handle offline/reconnection scenarios?**
A: Players get a persistent `playerId` stored in localStorage. The server keeps their data for 10 minutes after disconnect. When they reconnect with the same playerId, their position, phase, and progress are all restored.

**Q: What is the difference between localStorage and sessionStorage?**
A: `localStorage` persists until explicitly cleared (survives browser close). `sessionStorage` only lasts for the current browser tab/session. We use `localStorage` for playerId so it persists across refreshes.

**Q: How would you scale this game to 1000 players?**
A: Use Socket.io Rooms (isolate game sessions), add Redis for shared state between multiple Node.js instances, use a load balancer with sticky sessions (WebSockets must connect to the same server), and deploy multiple server instances. For 3D, reduce `SEND_RATE` and add interpolation on the client to smooth movement.

**Q: What makes this project stand out on a resume?**
A: It combines 5 complex technologies (React, Three.js, Socket.io, WebRTC, Node.js) into a cohesive, deployable product. It demonstrates real-time systems thinking, 3D programming, P2P networking, full-stack ownership, and production deployment — skills that most junior developers don't have.

---

## 🎯 Final Interview Tips

1. **Draw the architecture** — Practice drawing the system diagram from memory. Interviewers love visual thinkers.

2. **Explain the hardest problem** — The reconnection logic and camera-relative movement are genuinely complex. Talk about these.

3. **Know the "why"** — Don't just say "I used Socket.io." Say "I used Socket.io because HTTP can't push data to browsers, and I needed the server to broadcast position updates to all players in real time."

4. **Talk about tradeoffs** — "I throttled position updates to 50ms instead of every frame to reduce bandwidth by 67%. The tradeoff is slightly less smooth remote player movement, which I accept because the game runs over the internet anyway."

5. **Be honest about challenges** — "The hardest bug was the reconnection loop — when a player reconnected, the `hasSpawned` state reset to false, causing their phase to snap back to `mdu`. I fixed this by using a `useRef` instead of `useState` to persist the phase across React re-renders."

---

> 🎉 **Congratulations!** You now know this project inside out. Go build the next one!
