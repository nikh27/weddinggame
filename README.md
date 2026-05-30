# 🐼🐧 Cozy Multiplayer World

A cozy, 3D multiplayer browser game built with React, Three Fiber, and Socket.IO.

## Features
- Enter as either a **Panda** or a **Penguin**.
- Real-time multiplayer synchronization (only one Panda and one Penguin allowed per room).
- Cozy 3D world with procedurally generated characters, moving trees, floating fireflies, and a peaceful environment.
- Live chat system with speech bubbles.
- Emote system (❤️, 👋, 😊, 😂).

---

## 🚀 How to Run the Game Locally

The project consists of a **Server** and a **Client**, which both need to be running in separate terminals.

### Step 1: Start the Backend Server

1. Open a new terminal.
2. Navigate to the `server` folder:
   ```bash
   cd server
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *You should see a message saying:* `🐼🐧 Server running on http://localhost:3001`

### Step 2: Start the Frontend Client

1. Open a **second** new terminal.
2. Navigate to the `client` folder:
   ```bash
   cd client
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```
   *You should see a message with a local URL, usually:* `http://localhost:5173/`

### Step 3: Play the Game

1. Open your web browser and go to `http://localhost:5173/`.
2. Open a **second tab** (or a different browser window) and go to the same URL.
3. In Tab 1, enter a name and join as the **Panda**.
4. In Tab 2, enter a name and join as the **Penguin**.

Have fun exploring the world! Use **WASD** to move around and **Enter** to chat!
