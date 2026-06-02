# Chapter 03 — Living in 3D: React Three Fiber & Three.js

> **Goal:** Understand how 3D graphics work in the browser, how Three.js makes it easy, and how React Three Fiber lets us write 3D scenes as React components.

---

## 🖥️ How Does 3D Work in a Browser?

Browsers can draw 3D graphics using a technology called **WebGL**. WebGL talks directly to your computer's GPU (Graphics Processing Unit) — the chip that powers video games and graphics.

But WebGL is extremely low-level. Writing raw WebGL is like writing Assembly code — painful. That's where **Three.js** comes in.

```
Your Code (React Three Fiber)
      ↓
   Three.js  ← "High-level 3D library"
      ↓
  WebGL API  ← "Low-level browser graphics API"
      ↓
    GPU       ← "Hardware that draws pixels"
      ↓
  Screen Pixels
```

---

## 🎬 The Three.js Scene — 3 Core Concepts

Every 3D scene in Three.js has 3 fundamental things:

### 1. Scene
The "world" container. Everything goes into the scene.
```javascript
const scene = new THREE.Scene()
```

### 2. Camera
The "eye" that looks at the scene. The most common is `PerspectiveCamera` which mimics how our eyes see (objects farther away look smaller).
```javascript
const camera = new THREE.PerspectiveCamera(
  75,           // Field of view (degrees) — like zoom level
  width/height, // Aspect ratio (usually window width / height)
  0.1,          // Near clipping plane — don't render closer than this
  1000          // Far clipping plane — don't render farther than this
)
camera.position.set(0, 10, 20)  // Position the camera in the world
```

### 3. Renderer
The "painter" that draws the scene from the camera's perspective to a `<canvas>` element.
```javascript
const renderer = new THREE.WebGLRenderer({ canvas: myCanvas })
renderer.render(scene, camera)  // Take a "photo" of the scene
```

---

## 📦 The Mesh — The Core 3D Object

Every visible object in 3D is a **Mesh**. A Mesh has two parts:

```
Mesh = Geometry + Material
```

- **Geometry** = The shape (the wireframe/skeleton)
- **Material** = The surface (color, texture, shininess)

```javascript
// Three.js way (manual)
const geometry = new THREE.BoxGeometry(2, 2, 2)  // A cube: 2x2x2 units
const material = new THREE.MeshStandardMaterial({ color: '#ff6347' })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)
```

### With React Three Fiber (our project's way):
```jsx
// React Three Fiber turns Three.js objects into JSX components!
function MyCube() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#ff6347" />
    </mesh>
  )
}
```

Notice how `args={[2, 2, 2]}` maps to the constructor arguments `new THREE.BoxGeometry(2, 2, 2)`. Every Three.js class becomes a lowercase JSX tag in React Three Fiber!

---

## 🎭 Types of Geometries Used in Our Project

```jsx
// Box (used for walls, floors, doors, furniture)
<boxGeometry args={[width, height, depth]} />

// Cylinder (used for tree trunks, pillars, candles)
<cylinderGeometry args={[topRadius, bottomRadius, height, segments]} />

// Sphere (used for tree foliage, fire effects, ring gems)
<sphereGeometry args={[radius, widthSegments, heightSegments]} />

// Plane (used for ground, water surfaces)
<planeGeometry args={[width, height]} />

// Circle (used for pond ripples, decorative rings)
<circleGeometry args={[radius, segments]} />

// Dodecahedron (12-sided shape — used for cherry blossom foliage)
<dodecahedronGeometry args={[radius, detail]} />

// Torus (donut shape — used for rings!)
<torusGeometry args={[radius, tube, radialSegments, tubularSegments]} />
```

---

## 🎨 Types of Materials Used in Our Project

```jsx
// MeshStandardMaterial — Reacts to lights (most realistic)
<meshStandardMaterial 
  color="#ff6347"       // Base color
  roughness={0.5}       // 0=mirror, 1=chalk
  metalness={0.8}       // 0=plastic, 1=metal
  emissive="#ffaa00"    // Color it glows (no light needed)
  emissiveIntensity={0.5}
/>

// MeshBasicMaterial — Does NOT react to lights (always same brightness)
<meshBasicMaterial color="#ffffff" />

// Both can be transparent
<meshStandardMaterial 
  color="#87CEEB" 
  transparent 
  opacity={0.4}  // 0=invisible, 1=solid
/>
```

---

## 💡 Lighting — Making Things Visible

Without lights, MeshStandardMaterial objects are completely black (just like in real life without light).

```jsx
// Ambient Light — lights everything equally from all directions (no shadows)
<ambientLight intensity={0.4} />

// Directional Light — like the sun, parallel rays, can cast shadows
<directionalLight 
  position={[10, 20, 10]} 
  intensity={1.5} 
  castShadow  // enable shadow casting
/>

// Point Light — like a light bulb, radiates in all directions
<pointLight position={[0, 5, 0]} intensity={2} color="#ff6600" />

// Spot Light — like a stage spotlight
<spotLight position={[0, 10, 0]} angle={0.3} />
```

### In our House map (wedding ceremony):
```jsx
// Warm candlelit atmosphere
<ambientLight intensity={0.5} color="#fff3e0" />
<pointLight position={[0, 8, -8]} color="#ffcc44" intensity={3} />
<pointLight position={[-5, 4, -8]} color="#ff8800" intensity={1} />
```

---

## 🎬 The Canvas — Where It All Goes

React Three Fiber gives us a `<Canvas>` component that replaces all the manual Three.js setup:

```jsx
import { Canvas } from '@react-three/fiber'

function App() {
  return (
    <Canvas
      shadows                                    // Enable shadow rendering
      camera={{ position: [0, 14, 18], fov: 55 }} // Initial camera setup
      gl={{ antialias: true }}                   // Anti-aliasing (smoother edges)
    >
      {/* Everything inside Canvas is a 3D scene */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} castShadow />
      
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  )
}
```

