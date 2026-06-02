# Chapter 02 — Frontend Foundation: React & Vite

> **Goal:** Understand React deeply — components, state, props, hooks — and how Vite makes it all fast. Learn exactly how the PenguPanda frontend is structured.

---

## 🤔 What Problem Does React Solve?

Before React, building an interactive website looked like this:
```javascript
// Old way — manual DOM manipulation
document.getElementById('score').innerText = newScore
document.getElementById('player').style.color = 'red'
// You had to manually track what changed and update it
```

This gets messy fast. React introduced a new idea:

> **"Describe what the UI should look like for a given state. React figures out what changed and updates the DOM automatically."**

```jsx
// React way — declarative
function ScoreBoard({ score, playerColor }) {
  return (
    <div>
      <span style={{ color: playerColor }}>{score}</span>
    </div>
  )
}
// When score changes → React automatically re-renders
```

---

## 🧩 Components — The Building Blocks

Everything in React is a **component**. A component is just a JavaScript function that returns HTML-like code (called JSX).

```jsx
// Simplest possible React component
function Greeting() {
  return <h1>Hello, World!</h1>
}

// Component with props (inputs)
function PlayerCard({ name, emoji, score }) {
  return (
    <div className="card">
      <span>{emoji}</span>
      <h2>{name}</h2>
      <p>Score: {score}</p>
    </div>
  )
}

// Using it
<PlayerCard name="Nikhil" emoji="🐼" score={42} />
```

### In our project, every screen and UI element is a component:
```
App.jsx                    → Decides which screen to show
├── JoinScreen.jsx         → The "enter your name" page
├── Game.jsx               → The main game (HUD + 3D canvas)
│   ├── Player.jsx         → Your character
│   ├── HouseMap.jsx       → The 3D wedding house
│   ├── VoiceChat.jsx      → Voice chat controls
│   └── ...
└── WeddingEnding.jsx      → Final certificate + music
```

---

## 🔄 JSX — HTML Inside JavaScript

JSX looks like HTML but it's JavaScript. Some key differences:

```jsx
// HTML uses class=""  →  JSX uses className=""
<div className="game-wrap">

// HTML uses for=""  →  JSX uses htmlFor=""
<label htmlFor="playerName">

// JavaScript expressions go inside { }
<div>{2 + 2}</div>           // renders: 4
<span>{player.name}</span>   // renders player's name

// Inline styles use objects, not strings
<div style={{ color: 'red', fontSize: '16px' }}>

// Events use camelCase
<button onClick={handleClick}>
```

---

## 🧠 State — Data That Changes Over Time

`useState` is the most important React hook. It holds data that changes, and when it changes, React re-renders the component.

```jsx
import { useState } from 'react'

function Counter() {
  // [currentValue, functionToChangeIt] = useState(initialValue)
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}
```

### In our project, important state variables:
```jsx
// In App.jsx
const [screen, setScreen] = useState('join')    // 'join' | 'game' | 'ending'
const [myCharacter, setMyCharacter] = useState(null)  // 'panda' | 'penguin'
const [globalState, setGlobalState] = useState({})    // full game state from server

// In Game.jsx
const [myPhase, setMyPhase] = useState('mdu')  // which map you're in
const [activePrompt, setActivePrompt] = useState(null)  // action button to show
const [cameraMode, setCameraMode] = useState(false)     // is camera active?
```

---

## ⚡ Effects — Running Code at the Right Time

`useEffect` runs code AFTER the component renders. It's used for:
- Connecting to a server
- Fetching data
- Setting up event listeners

```jsx
import { useEffect } from 'react'

function GameComponent({ socket }) {
  // Runs once when component first appears
  useEffect(() => {
    console.log('Component mounted!')
    
    // Cleanup: runs when component disappears
    return () => {
      console.log('Component unmounted!')
    }
  }, [])  // Empty [] means "run only once"

  // Runs whenever 'socket' changes
  useEffect(() => {
    if (!socket) return
    socket.on('room_state', (data) => {
      console.log('Got new state:', data)
    })
    return () => socket.off('room_state')
  }, [socket])  // [socket] means "re-run if socket changes"
}
```

### In our project, key effects:
```jsx
// In App.jsx — listen for server events when socket is ready
useEffect(() => {
  if (!socket) return
  socket.on('room_state', (state) => setGlobalState(state))
  socket.on('reset_client', () => window.location.reload())
  return () => {
    socket.off('room_state')
    socket.off('reset_client')
  }
}, [socket])
```

---

## 📦 Props — Passing Data Between Components

Props are how parent components talk to child components. They flow **DOWN** only (parent → child).

