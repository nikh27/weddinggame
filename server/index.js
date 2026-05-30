const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' })); // for base64 photo uploads

// ── Storage Setup for Render Persistent Disk ─────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

// Serve photos as static files
app.use('/photos', express.static(PHOTOS_DIR));

// Upload a photo (base64 JPEG from client)
app.post('/api/photos', (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'no data' });

  try {
    const base64 = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const filename = `memory_${Date.now()}.jpg`;
    fs.writeFileSync(path.join(PHOTOS_DIR, filename), buffer);
    console.log(`[📷] Saved photo: ${filename}`);
    res.json({ ok: true, filename, url: `/photos/${filename}` });
  } catch (e) {
    console.error('[Photo] Error:', e);
    res.status(500).json({ error: 'save failed' });
  }
});

// List all saved photos
app.get('/api/photos', (req, res) => {
  try {
    const files = fs.readdirSync(PHOTOS_DIR)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
      .sort()
      .reverse(); // newest first
    res.json(files.map(f => ({ filename: f, url: `/photos/${f}` })));
  } catch (e) {
    res.json([]);
  }
});

// Delete a photo
app.delete('/api/photos/:filename', (req, res) => {
  const file = path.join(PHOTOS_DIR, path.basename(req.params.filename));
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

// ── Socket.IO Server ───────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const WEDDING_CODE = 'kiss';

const room = {
  panda: null,
  penguin: null,
};

const registry = new Map();

function getCharBySocket(socketId) {
  if (room.panda?.socketId === socketId) return 'panda';
  if (room.penguin?.socketId === socketId) return 'penguin';
  return null;
}

const STATE_FILE = path.join(DATA_DIR, 'globalState.json');

let globalState = {
  gamePhase: 'mdu',
    pandaHasRing: false,
    proposalStatus: 'none',
    botState: 'idle',
    pandaIsSitting: false,
    penguinIsSitting: false,
    penguinCoffeeSips: 0,
    engagementStatus: 'none',
    penguinHasSecondRing: false,
    pandaHasSecondRing: false,
    weddingStage: 0,
    musicState: { isPlaying: false, songIndex: 0, volume: 0.5 }
  };

if (fs.existsSync(STATE_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    // Restore persistent state but NOT session-specific gamePhase
    // weddingStage, musicState, rings etc. are persistent
    // gamePhase is determined per-session by player actions
    const { gamePhase, ...persistable } = saved;
    globalState = { ...globalState, ...persistable };
    console.log('[+] Loaded saved global state, weddingStage=', globalState.weddingStage);
  } catch (e) {
    console.error('Failed to load globalState.json', e);
  }
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(globalState, null, 2));
}

  function getRoomState() {
    return {
      panda: room.panda ? { ...room.panda } : null,
      penguin: room.penguin ? { ...room.penguin } : null,
      globalState,
    };
  }

  function cleanupRegistry() {
    const now = Date.now();
    for (const [id, val] of registry.entries()) {
      if (val.expiresAt < now) registry.delete(id);
    }
  }

  setInterval(cleanupRegistry, 60000);

  io.on('connection', (socket) => {
    console.log(`[+] ${socket.id}`);
    socket.emit('room_state', getRoomState());

    socket.on('join', ({ code, playerId }) => {
      if (!code || code.toLowerCase().trim() !== WEDDING_CODE) {
        socket.emit('join_error', { message: 'wrong_code' });
        return;
      }

      let assignedChar = null;
      const existing = registry.get(playerId);
      
      // Always restore the same character from registry (prevents swap on reconnect)
      if (existing && existing.expiresAt > Date.now()) {
        const prev = existing.character;
        // If that slot is taken by someone else, kick the imposter out
        if (room[prev] && room[prev].playerId !== playerId) {
          console.log(`[KICK] Imposter in ${prev} slot, kicking to restore ${playerId}`);
          room[prev] = null;
        }
        assignedChar = prev;
        console.log(`[RESTORE] ${playerId} → ${assignedChar}`);
      }

      if (!assignedChar) {
        if (!room.panda) assignedChar = 'panda';
        else if (!room.penguin) assignedChar = 'penguin';
        else {
          socket.emit('join_error', { message: 'room_full' });
          return;
        }
      }

      const spawnX = assignedChar === 'panda' ? -4 : 4;
      const restored = existing?.character === assignedChar;

      // Determine spawn location based on saved phase in registry
      // Always prefer the registry's last known phase, falling back to globalState.gamePhase
      let spawnPhase = 'mdu';
      let spawnPosX = spawnX;
      let spawnPosZ = 0;

      if (restored && existing.lastPhase) {
        // Restore exactly where they were
        spawnPhase = existing.lastPhase;
        spawnPosX = existing.lastX ?? spawnX;
        spawnPosZ = existing.lastZ ?? 0;
      } else {
        // Fresh join — spawn based on where the global game is
        if (globalState.gamePhase === 'hall') {
          spawnPhase = 'mdu'; // spawn at MDU near hall gate
          spawnPosX = assignedChar === 'panda' ? 23 : 25;
          spawnPosZ = 4;
        } else if (globalState.gamePhase === 'house') {
          spawnPhase = 'mdu'; // spawn at MDU near house gate
          spawnPosX = assignedChar === 'panda' ? 31 : 33;
          spawnPosZ = -4.5;
        }
      }

      room[assignedChar] = {
        socketId: socket.id,
        playerId,
        x: spawnPosX,
        y: 0,
        z: spawnPosZ,
        rotation: assignedChar === 'panda' ? 0.4 : -0.4,
        animation: 'idle',
        phase: spawnPhase,
      };

      registry.set(playerId, {
        character: assignedChar,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 min expiry
        lastX: spawnPosX,
        lastZ: spawnPosZ,
        lastPhase: spawnPhase,
      });

      socket.emit('join_success', { character: assignedChar });
      io.emit('room_state', getRoomState());
      console.log(`[JOIN] ${socket.id} (${playerId}) → ${assignedChar} phase=${spawnPhase}`);
    });

    socket.on('move', ({ x, y, z, rotation, animation }) => {
      const char = getCharBySocket(socket.id);
      if (!char) return;
      room[char] = { ...room[char], x, y, z, rotation, animation };
      const reg = registry.get(room[char].playerId);
      if (reg) { reg.lastX = x; reg.lastZ = z; reg.lastPhase = room[char].phase; }
      socket.broadcast.emit('player_moved', { character: char, x, y, z, rotation, animation, phase: room[char].phase });

      // Auto-advance: if both players near mandap at stage 1, start ceremony
      if (globalState.weddingStage === 1 && room.panda && room.penguin &&
          room.panda.phase === 'house' && room.penguin.phase === 'house') {
        const pandaDist = Math.hypot((room.panda.x || 0) - 0, (room.panda.z || 0) - (-8));
        const penguinDist = Math.hypot((room.penguin.x || 0) - 0, (room.penguin.z || 0) - (-8));
        if (pandaDist < 5 && penguinDist < 5) {
          globalState.weddingStage = 2;
          io.emit('room_state', getRoomState());
        }
      }
    });

    socket.on('chat', ({ message }) => {
      const char = getCharBySocket(socket.id);
      if (!char) return;
      const msg = message.trim().slice(0, 120);
      if (!msg) return;
      io.emit('chat_message', { character: char, message: msg });
    });

    socket.on('emote', ({ emoji }) => {
      const char = getCharBySocket(socket.id);
      if (!char) return;
      io.emit('emote', { character: char, emoji });
    });

    // --- PHASE 2 STORY ACTIONS ---
    socket.on('action', ({ type, payload }) => {
      const char = getCharBySocket(socket.id);
      if (!char) return;
      
      let stateChanged = false;
      
      if (type === 'set_phase') {
        const oldPhase = room[char].phase;
        room[char].phase = payload.phase;
        // Reset player positions on phase change
        if (payload.phase === 'park') {
          room[char].x = char === 'panda' ? -1.5 : 1.5;
          room[char].z = 8;
        } else if (payload.phase === 'hall') {
          room[char].x = char === 'panda' ? -2 : 2;
          room[char].z = 14;
          globalState.gamePhase = 'hall'; // Set global checkpoint!
        } else if (payload.phase === 'house') {
          room[char].x = char === 'panda' ? -2 : 2;
          room[char].z = 0;
          globalState.gamePhase = 'house'; // Set global checkpoint!
        } else {
          if (payload.spawnX !== undefined && payload.spawnZ !== undefined) {
            room[char].x = payload.spawnX;
            room[char].z = payload.spawnZ;
          } else if (oldPhase === 'park') {
            room[char].x = char === 'panda' ? 17 : 19;
            room[char].z = -4.5;
          } else if (oldPhase === 'hall') {
            room[char].x = char === 'panda' ? 23 : 25;
            room[char].z = 4;
          } else if (oldPhase === 'house') {
            room[char].x = char === 'panda' ? 31 : 33;
            room[char].z = -4.5;
          } else {
            room[char].x = char === 'panda' ? -4 : 4;
            room[char].z = 0;
          }
        }
        
        const reg = registry.get(room[char].playerId);
        if (reg) {
          reg.lastPhase = payload.phase;
          reg.lastX = room[char].x;
          reg.lastZ = room[char].z;
          reg.expiresAt = Date.now() + 30 * 60 * 1000; // refresh expiry on phase change
        }
        
        // Reset sitting state if leaving map
        if (char === 'panda') globalState.pandaIsSitting = false;
        if (char === 'penguin') globalState.penguinIsSitting = false;
        
        // Immediately broadcast phase change so other client shows character
        socket.broadcast.emit('player_moved', {
          character: char,
          x: room[char].x, y: room[char].y || 0, z: room[char].z,
          rotation: room[char].rotation || 0,
          animation: 'idle',
          phase: payload.phase
        });
        
        stateChanged = true;
      } else if (type === 'sit') {
        if (char === 'panda') globalState.pandaIsSitting = true;
        if (char === 'penguin') globalState.penguinIsSitting = true;
        
        // Both sitting in the park triggers coffee bot
        if (globalState.pandaIsSitting && globalState.penguinIsSitting && globalState.botState === 'idle') {
          globalState.botState = 'waiting_for_bot'; // Prevent multiple triggers
          // Wait 3 seconds before bot comes out
          setTimeout(() => {
            globalState.botState = 'delivering';
            io.emit('room_state', getRoomState());
            // Bot delivery takes 3 seconds
            setTimeout(() => {
              globalState.botState = 'delivered';
              io.emit('room_state', getRoomState());
            }, 3000);
          }, 3000);
        }
        stateChanged = true;
      } else if (type === 'stand') {
        if (char === 'panda') globalState.pandaIsSitting = false;
        if (char === 'penguin') globalState.penguinIsSitting = false;
        stateChanged = true;
      } else if (type === 'drink_coffee' && char === 'penguin') {
        globalState.penguinCoffeeSips += 1;
        stateChanged = true;
      } else if (type === 'buy_ring' && char === 'panda') {
        globalState.pandaHasRing = true;
        stateChanged = true;
      } else if (type === 'propose' && char === 'panda') {
        globalState.proposalStatus = 'active';
        stateChanged = true;
      } else if (type === 'accept_proposal' && char === 'penguin') {
        globalState.proposalStatus = 'accepted';
        
        // After 3s of celebration, stop the fireworks but let them stay in the park
        setTimeout(() => {
          globalState.proposalStatus = 'completed'; // Keeps ring but stops fireworks
          saveState();
          io.emit('room_state', getRoomState());
        }, 3000);
        
        stateChanged = true;
      }
      // PHASE 3: ENGAGEMENT RING ACTIONS
      else if (type === 'give_ring_panda' && char === 'panda') {
        globalState.engagementStatus = 'panda_give';
        stateChanged = true;
      } else if (type === 'accept_ring_penguin' && char === 'penguin') {
        globalState.penguinHasSecondRing = true;
        globalState.engagementStatus = 'penguin_turn';
        stateChanged = true;
      } else if (type === 'give_ring_penguin' && char === 'penguin') {
        globalState.engagementStatus = 'penguin_give';
        stateChanged = true;
      } else if (type === 'accept_ring_panda' && char === 'panda') {
        globalState.pandaHasSecondRing = true;
        globalState.engagementStatus = 'done';
        stateChanged = true;
      }
      
      // PHASE 4: HOUSE WEDDING
      else if (type === 'wedding_action') {
        if (payload.stage > globalState.weddingStage) {
          globalState.weddingStage = payload.stage;
          stateChanged = true;
        }
      }
      
      // MUSIC CONTROL
      else if (type === 'music_control') {
        if (!globalState.musicState) {
          globalState.musicState = { isPlaying: false, songIndex: 0, volume: 0.5 };
        }
        globalState.musicState = { ...globalState.musicState, ...payload };
        stateChanged = true;
      }

      // RESET GAME (Dev Mode)
      else if (type === 'reset_game') {
        globalState = {
          gamePhase: 'mdu',
          pandaHasRing: false,
          proposalStatus: 'none',
          botState: 'idle',
          pandaIsSitting: false,
          penguinIsSitting: false,
          penguinCoffeeSips: 0,
          engagementStatus: 'none',
          penguinHasSecondRing: false,
          pandaHasSecondRing: false,
          weddingStage: 0,
          musicState: { isPlaying: false, songIndex: 0, volume: 0.5 }
        };
        // Move players back to start
        if (room.panda) { room.panda.phase = 'mdu'; room.panda.x = -4; room.panda.z = 0; }
        if (room.penguin) { room.penguin.phase = 'mdu'; room.penguin.x = 4; room.penguin.z = 0; }
        
        if (fs.existsSync(STATE_FILE)) {
          fs.unlinkSync(STATE_FILE);
        }
        
        io.emit('room_state', getRoomState());
        io.emit('action_event', { type: 'reset_client' });
        return; // Don't save state again below
      }

      if (stateChanged) {
        saveState();
        io.emit('room_state', getRoomState()); // broadcast updated global state
      }
      
      io.emit('action_event', { character: char, type, payload });
    });

    socket.on('webrtc_offer',   ({ offer })     => socket.broadcast.emit('webrtc_offer', { offer }));
    socket.on('webrtc_answer',  ({ answer })    => socket.broadcast.emit('webrtc_answer', { answer }));
    socket.on('webrtc_ice',     ({ candidate }) => socket.broadcast.emit('webrtc_ice', { candidate }));
    socket.on('webrtc_restart', ()             => socket.broadcast.emit('webrtc_restart'));

    socket.on('disconnect', () => {
      const char = getCharBySocket(socket.id);
      if (char) {
        console.log(`[-] ${char} disconnected (${socket.id})`);
        const reg = registry.get(room[char].playerId);
        if (reg) {
          reg.expiresAt = Date.now() + 10 * 60 * 1000;
          reg.lastX = room[char].x;
          reg.lastZ = room[char].z;
          reg.lastPhase = room[char].phase;
        }
        room[char] = null;
        io.emit('room_state', getRoomState());
      }
    });
  });

app.get('/api/status', (req, res) => {
  const photoCount = fs.readdirSync(PHOTOS_DIR).filter(f => f.endsWith('.jpg')).length;
  res.json({
    status: 'ok',
    panda: room.panda ? 'online' : 'offline',
    penguin: room.penguin ? 'online' : 'offline',
    photos: photoCount,
  });
});

// Serve production frontend
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🐼🐧 PenguPanda → http://localhost:${PORT}`);
  console.log(`📷 Photos → http://localhost:${PORT}/api/photos`);
  console.log(`   Code: ${WEDDING_CODE}`);
});