---

## 🔄 useFrame — The Game Loop (Most Important!)

Every game runs a "game loop" — code that runs 60 times per second to update positions and render the next frame.

In React Three Fiber, `useFrame` is that game loop:

```jsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

function RotatingCube() {
  const meshRef = useRef()
  
  // This runs ~60 times per second
  useFrame((state, delta) => {
    // state.clock.elapsedTime → seconds since start
    // delta → time since last frame (usually ~0.016 seconds for 60fps)
    
    meshRef.current.rotation.y += delta * 2  // rotate 2 radians per second
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.3
  })
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}
```

### In our project — useFrame powers everything:
```jsx
// Player movement (usePlayerMovement.js)
useFrame((_, delta) => {
  // Read keyboard input
  // Calculate new position
  // Apply boundaries
  // Update mesh position
  // Send position to server via socket
})

// Animations (trees swaying, fire flickering, pujari walking)
useFrame((state) => {
  meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
})
```

---

## 📍 Positions, Rotations, and Scale

Every 3D object has a position, rotation, and scale in 3D space:

```jsx
<mesh
  position={[x, y, z]}      // Where it is (right/up/forward)
  rotation={[x, y, z]}      // Rotation in radians around each axis
  scale={[x, y, z]}         // Size multiplier (1 = normal, 2 = double)
  castShadow                  // This object casts a shadow
  receiveShadow               // This object receives shadows
>
```

### Understanding Axes:
```
Y axis = UP/DOWN
X axis = LEFT/RIGHT
Z axis = FORWARD/BACKWARD (towards you = positive Z)

[0, 0, 0] = center of the world
[5, 0, 0] = 5 units to the right
[0, 3, 0] = 3 units up
[0, 0, 5] = 5 units towards you
```

### Rotation is in radians, not degrees:
```javascript
Math.PI       = 180°   // half circle
Math.PI / 2   = 90°    // quarter turn
Math.PI * 2   = 360°   // full circle
-Math.PI / 2  = -90°   // quarter turn other way
```

---

## 🌲 Groups — Grouping Objects Together

`<group>` lets you group multiple meshes and move them together:

```jsx
// This is how the Cherry Blossom Tree works!
function CherryBlossomTree({ position }) {
  return (
    <group position={position}>  {/* Move the whole tree at once */}
      
      {/* Trunk */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.25, 0.4, 6, 6]} />
        <meshStandardMaterial color="#4a3b2c" />
      </mesh>
      
      {/* Main foliage blob */}
      <mesh position={[0, 6.5, 0]}>
        <dodecahedronGeometry args={[2.5, 1]} />
        <meshStandardMaterial color="#fbcfe8" />
      </mesh>
      
      {/* Side foliage blobs */}
      <mesh position={[1.2, 7.5, -0.8]}>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#f9a8d4" />
      </mesh>
      
    </group>
  )
}

// Now place multiple trees anywhere!
<CherryBlossomTree position={[-10, 0, 5]} />
<CherryBlossomTree position={[10, 0, -3]} />
```

---

## 🔡 Text in 3D — @react-three/drei

The `drei` library provides useful pre-built 3D components. One of the most used is `<Text>` for 3D floating text:

```jsx
import { Text } from '@react-three/drei'

<Text
  position={[0, 7.5, 18.4]}      // Where in 3D space
  rotation={[0, Math.PI, 0]}     // Rotation (Math.PI = facing towards viewer)
  fontSize={1.2}                  // Size in 3D units
  color="#fbbf24"                 // Text color
  outlineWidth={0.05}             // Outline thickness
  outlineColor="#991b1b"          // Outline color
  fontWeight="bold"
>
  EXIT
</Text>
```

---

## ✨ Sparkles & Particles

`<Sparkles>` from drei adds beautiful particle effects:

```jsx
import { Sparkles } from '@react-three/drei'

<Sparkles
  count={80}          // Number of particles
  scale={6}           // Area size
  size={2}            // Particle size
  speed={0.4}         // Animation speed
  color="#ffd700"     // Gold sparkles
/>
```

---

## 🏗️ How HouseMap is Built

The entire wedding house is built from primitive shapes:

```jsx
function HouseMap() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 35]} />
        <meshStandardMaterial color="#f5e6d3" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 5, -17.5]} castShadow>
        <boxGeometry args={[30, 10, 0.5]} />
        <meshStandardMaterial color="#c8a882" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-15, 5, 0]} castShadow>
        <boxGeometry args={[0.5, 10, 35]} />
        <meshStandardMaterial color="#c8a882" />
      </mesh>

      {/* Mandap (wedding stage) at center back */}
      <Mandap position={[0, 0, -8]} />

      {/* Family chairs */}
      {/* Cherry blossom trees at corners */}
      {/* Lighting */}
    </group>
  )
}
```

---

## ✅ Chapter 03 Summary

| Concept | Key Point |
|---|---|
| **WebGL** | Browser API that talks to the GPU for 3D rendering |
| **Three.js** | High-level 3D library that wraps WebGL |
| **React Three Fiber** | Write Three.js as React components |
| **Mesh** | Every visible object = Geometry (shape) + Material (surface) |
| **useFrame** | Runs 60x/sec — powers movement, animation, game logic |
| **group** | Groups multiple meshes to move them together |
| **Position** | [x, y, z] — right, up, forward |
| **Rotation** | In radians — Math.PI = 180° |
| **Lighting** | MeshStandardMaterial is black without lights |

---

> **Next Chapter →** [Chapter 04: Real-Time Multiplayer — Socket.io & WebSockets](Chapter_04_SocketIO_Realtime.md)
