# Chapter 01 — The Big Picture: What Did We Build?

> **Goal of this chapter:** Understand the full project at a high level — what it is, how it works, and why it's impressive — before we dive into code.

---

## 🎯 What Is PenguPanda?

PenguPanda is a **real-time multiplayer 3D wedding game** built entirely for the web browser. Two players (Panda 🐼 and Penguin 🐧) join from different devices, walk around a 3D world together, go through different maps (a college, a park, an engagement hall, a wedding house), perform a full wedding ceremony, and receive a downloadable certificate at the end.

Think of it like **a mini Roblox game** — but built completely from scratch using web technologies, without any game engine like Unity or Unreal.

---

## 🏗️ System Architecture — The Full Picture

Here is exactly how all the pieces connect:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Device 1 - Panda)               │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  React App   │    │  Three.js    │    │  WebRTC (Voice)  │   │
│  │  (UI/Logic)  │───▶│  (3D World)  │    │  Peer Connection │   │
│  └──────┬───────┘    └──────────────┘    └────────┬─────────┘   │
│         │ Socket.io                                │ P2P Audio   │
└─────────┼───────────────────────────────────────── ┼────────────┘
          │ WebSocket                                │
          ▼                                         │ (Direct P2P)
┌─────────────────────┐                            │
│   NODE.JS SERVER    │◀───────────────────────────┘
│   (Express)         │  (Signaling only - helps
│                     │   WebRTC find each other)
│  ┌───────────────┐  │
│  │  Socket.io    │  │
│  │  (Game Logic) │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  REST API     │  │
│  │  (Photos,     │  │
│  │   Status)     │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  File System  │  │
│  │  globalState  │  │
│  │  .json        │  │
│  └───────────────┘  │
└─────────────────────┘
          │
          │ WebSocket
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Device 2 - Penguin)             │
│  (Same React + Three.js app, different player character)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧱 The Tech Stack — Named & Explained

| Technology | Category | What it does in this project |
|---|---|---|
| **React** | Frontend Framework | Builds all the UI components (Join screen, HUD, chat box, modals) |
| **Vite** | Build Tool | Compiles and bundles React code for the browser |
| **Three.js** | 3D Engine | Renders the 3D world, characters, lights, particles |
| **React Three Fiber** | 3D + React Bridge | Lets us write Three.js code using React components |
| **React Three Drei** | 3D Helpers | Pre-built 3D components like `<Text>`, `<Sparkles>`, `<OrbitControls>` |
| **Socket.io (Client)** | Realtime Networking | Connects each browser to the server over WebSocket |
| **Node.js** | Backend Runtime | Runs the server-side JavaScript code |
| **Express** | Backend Framework | Handles HTTP routes (photo upload, status API) |
| **Socket.io (Server)** | Realtime Networking | Manages all connected players, syncs game state |
| **WebRTC** | Voice Chat | Direct browser-to-browser audio (no server needed) |
| **html2canvas** | Screenshot Tool | Captures the certificate HTML as a downloadable PNG image |
| **Render** | Hosting/Deployment | Cloud platform to run the game live on the internet |

---

## 🔄 The Flow of a Single Game Session

Let's trace exactly what happens from start to finish:

```
1. Player opens the URL in browser
   └── React app loads (Vite served the compiled JS/HTML)

2. Player enters their name + selects Panda or Penguin
   └── Socket.io connects to Node.js server
   └── Server registers the player in the "room"

3. When BOTH players are connected:
   └── Server broadcasts "room is ready"
   └── Both browsers switch from "Join Screen" to "Game Screen"
   └── Three.js canvas renders the 3D world

4. Players move around
   └── usePlayerMovement hook reads keyboard/joystick input
   └── Every 50ms, position is sent to server via socket.emit('move')
   └── Server broadcasts that position to the other player
   └── Other player's browser renders the remote character at new position

5. Players enter special zones (park, hall, house)
   └── Player walks near an exit gate → action prompt appears
   └── Player clicks the button → socket.emit('action', {type:'set_phase', ...})
   └── Server updates globalState and broadcasts new state
   └── Both clients switch maps

6. Wedding ceremony happens
   └── Each ceremony action is an 'action' event sent to server
   └── Server tracks weddingStage (0 → 10)
   └── Server saves state to globalState.json (persistence)

7. Wedding completes (stage 10)
   └── Server emits final state
   └── React shows WeddingEnding component
   └── Story animation plays, then certificate appears

8. Download certificate
   └── html2canvas screenshots the HTML element
   └── Saved as PNG to the user's computer
```

---

## 🌟 Why Is This Impressive for Interviews?

Most React projects are "make a todo list" or "show some API data". This project demonstrates:

### 1. **Real-time Systems Architecture**
You understand that HTTP (request-response) is not enough for live games. You chose WebSockets (Socket.io) because they maintain a persistent two-way connection — just like WhatsApp or online chess.

### 2. **3D Graphics in the Browser**
You understand that browsers can render 3D using WebGL (the standard). You used Three.js (the most popular 3D library) and React Three Fiber (which bridges 3D with React's component model). This is rare and impressive.

### 3. **State Management at Scale**
You had to synchronize state between two different computers in real time. This is much harder than local state in a single-user app.

### 4. **WebRTC (Peer-to-Peer Technology)**
This is the same technology behind Google Meet and Zoom. You implemented it from scratch for voice chat — including ICE negotiation, SDP exchange, and audio streams.

### 5. **Full-Stack Ownership**
You own the entire stack: React frontend, Node.js backend, REST API, WebSocket server, file system, and cloud deployment.

---

## 📁 Project Folder Structure

```
weddinggame/
│
├── client/                  ← Everything the browser sees
│   ├── public/              ← Static files (music MP3s, etc.)
│   └── src/
│       ├── App.jsx          ← Root component, routing between screens
│       ├── components/      ← All React + 3D components
│       │   ├── Game.jsx     ← Main game screen (HUD, controls, 3D canvas)
│       │   ├── CozyMap.jsx  ← Main hub 3D world
│       │   ├── ParkMap.jsx  ← Park 3D world
│       │   ├── HallMap.jsx  ← Engagement hall 3D world
│       │   ├── HouseMap.jsx ← Wedding house 3D world
│       │   ├── Player.jsx   ← Your character (controlled by you)
│       │   ├── WeddingEnding.jsx ← Final certificate screen
│       │   └── ...
│       └── hooks/
│           ├── useSocket.js         ← Manages WebSocket connection
│           └── usePlayerMovement.js ← Keyboard/joystick movement logic
│
├── server/                  ← The backend (Node.js)
│   ├── index.js             ← Express + Socket.io server (main file)
│   ├── data/
│   │   ├── globalState.json ← Saved game progress
│   │   └── photos/          ← Saved in-game photos
│   └── package.json
│
└── package.json             ← Root package.json for deployment (build + start)
```

---

## ✅ Chapter 01 Summary

| Concept | Key Point |
|---|---|
| **Architecture** | Frontend (React/3D) + Backend (Node.js) connected by WebSocket |
| **Why WebSocket?** | HTTP can't push data to browser — WebSocket is always-on |
| **Why Three.js?** | Browsers render 3D using WebGL, Three.js makes it easy |
| **Why Socket.io?** | Makes WebSockets reliable with auto-reconnect and fallbacks |
| **Game State** | One source of truth on the server, broadcast to all clients |

---

> **Next Chapter →** [Chapter 02: Frontend Foundation — React & Vite](Chapter_02_React_Vite.md)
