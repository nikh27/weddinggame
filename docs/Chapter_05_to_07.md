# Chapter 05 — The Backend Server: Node.js & Express

> **Goal:** Understand Node.js as a runtime, Express as an HTTP framework, how our REST API is structured, and how we serve the frontend from the backend in production.

---

## 🟩 What is Node.js?

Node.js lets you run JavaScript on the **server** (your computer or a cloud machine), not just in the browser.

Before Node.js:
- JavaScript = browser only
- Servers were written in Java, Python, PHP, etc.

With Node.js:
- Same language (JavaScript) for frontend AND backend
- Built on Chrome's V8 JavaScript engine (the fastest JS engine)
- Non-blocking I/O (explained below)

---

## ⚡ Non-Blocking I/O — Node's Superpower

Most server languages "block" when waiting (e.g., for a database query):

```
Request 1: Reading file... [WAITING - 100ms] → Done → Handle next request
Request 2:                [WAITING in queue]
Request 3:                                  [WAITING in queue]
```

Node.js is **non-blocking** (asynchronous):
```
Request 1: Reading file... [continue handling other requests]
Request 2: Handled immediately!
Request 3: Handled immediately!
[100ms later] Request 1's file is ready → process it
```

This is why Node.js is PERFECT for real-time apps — it can handle thousands of WebSocket connections simultaneously without blocking.

---

## 🚀 Express — HTTP Routes

Express is a minimal framework for building HTTP routes (REST API):

```javascript
const express = require('express')
const app = express()

// Middleware — runs on every request
app.use(express.json())  // Parse JSON request bodies

// Route: GET /api/users
app.get('/api/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob'] })
})

// Route: POST /api/users
app.post('/api/users', (req, res) => {
  const { name } = req.body  // Data from request body
  res.status(201).json({ created: name })
})

// Route with URL parameter
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id  // e.g., /api/users/42 → id = "42"
  res.json({ userId })
})

// Start server
app.listen(3001, () => console.log('Server running on :3001'))
```

---

## 📸 Our Photo API

In our project, we have a full photo management REST API:

```javascript
// ── Photos folder setup ─────────────────────────────────────────
const PHOTOS_DIR = path.join(__dirname, 'data/photos')
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true })

// Serve photos as static files (like a CDN)
app.use('/photos', express.static(PHOTOS_DIR))

// POST /api/photos — Upload a photo
app.post('/api/photos', (req, res) => {
  const { data } = req.body  // Base64 encoded image string

  // Remove the "data:image/jpeg;base64," prefix
  const base64 = data.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')  // Convert to binary
  
  const filename = `memory_${Date.now()}.jpg`   // Unique filename
  fs.writeFileSync(path.join(PHOTOS_DIR, filename), buffer)  // Save to disk
  
  res.json({ ok: true, filename, url: `/photos/${filename}` })
})

// GET /api/photos — List all photos
app.get('/api/photos', (req, res) => {
  const files = fs.readdirSync(PHOTOS_DIR)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    .sort().reverse()  // Newest first
  res.json(files.map(f => ({ filename: f, url: `/photos/${f}` })))
})

// DELETE /api/photos/:filename — Delete a photo
app.delete('/api/photos/:filename', (req, res) => {
  const file = path.join(PHOTOS_DIR, path.basename(req.params.filename))
  if (fs.existsSync(file)) fs.unlinkSync(file)
  res.json({ ok: true })
})
```

---

## 🌐 CORS — Cross-Origin Resource Sharing

In development, your frontend runs on `localhost:5173` and backend on `localhost:3001`. By default, browsers block requests between different origins (different ports = different origins). CORS headers allow this:

```javascript
const cors = require('cors')
app.use(cors())  // Allow requests from ANY origin

// Or be specific:
app.use(cors({ origin: 'http://localhost:5173' }))
```

---

## 🏗️ Serving Frontend from Backend (Production)

In production on Render, we don't run Vite. Instead, we pre-build the React app into static files and serve them from Express:

```javascript
// After building: client/dist/ contains index.html, main.js, etc.

// Serve all static files (JS, CSS, images)
const clientDist = path.join(__dirname, '../client/dist')
app.use(express.static(clientDist))

// For React Router — any unknown URL serves index.html
// (React handles routing client-side)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})
```

This is called a **monolithic deployment** — one server handles everything.

---

## 💾 File System — Saving State

Node.js has a built-in `fs` module for reading/writing files:

```javascript
const fs = require('fs')

// Synchronous (blocking — only for startup/shutdown)
const data = fs.readFileSync('data.json', 'utf8')
const parsed = JSON.parse(data)

fs.writeFileSync('data.json', JSON.stringify(parsed, null, 2))

// Async (non-blocking — for production use)
fs.readFile('data.json', 'utf8', (err, data) => {
  if (err) console.error(err)
  else console.log(JSON.parse(data))
})
```

In our project — saving game state:
```javascript
const STATE_FILE = path.join(__dirname, 'data/globalState.json')

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(globalState, null, 2))
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8')
      globalState = { ...defaultState, ...JSON.parse(data) }
      console.log('[+] Loaded saved global state')
    }
  } catch (e) {
    console.log('[!] Fresh state')
  }
}

// Load on startup
loadState()

// Save whenever game state changes
socket.on('action', ({ type, payload }) => {
  // ... update globalState ...
  saveState()  // Persist immediately
})
```

---

## 🔗 How Socket.io and Express Share the Server

Socket.io needs to attach to the same HTTP server as Express:

```javascript
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()                    // Express app
const server = http.createServer(app)    // HTTP server wrapping Express
const io = new Server(server, {          // Socket.io attaches to HTTP server
  cors: { origin: '*' }
})

// Now both HTTP routes and WebSocket connections go through 'server'
app.get('/api/status', (req, res) => res.json({ status: 'ok' }))
io.on('connection', (socket) => { /* WebSocket logic */ })

server.listen(3001)  // Start ONE server that handles BOTH
```

---

## ✅ Chapter 05 Summary

| Concept | Key Point |
|---|---|
| **Node.js** | Run JavaScript on the server, non-blocking I/O |
| **Express** | Routing framework: app.get(), app.post(), middleware |
| **REST API** | HTTP endpoints for photos (GET, POST, DELETE) |
| **CORS** | Allow browser to call different-origin server |
| **fs module** | Read/write files (save game state, photos) |
| **Static serving** | `express.static()` serves frontend files in production |
| **Shared server** | Express and Socket.io share one `http.createServer()` |

---

> **Next Chapter →** [Chapter 06: Game State — How the Story Progresses](Chapter_06_GameState_Logic.md)

---
---

# Chapter 06 — Game State: How the Story Progresses

> **Goal:** Understand what "game state" means, how the wedding journey (from college to final ceremony) is tracked as a state machine, and how state persists across server restarts.

---

## 🎯 What is Game State?

Game state is **all the data that describes the current situation** of the game. In our game:

```javascript
let globalState = {
  // Which stage of the wedding are we at? (0-10)
  weddingStage: 0,

  // Proposal in the park
  proposalStatus: 'none',   // 'none' | 'active' | 'accepted' | 'completed'
  pandaHasRing: false,      // Has panda picked up the ring?

  // Engagement ring exchange in hall
  engagementStatus: 'none', // 'none' | 'panda_give' | 'penguin_turn' | 'penguin_give' | 'done'
  pandaHasSecondRing: false,
  penguinHasSecondRing: false,

  // Bot NPCs for park scene
  botState: 'idle',         // 'idle' | 'performing' | 'done'
}
```

---

## 🗺️ The Game Journey — A State Machine

Our game follows a linear story:

```
[START] → MDU Campus (Main Hub)
              │
              ▼ (both players enter park gate)
           Park 🌸
           - Coffee bot serves
           - Band bot performs
           - Panda picks up ring
           - Panda proposes → Penguin accepts
              │
              ▼ (both players exit park)
           MDU Campus again
              │
              ▼ (both players enter hall gate)
           Engagement Hall 💍
           - Panda gives ring to Penguin
           - Penguin gives ring to Panda
           - engagementStatus = 'done'
              │
              ▼ (both players exit hall)
           MDU Campus again
              │
              ▼ (both players enter house gate)
           Wedding House 🏛️
           - Panda & Penguin stand at Mandap
           - Pujari starts ceremony dialogue
           - 7 Pheras (wedding circles)
           - weddingStage goes: 1 → 2 → 3 → ... → 10
              │
              ▼ (weddingStage === 10)
           [END] Wedding Ending Screen 🎊
           - Story animation plays
           - Certificate appears
           - Photo gallery
           - Music player
```

---

## 🤖 State Machine Pattern