```jsx
// Parent sends data as props
function App() {
  const [score, setScore] = useState(100)
  return <GameHUD score={score} onReset={() => setScore(0)} />
}

// Child receives data as props
function GameHUD({ score, onReset }) {
  return (
    <div>
      <p>Score: {score}</p>
      <button onClick={onReset}>Reset</button>
    </div>
  )
}
```

### In our project — App.jsx passes lots of props down to Game.jsx:
```jsx
<Game
  socket={socket}           // The WebSocket connection
  myCharacter={myCharacter} // 'panda' or 'penguin'
  globalState={globalState} // The full game state from server
/>
```

---

## 🔗 Refs — Accessing Things Directly

`useRef` holds a value that:
1. Does NOT cause re-renders when it changes
2. Can hold a reference to a real DOM element or 3D object

```jsx
import { useRef } from 'react'

// Example 1: Accessing a DOM element
function TextInput() {
  const inputRef = useRef(null)
  
  const focusIt = () => {
    inputRef.current.focus()  // directly call .focus() on the input
  }
  
  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusIt}>Focus</button>
    </>
  )
}
```

### In our project — Refs are critical for 3D and performance:
```jsx
// usePlayerMovement.js
const posRef = useRef(new THREE.Vector3(0, 0, 0))  // Player position (updates 60fps!)
const meshRef = useRef()  // Direct reference to the 3D character mesh
const rotRef = useRef(0)  // Current rotation angle

// Why use ref instead of state for position?
// → State change = React re-render = SLOW for 60fps animations
// → Ref change = just a value update = FAST for game loops
```

---

## 🪝 Custom Hooks — Reusable Logic

Custom hooks let you extract logic that uses other hooks into a reusable function.

```jsx
// Custom hook: useWindowSize
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  
  return size
}

// Usage in any component
function MyComponent() {
  const { width, height } = useWindowSize()
  return <p>Screen: {width} x {height}</p>
}
```

### In our project — Two important custom hooks:
```
useSocket.js         → Manages the Socket.io connection lifecycle
usePlayerMovement.js → Handles all keyboard/joystick movement + physics
```

---

## ⚡ Vite — The Build Tool

Vite (pronounced "veet") is the tool that takes your React code and makes it work in the browser.

### What Vite does:

```
Your Code (JSX, modern JS)
         ↓
    [Vite Build]
    - Converts JSX → plain JavaScript
    - Bundles 100s of files → a few optimized files
    - Minifies code (removes spaces/comments for smaller file size)
    - Handles imports (CSS, images, fonts)
         ↓
browser-ready HTML + JS + CSS files
```

### Important Vite commands:
```bash
npm run dev      # Start development server (hot reload - page updates as you save)
npm run build    # Create production files in /dist folder
npm run preview  # Preview the production build locally
```

### Vite Dev Server Magic:
When you change a file and save, Vite only re-sends the changed module to the browser (called **HMR - Hot Module Replacement**). The page updates without a full reload in under 50ms. This is why our development workflow is so fast.

---

## 🗂️ How App.jsx Is the Brain

`App.jsx` is the root of the entire frontend. It decides which screen to show based on state:

```jsx
export default function App() {
  const [screen, setScreen] = useState('join')  // 'join' | 'game' | 'ending'
  const socket = useSocket(SERVER_URL)
  const [globalState, setGlobalState] = useState({})
  
  useEffect(() => {
    if (!socket) return
    socket.on('room_state', (state) => {
      setGlobalState(state)
      // If both players are in and game hasn't started → go to game screen
      if (state.panda && state.penguin && screen === 'join') {
        setScreen('game')
      }
      // If wedding is complete → show ending screen
      if (state.weddingStage >= 10) {
        setScreen('ending')
      }
    })
  }, [socket])
  
  // Routing — which screen to render?
  if (screen === 'join') return <JoinScreen socket={socket} />
  if (screen === 'ending') return <WeddingEnding socket={socket} />
  return <Game socket={socket} myCharacter={myCharacter} globalState={globalState} />
}
```

---

## ✅ Chapter 02 Summary

| Concept | Key Point |
|---|---|
| **Component** | A function that returns JSX (HTML-like UI) |
| **State (useState)** | Data that changes → triggers re-render |
| **Effect (useEffect)** | Run code at the right time (mount, update, cleanup) |
| **Props** | Pass data from parent to child |
| **Ref (useRef)** | Direct value/DOM access without re-renders |
| **Custom Hook** | Extract reusable logic that uses other hooks |
| **Vite** | Compiles JSX → browser-ready JavaScript |

---

> **Next Chapter →** [Chapter 03: Living in 3D — React Three Fiber & Three.js](Chapter_03_3D_React_Three_Fiber.md)