A **state machine** is a concept where a system is always in exactly ONE state, and transitions between states happen on specific events.

```javascript
// Our weddingStage is a state machine: 0 → 1 → 2 → ... → 10

// server/index.js
socket.on('action', ({ type, payload }) => {
  if (type === 'wedding_action') {
    const { stage } = payload

    // Validate: can only go FORWARD (prevent cheating/bugs)
    if (stage > globalState.weddingStage) {
      globalState.weddingStage = stage
      saveState()
      io.emit('room_state', getRoomState())
    }
  }
})
```

What each weddingStage means:
```
Stage 0: Before ceremony (players just entered house)
Stage 1: Pujari starts welcome dialogue
Stage 2: First phere begins
Stage 3: Jaimala (garland exchange) ← flower rain effect
Stage 4: Second garland exchange
Stage 5: Sindoor ceremony
Stage 6: Mangalsutra ceremony
Stage 7: Pheras complete (7 circles done)
Stage 8: Blessings
Stage 9: Almost done
Stage 10: MARRIED! → Switch to WeddingEnding screen
```

---

## 💾 Persistence — Surviving Server Restarts

Without persistence, every server restart would reset the wedding to Stage 0. We save state to a JSON file:

```javascript
// Save after every change
function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(globalState, null, 2))
}

// Load on startup  
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
      globalState = { ...defaultGlobalState, ...saved }
    }
  } catch (e) { /* use defaults */ }
}
loadState()  // Called immediately when server starts
```

The `globalState.json` file looks like:
```json
{
  "weddingStage": 5,
  "proposalStatus": "completed",
  "pandaHasRing": true,
  "engagementStatus": "done",
  "botState": "done"
}
```

---

## 🔄 How State Flows to the Client

```
1. Server has globalState (in memory + on disk)
2. Any change → saveState() + io.emit('room_state', getRoomState())
3. Client's App.jsx receives room_state → setGlobalState(state)
4. React re-renders everything that depends on globalState
5. Different weddingStage → different UI/3D elements show up
```

For example:
```jsx
// In Game.jsx — show fireworks when engagement is done
{globalState.engagementStatus === 'done' && myPhase === 'hall' && (
  <group position={[0, 5, -8]}>
    <Fireworks />
    <FlowerRain />
  </group>
)}

// When wedding is fully complete → hide 3D canvas, show ending
<Canvas style={{ display: globalState.weddingStage >= 10 ? 'none' : 'block' }}>
```

---

## ✅ Chapter 06 Summary

| Concept | Key Point |
|---|---|
| **Game State** | All data describing current game situation |
| **State Machine** | System always in one state, transitions on events |
| **weddingStage** | 0-10 linear progression through wedding ceremony |
| **Persistence** | JSON file saved on disk survives server restarts |
| **Event-driven** | Actions → server validates → updates state → broadcasts |

---

> **Next Chapter →** [Chapter 07: Player Movement — Physics & Controls](Chapter_07_PlayerMovement.md)

---
---

# Chapter 07 — Player Movement: Physics & Controls

> **Goal:** Understand how keyboard input, joystick input, camera-relative movement, and boundary physics are implemented in a real-time 3D game.

---

## 🕹️ Reading Input

### Keyboard:
```javascript
const keysRef = useRef({ w: false, a: false, s: false, d: false })

// Listen on the browser window
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase()
  if (k in keysRef.current) keysRef.current[k] = true
})

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase()
  if (k in keysRef.current) keysRef.current[k] = false
})
```

### Joystick (mobile):
The `react-joystick-component` library provides a virtual joystick. Its output is a value between -1 and 1 on each axis:
```javascript
// joystickRef.current = { x: 0.7, y: -0.3 }  (e.g., moving right and slightly up)

const joy = joystickRef?.current ?? { x: 0, y: 0 }
if (Math.abs(joy.x) > 0.1) ix += joy.x  // Add joystick horizontal input
if (Math.abs(joy.y) > 0.1) iz += joy.y  // Add joystick vertical input
```

---

## 📐 Camera-Relative Movement

The tricky part: "forward" should mean WHERE THE CAMERA IS LOOKING, not always the same direction in the world. This is how every 3D game works.

```javascript
// Get the direction the camera is currently pointing
const camFwd = new THREE.Vector3()
camera.getWorldDirection(camFwd)  // fills camFwd with camera's forward vector
camFwd.y = 0           // Ignore vertical (we don't want to fly up/down)
camFwd.normalize()     // Make it length = 1 (direction only, not speed)

// Calculate the right direction from the forward direction
const camRight = new THREE.Vector3(-camFwd.z, 0, camFwd.x)
// (perpendicular to forward on the horizontal plane)

// Combine screen input with camera direction
let ix = 0, iz = 0
if (keys.a) ix -= 1   // left
if (keys.d) ix += 1   // right
if (keys.w) iz -= 1   // forward
if (keys.s) iz += 1   // backward

// Apply camera-relative direction
mx = camFwd.x * (-iz) + camRight.x * ix   // world X movement
mz = camFwd.z * (-iz) + camRight.z * ix   // world Z movement

// Normalize to prevent diagonal movement being faster
const len = Math.sqrt(mx * mx + mz * mz)
if (len > 0.001) { mx /= len; mz /= len }
```

---

## 🏃 Applying Movement with Delta Time

```javascript
const SPEED = 2.8  // units per second

useFrame((_, delta) => {
  // delta = time since last frame (usually ~0.016 for 60fps)
  
  // Without delta time: speed varies based on frame rate!
  // posRef.current.x += mx * SPEED  // BAD: faster on 120fps, slower on 30fps

  // With delta time: always the same speed regardless of frame rate
  posRef.current.x += mx * SPEED * delta  // GOOD: 2.8 units/second always
  posRef.current.z += mz * SPEED * delta
})
```

---

## 🧱 Boundaries — Keeping Players Inside Maps

Different maps have different sized boundaries:

```javascript
// Determine boundaries based on current map
let bMinX = -6, bMaxX = 40, bMinZ = -10, bMaxZ = 10  // MDU defaults

if (window.gamePhase === 'house') {
  bMinX = -14.5; bMaxX = 14.5; bMinZ = -14.5; bMaxZ = 18.5
} else if (window.gamePhase === 'hall') {
  bMinX = -14.5; bMaxX = 14.5; bMinZ = -14.5; bMaxZ = 14.5
} else if (window.gamePhase === 'park') {
  bMinX = -14.5; bMaxX = 14.5; bMinZ = -14.5; bMaxZ = 14.5
}

// Clamp position within boundaries
posRef.current.x = Math.max(bMinX, Math.min(bMaxX, posRef.current.x + mx * SPEED * delta))
posRef.current.z = Math.max(bMinZ, Math.min(bMaxZ, posRef.current.z + mz * SPEED * delta))
```

`Math.max(min, Math.min(max, value))` is the standard "clamp" pattern.

---

## 🔄 Character Rotation

The character should face the direction it's moving:

```javascript
// Calculate the target rotation angle from movement direction
const targetRot = Math.atan2(mx, mz)  // angle in radians

// Smoothly rotate towards target (lerp-like)
let diff = targetRot - rotRef.current
while (diff > Math.PI) diff -= 2 * Math.PI   // Normalize to [-PI, PI]
while (diff < -Math.PI) diff += 2 * Math.PI
rotRef.current += diff * Math.min(1, 12 * delta)  // Smooth turn

meshRef.current.rotation.y = rotRef.current
```

---

## 📊 Why Refs Instead of State for Position

This is a very common interview question!

```javascript
// ❌ Wrong approach: using useState for position
const [position, setPosition] = useState({ x: 0, z: 0 })

// In useFrame (60fps):
setPosition({ x: pos.x + dx, z: pos.z + dz })
// → React re-renders 60 times per second!
// → Extremely slow, will cause major lag

// ✅ Correct approach: using useRef for position
const posRef = useRef(new THREE.Vector3(0, 0, 0))

// In useFrame (60fps):
posRef.current.x += dx  // Just update the value
posRef.current.z += dz  // No re-render triggered
// → Fast! Three.js reads from ref directly
```

---

## ✅ Chapter 07 Summary

| Concept | Key Point |
|---|---|
| **Keyboard input** | keydown/keyup events → ref tracking |
| **Camera-relative movement** | camera.getWorldDirection() for true "forward" |
| **Delta time** | Multiply by delta → same speed regardless of FPS |
| **Boundary clamping** | Math.max(min, Math.min(max, value)) |
| **useRef for position** | No re-renders → smooth 60fps movement |
| **atan2** | Converts (dx, dz) movement vector to rotation angle |

---

> **Next Chapter →** [Chapter 08-16 in separate files - ask for the next chapter!]
