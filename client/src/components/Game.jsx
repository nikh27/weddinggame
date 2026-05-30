import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Player from './Player'
import RemotePlayer from './RemotePlayer'
import ParkMap from './ParkMap'
import { Fireworks, FlowerRain } from './Effects'
import CozyMap from './CozyMap'
import HallMap from './HallMap'
import HouseMap from './HouseMap'
import MusicPlayer from './MusicPlayer'
import ChatUI from './ChatUI'
import EmoteUI from './EmoteUI'
import VoiceChat from './VoiceChat'
import Joystick from './Joystick'
import DPad from './DPad'
import CaptureHelper from './CaptureHelper'
import CamController from './CamController'
import PhotoGallery from './PhotoGallery'
import { playerId } from '../hooks/useSocket'
import { useFrame } from '@react-three/fiber'

function PheraTracker({ stage, myCharacter, myPosRef, remotePlayer, setPherasCompleted, onComplete }) {
  const accumAngle = useRef({ panda: 0, penguin: 0 })
  const prevAngle = useRef({ panda: null, penguin: null })
  const lastCompleted = useRef(0)
  const prevStage = useRef(stage)

  useFrame(() => {
    // Reset tracking when stage changes to 6
    if (prevStage.current !== stage) {
      prevStage.current = stage
      if (stage === 6) {
        accumAngle.current = { panda: 0, penguin: 0 }
        prevAngle.current = { panda: null, penguin: null }
        lastCompleted.current = 0
      }
    }
    if (stage !== 6) return

    const checkPlayer = (char, x, z) => {
      if (x == null || z == null) return
      let angle = Math.atan2(z - (-8), x - 0)
      if (angle < 0) angle += 2 * Math.PI

      if (prevAngle.current[char] !== null) {
        let diff = angle - prevAngle.current[char]
        if (diff > Math.PI) diff -= 2 * Math.PI
        if (diff < -Math.PI) diff += 2 * Math.PI
        accumAngle.current[char] += Math.abs(diff)
      }
      prevAngle.current[char] = angle
    }

    if (myPosRef.current) checkPlayer(myCharacter, myPosRef.current.x, myPosRef.current.z)
    if (remotePlayer) checkPlayer(remotePlayer.character, remotePlayer.x, remotePlayer.z)

    // Count min of both players walking together
    const pandaRounds = Math.floor(accumAngle.current.panda / (2 * Math.PI))
    const penguinRounds = Math.floor(accumAngle.current.penguin / (2 * Math.PI))
    const completed = Math.min(Math.min(pandaRounds, penguinRounds), 7)

    if (completed !== lastCompleted.current) {
      lastCompleted.current = completed
      setPherasCompleted(completed)
      if (completed >= 7) {
        onComplete()
      }
    }
  })

  return null
}

export default function Game({ socket, myCharacter }) {
  const [remotePlayer, setRemotePlayer]   = useState(null)
  const [chatMessages, setChatMessages]   = useState([])
  const [myEmote, setMyEmote]             = useState(null)
  const [remoteEmote, setRemoteEmote]     = useState(null)
  const [chatFocused, setChatFocused]     = useState(false)
  const [speaking, setSpeaking]           = useState({ panda: false, penguin: false })

  const [cameraMode, setCameraMode]       = useState(false)
  const [showGallery, setShowGallery]     = useState(false)
  const [flashAnim, setFlashAnim]         = useState(false)
  const [photoCount, setPhotoCount]       = useState(0)
  const [lastThumb, setLastThumb]         = useState(null)
  const captureRef = useRef(null)

  const joystickRef = useRef({ x: 0, y: 0 })
  const myPosRef = useRef(null) // Holds the local player's Vector3 position
  const hasSpawned = useRef(false)
  const otherChar   = myCharacter === 'panda' ? 'penguin' : 'panda'
  const partnerOnline = remotePlayer !== null
  const isPanda = myCharacter === 'panda'

  const handleSpeakingChange = useCallback(({ who, speaking: val }) => {
    const char = who === 'me' ? myCharacter : otherChar
    setSpeaking(prev => prev[char] === val ? prev : { ...prev, [char]: val })
  }, [myCharacter, otherChar])

  const [globalState, setGlobalState]     = useState({ gamePhase: 'mdu', pandaHasRing: false, proposalStatus: 'none', botState: 'idle', pandaIsSitting: false, penguinIsSitting: false, penguinCoffeeSips: 0 })
  const [myPhase, setMyPhase]             = useState('mdu')
  const [pherasCompleted, setPherasCompleted] = useState(0)

  // Track live phase in a ref (always up to date, used on reconnect)
  const myPhaseRef = useRef('mdu')

  // Re-join on reconnect — restore the phase we were in
  useEffect(() => {
    if (!socket) return
    const onConnect = () => {
      const code = localStorage.getItem('pengupanda_code')
      if (code) {
        socket.emit('join', { code, playerId })
      }
      // Mark that the NEXT room_state should restore position
      hasSpawned.current = false
    }
    socket.on('connect', onConnect)
    return () => socket.off('connect', onConnect)
  }, [socket])

  useEffect(() => {
    if (!socket) return
    const onRoomState = (state) => {
      const other = state[otherChar]
      setRemotePlayer(other ? { character: otherChar, ...other } : null)
      if (state[myCharacter]) {
        const serverPhase = state[myCharacter].phase || 'mdu'
        const serverX = state[myCharacter].x
        const serverZ = state[myCharacter].z

        // Only restore position+phase from server on fresh connect/reconnect
        if (!hasSpawned.current) {
          hasSpawned.current = true

          // If we were already in a non-mdu phase when reconnect happened,
          // the server may have us at mdu (race condition). Use our local phase.
          const targetPhase = myPhaseRef.current !== 'mdu' ? myPhaseRef.current : serverPhase

          setMyPhase(targetPhase)
          window.gamePhase = targetPhase
          myPhaseRef.current = targetPhase

          // Only snap position if the server phase matches what we think we're in
          if (serverPhase === targetPhase && myPosRef.current) {
            if (serverX !== undefined) myPosRef.current.x = serverX
            if (serverZ !== undefined) myPosRef.current.z = serverZ
          }
        }
      }
      if (state.globalState) setGlobalState(state.globalState)
    }
    const onMoved = ({ character, x, y, z, rotation, animation, phase }) => {
      if (character === otherChar) {
        setRemotePlayer(prev =>
          prev
            ? { ...prev, x, y, z, rotation, animation, ...(phase ? { phase } : {}) }
            : { character: otherChar, x, y, z, rotation, animation, phase }
        )
      }
    }
    const onChat = ({ character, message }) =>
      setChatMessages(p => [...p.slice(-60), { character, message, id: Date.now() + Math.random() }])
    const onEmote = ({ character, emoji }) => {
      const setter = character === myCharacter ? setMyEmote : setRemoteEmote
      setter(emoji); setTimeout(() => setter(null), 2800)
    }
    const onActionEvent = ({ type, payload }) => {
      if (type === 'force_teleport') {
        if (myPosRef.current) {
          myPosRef.current.x = myCharacter === 'panda' ? -4 : 4;
          myPosRef.current.z = 0;
        }
      }
    }
    socket.on('room_state', onRoomState)
    socket.on('player_moved', onMoved)
    socket.on('chat_message', onChat)
    socket.on('emote', onEmote)
    socket.on('action_event', onActionEvent)
    return () => {
      socket.off('room_state', onRoomState)
      socket.off('player_moved', onMoved)
      socket.off('chat_message', onChat)
      socket.off('emote', onEmote)
      socket.off('action_event', onActionEvent)
    }
  }, [socket, otherChar, myCharacter])

  const sendChat  = useCallback(msg   => socket?.emit('chat',  { message: msg }), [socket])
  const sendEmote = useCallback(emoji => socket?.emit('emote', { emoji }),        [socket])
  const sendAction = useCallback((type, payload = {}) => {
    socket?.emit('action', { type, payload });
    if (type === 'set_phase' && myPosRef.current) {
      const next = payload.phase
      // Set phase immediately on client — don't wait for server round-trip
      setMyPhase(next)
      window.gamePhase = next
      myPhaseRef.current = next  // keep ref in sync for reconnect
      if (next === 'park') {
        myPosRef.current.x = myCharacter === 'panda' ? -1.5 : 1.5;
        myPosRef.current.z = 8;
      } else if (next === 'hall') {
        myPosRef.current.x = myCharacter === 'panda' ? -2 : 2;
        myPosRef.current.z = 14;
      } else if (next === 'house') {
        myPosRef.current.x = myCharacter === 'panda' ? -2 : 2;
        myPosRef.current.z = 0;
      } else {
        // Returning to MDU — spawn near the gate of where we came from
        if (myPhase === 'park') {
          myPosRef.current.x = myCharacter === 'panda' ? 17 : 19;
          myPosRef.current.z = -4.5;
        } else if (myPhase === 'hall') {
          myPosRef.current.x = myCharacter === 'panda' ? 23 : 25;
          myPosRef.current.z = 4;
        } else if (myPhase === 'house') {
          myPosRef.current.x = myCharacter === 'panda' ? 31 : 33;
          myPosRef.current.z = -4.5;
        } else {
          myPosRef.current.x = myCharacter === 'panda' ? -4 : 4;
          myPosRef.current.z = 0;
        }
      }
    }
  }, [socket, myPhase, myCharacter])

  const handleAction = useCallback((actionDef) => {
    if (!actionDef || !socket) return
    if (actionDef.action === 'set_phase') {
      const next = actionDef.payload.phase
      // Force position locally BEFORE server responds
      if (actionDef.payload.spawnX !== undefined && actionDef.payload.spawnZ !== undefined) {
        myPosRef.current.x = actionDef.payload.spawnX;
        myPosRef.current.z = actionDef.payload.spawnZ;
      } else if (next === 'park') {
        myPosRef.current.x = myCharacter === 'panda' ? -1.5 : 1.5;
        myPosRef.current.z = 8;
      } else if (next === 'hall') {
        myPosRef.current.x = myCharacter === 'panda' ? -2 : 2;
        myPosRef.current.z = 14;
      } else if (next === 'house') {
        myPosRef.current.x = myCharacter === 'panda' ? -2 : 2;
        myPosRef.current.z = 0;
      } else {
        myPosRef.current.x = myCharacter === 'panda' ? -4 : 4;
        myPosRef.current.z = 0;
      }
      setMyPhase(next)
      window.gamePhase = next;
      // Pass the FULL payload (including spawnX/spawnZ) to the server so it spawns in the right place
      socket.emit('action', { type: 'set_phase', payload: actionDef.payload })
    } else if (actionDef.action === 'sit' && myPosRef.current) {
      // Snap to the bench they are closest to
      if (myPosRef.current.x < 0) {
        myPosRef.current.x = -2;
        myPosRef.current.z = -3;
      } else {
        myPosRef.current.x = 2;
        myPosRef.current.z = -3;
      }
      socket.emit('action', { type: 'sit' })
    } else if (actionDef.action === 'wedding_action') {
      if (actionDef.payload.stage === 2 && myPosRef.current) {
        // Snap to Mandap seat
        myPosRef.current.x = myCharacter === 'panda' ? -1.5 : 1.5;
        myPosRef.current.z = -6.5; 
        socket.emit('action', { type: 'sit' });
      } else if (actionDef.payload.stage === 3 && myPosRef.current) {
        // Stand up for Jai Mala
        socket.emit('action', { type: 'stand' });
      } else if (actionDef.payload.stage === 4 && myPosRef.current) {
        // Sit down for Havan
        socket.emit('action', { type: 'sit' });
      } else if (actionDef.payload.stage === 5 && myPosRef.current) {
        // Stand up for Pheras
        socket.emit('action', { type: 'stand' });
      }
      socket.emit('action', { type: 'wedding_action', payload: actionDef.payload });
    } else {
      socket.emit('action', { type: actionDef.action, payload: actionDef.payload })
    }
  }, [socket, myPhase, myCharacter, isPanda])

  // Reset chat focus
  useEffect(() => {
    if (cameraMode) setChatFocused(false)
  }, [cameraMode])

  // Story Action Prompts System
  const [activePrompt, setActivePrompt] = useState(null)
  
  // High-frequency distance checking
  useEffect(() => {
    const interval = setInterval(() => {
      if (!myPosRef.current) return
      const px = myPosRef.current.x
      const pz = myPosRef.current.z

      let prompt = null
      const isSitting = isPanda ? globalState.pandaIsSitting : globalState.penguinIsSitting
      const isPartnerSitting = isPanda ? globalState.penguinIsSitting : globalState.pandaIsSitting

      if (isSitting) {
        if (myPhase === 'park') {
          prompt = { text: 'Stand Up', action: 'stand' }
          // Coffee Drinking (Penguin only)
          if (!isPanda && globalState.botState === 'delivered' && globalState.penguinCoffeeSips < 30) {
            prompt = { text: `☕ Tap to Drink (${globalState.penguinCoffeeSips}/30)`, action: 'drink_coffee' }
          }
        }
      } 
      // Gateway logic (Phase 1)
      else if (myPhase === 'mdu') {
        const distToParkGate = Math.hypot(px - 18, pz - (-6.5))
        const distToHallGate = Math.hypot(px - 24, pz - 8)
        const distToHouseGate = Math.hypot(px - 32, pz - (-8))
        
        if (distToParkGate < 3.5) {
          prompt = { text: 'Enter Park', action: 'set_phase', payload: { phase: 'park' } }
        } else if (distToHallGate < 3.5) {
          prompt = { text: 'Enter Hall', action: 'set_phase', payload: { phase: 'hall' } }
        } else if (distToHouseGate < 3.5) {
          prompt = { text: 'Enter House', action: 'set_phase', payload: { phase: 'house' } }
        }
      } 
      // Park Logic (Phase 2)
      else if (myPhase === 'park') {
        const distToExit = Math.hypot(px - 0, pz - 10)
        const distToBench = Math.hypot(px - 0, pz - (-3)) // Center bench

        if (distToExit < 6) {
          prompt = { text: 'Exit Park', action: 'set_phase', payload: { phase: 'mdu' } }
        } else if (distToBench < 5) {
          prompt = { text: 'Sit', action: 'sit' }
        }

        // Zudio Ring purchase (Panda only)
        if (isPanda && !globalState.pandaHasRing) {
          const distToZudio = Math.hypot(px - 6, pz - 0)
          if (distToZudio < 6) {
            prompt = { text: 'Buy Ring', action: 'buy_ring' }
          }
        }
        
        // Proposal (Panda only)
        if (isPanda && globalState.pandaHasRing && globalState.proposalStatus === 'none' && remotePlayer && remotePlayer.phase === myPhase) {
          const distToPenguin = Math.hypot(px - remotePlayer.x, pz - remotePlayer.z)
          if (distToPenguin < 3) {
            prompt = { text: '💍 Propose', action: 'propose' }
          }
        }
      }
      // Hall Logic (Phase 3)
      else if (myPhase === 'hall') {
        const distToExit = Math.hypot(px - 0, pz - 15)
        const distToStage = Math.hypot(px - 0, pz - (-8))

        if (distToExit < 6) {
          prompt = { text: 'Exit Hall', action: 'set_phase', payload: { phase: 'mdu', spawnX: isPanda ? 23 : 25, spawnZ: 4 } }
        } else if (distToStage < 5 && globalState.engagementStatus !== 'done') {
          if (isPanda) {
            if (globalState.engagementStatus === 'none') {
              prompt = { text: '💍 Give Ring', action: 'give_ring_panda' }
            } else if (globalState.engagementStatus === 'penguin_give') {
              prompt = { text: '💍 Accept Ring', action: 'accept_ring_panda' }
            } else if (globalState.engagementStatus === 'penguin_turn') {
              prompt = { text: 'Waiting for Penguin...', action: 'none' }
            }
          } else {
            // Penguin
            if (globalState.engagementStatus === 'panda_give') {
              prompt = { text: '💍 Accept Ring', action: 'accept_ring_penguin' }
            } else if (globalState.engagementStatus === 'penguin_turn') {
              prompt = { text: '💍 Give Ring', action: 'give_ring_penguin' }
            } else if (globalState.engagementStatus === 'penguin_give') {
              prompt = { text: 'Waiting for Panda...', action: 'none' }
            }
          }
        }
      }
      // House Logic (Phase 4)
      else if (myPhase === 'house') {
        const distToExit = Math.hypot(px - 0, pz - 19)
        const stage = globalState.weddingStage || 0

        if (distToExit < 6) {
          prompt = { text: 'Exit House', action: 'set_phase', payload: { phase: 'mdu', spawnX: isPanda ? 31 : 33, spawnZ: -4.5 } }
        } else if (stage === 1) {
          // Auto-detect both near mandap and show waiting message
          const distToMandap = Math.hypot(px - 0, pz - (-8))
          if (distToMandap < 5) {
            prompt = { text: '🙏 Walk to the Mandap...', action: 'none' }
          }
        } else if (stage === 6) {
          // Pheras Tracking
          if (isPanda) prompt = { text: `Walking Pheras... (${pherasCompleted} / 7)`, action: 'wedding_action', payload: { stage: 7 } }
          else prompt = { text: `Walking Pheras... (${pherasCompleted} / 7)`, action: 'none' }
        }
      }

      // Check if prompt changed to avoid unnecessary renders
      setActivePrompt(prev => {
        if (!prev && !prompt) return prev
        if (prev && prompt && prev.text === prompt.text && prev.action === prompt.action) return prev
        return prompt
      })
    }, 30)
    return () => clearInterval(interval)
  }, [globalState, isPanda, remotePlayer, myPhase, pherasCompleted])

  // Proposal modal for Penguin
  const [showProposalUI, setShowProposalUI] = useState(false)
  useEffect(() => {
    if (globalState.proposalStatus === 'active' && !isPanda) {
      setShowProposalUI(true)
    } else {
      setShowProposalUI(false)
    }
  }, [globalState.proposalStatus, isPanda])

  // Ambient audio removed — DJ Panda music system handles all music now

  const enterCamera = () => { joystickRef.current = { x: 0, y: 0 }; setCameraMode(true) }
  const exitCamera  = () => setCameraMode(false)

  const takePhoto = useCallback(() => {
    if (!captureRef.current) return
    captureRef.current(async (dataUrl) => {
      setFlashAnim(true); setTimeout(() => setFlashAnim(false), 450)
      setLastThumb(dataUrl)
      try {
        const resp = await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dataUrl }),
        })
        if (resp.ok) setPhotoCount(c => c + 1)
      } catch (e) { setPhotoCount(c => c + 1) }
    })
  }, [])

  const showRingForPanda = globalState.pandaHasRing && globalState.proposalStatus !== 'accepted' && globalState.proposalStatus !== 'completed';
  const showRingForPenguin = globalState.proposalStatus === 'accepted' || globalState.proposalStatus === 'completed';

  // Calculate Ring Counts
  let pandaRings = 0;
  if (globalState.pandaHasRing && (globalState.proposalStatus === 'none' || globalState.proposalStatus === 'active')) {
    pandaRings = 1;
  }
  if (globalState.pandaHasSecondRing || globalState.engagementStatus === 'done') {
    pandaRings = 1;
  }

  let penguinRings = 0;
  if (globalState.proposalStatus === 'accepted' || globalState.proposalStatus === 'completed') {
    penguinRings = 1;
  }
  if (globalState.penguinHasSecondRing || globalState.engagementStatus === 'penguin_turn' || globalState.engagementStatus === 'penguin_give' || globalState.engagementStatus === 'done') {
    penguinRings = 2;
  }

  return (
    <div className="game-wrap">

      <div className="hud">
        <div className="hud-pill">
          {myCharacter === 'panda' ? '🐼' : '🐧'}<span className="hud-dot" />
        </div>
        {partnerOnline && (
          <div className="hud-pill">
            {otherChar === 'panda' ? '🐼' : '🐧'}<span className="hud-dot" />
          </div>
        )}
      </div>

      <VoiceChat
        socket={socket}
        character={myCharacter}
        partnerOnline={partnerOnline}
        onSpeakingChange={handleSpeakingChange}
      />

      {isPanda && !cameraMode && (
        <div className="cam-btn-group">
          <button className="cam-open-btn" onClick={enterCamera} title="Camera">📷</button>
          {photoCount > 0 && lastThumb && (
            <button className="gallery-open-btn" onClick={() => setShowGallery(true)}>
              <div className="gallery-thumb-mini"><img src={lastThumb} alt="last" /></div>
              <span className="gallery-open-count">{photoCount}</span>
            </button>
          )}
        </div>
      )}

      {!partnerOnline && !cameraMode && (
        <div className="waiting-msg">Waiting for {otherChar === 'panda' ? '🐼' : '🐧'}...</div>
      )}

      {/* ── ACTION PROMPT UI ── */}
      {activePrompt && !cameraMode && !showProposalUI && (
        <button 
          className="action-prompt-btn"
          onClick={() => sendAction(activePrompt.action, activePrompt.payload)}
        >
          {activePrompt.text}
        </button>
      )}

      {/* Penguin Proposal Choice Modal */}
      {showProposalUI && (
        <div className="proposal-modal-overlay">
          <div className="proposal-modal">
            <h2>Panda is proposing! 💍</h2>
            <div className="proposal-btns">
              <button className="btn-accept" onClick={() => sendAction('accept_proposal')}>Accept</button>
              <button className="btn-reject" onClick={() => alert('Think again.. 😉')}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {flashAnim && <div className="photo-flash" />}

      <Canvas
        shadows
        camera={{ position: [0, 14, 18], fov: 55 }}
        gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        style={{ touchAction: 'none', display: globalState.weddingStage >= 10 ? 'none' : 'block' }}
      >
        <ambientLight intensity={0.4} />

        {myPhase === 'mdu' && <color attach="background" args={['#221535']} />}
        {myPhase === 'park' && <color attach="background" args={['#ffedd5']} />}
        {myPhase === 'hall' && <color attach="background" args={['#080c16']} />}
        {myPhase === 'house' && <color attach="background" args={['#000000']} />}

        {myPhase === 'mdu' && <fog attach="fog" args={['#221535', 32, 58]} />}
        {myPhase === 'park' && <fog attach="fog" args={['#ffedd5', 40, 80]} />}
        {myPhase === 'hall' && <fog attach="fog" args={['#080c16', 30, 80]} />}
        {myPhase === 'house' && <fog attach="fog" args={['#000000', 20, 60]} />}

        {myPhase === 'mdu' && <CozyMap />}
        {myPhase === 'park' && <ParkMap botState={globalState.botState} />}
        {myPhase === 'hall' && <HallMap globalState={globalState} />}
        {myPhase === 'house' && <HouseMap 
          globalState={globalState} 
          bothInHouse={myPhase === 'house' && remotePlayer?.phase === 'house'} 
          onWeddingAction={(stage) => sendAction('wedding_action', { stage })}
          isPanda={isPanda}
        />}

        {/* Grand Finale Effects (Park) */}
        {globalState.proposalStatus === 'accepted' && myPhase === 'park' && (
          <group>
            <Fireworks />
            <FlowerRain />
          </group>
        )}

        {/* Engagement Finale Effects (Hall) */}
        {globalState.engagementStatus === 'done' && myPhase === 'hall' && (
          <group position={[0, 5, -8]}>
            <Fireworks />
            <FlowerRain />
          </group>
        )}

        {/* Wedding Finale Effects (House) */}
        {globalState.weddingStage >= 10 && myPhase === 'house' && (
          <group position={[0, 8, -8]}>
            <Fireworks />
            <FlowerRain />
          </group>
        )}

        {/* Jaimala Cheers (House) */}
        {(globalState.weddingStage === 3 || globalState.weddingStage === 4) && myPhase === 'house' && (
          <group position={[0, 8, -8]}>
            <FlowerRain />
          </group>
        )}

        <PheraTracker 
          stage={globalState.weddingStage} 
          myCharacter={myCharacter} 
          myPosRef={myPosRef} 
          remotePlayer={remotePlayer} 
          setPherasCompleted={setPherasCompleted}
          onComplete={() => {
            if (isPanda) sendAction('wedding_action', { stage: 7 });
          }}
        />

        <CamController joystickRef={joystickRef} active={cameraMode} targetRef={myPosRef} />
        <CaptureHelper captureRef={captureRef} />

        <Player
          socket={socket}
          character={myCharacter}
          emote={myEmote}
          chatFocused={chatFocused || cameraMode}
          joystickRef={joystickRef}
          speaking={speaking[myCharacter]}
          frozen={cameraMode || showProposalUI || (activePrompt?.action === 'propose' && globalState.proposalStatus === 'active') || (isPanda ? globalState.pandaIsSitting : globalState.penguinIsSitting)}
          remotePlayer={remotePlayer}
          posRef={myPosRef}
          rings={myCharacter === 'panda' ? pandaRings : penguinRings}
          isSitting={isPanda ? globalState.pandaIsSitting : globalState.penguinIsSitting}
          weddingStage={globalState.weddingStage}
        />

        {remotePlayer && (remotePlayer.phase === myPhase || !remotePlayer.phase) && (
          <RemotePlayer 
            data={remotePlayer} 
            emote={remoteEmote} 
            speaking={speaking[otherChar]} 
            rings={otherChar === 'panda' ? pandaRings : penguinRings}
            isSitting={otherChar === 'panda' ? globalState.pandaIsSitting : globalState.penguinIsSitting}
            weddingStage={globalState.weddingStage}
          />
        )}
      </Canvas>

      {cameraMode ? (
        <>
          <div className="cam-overlay">
            <div className="cam-finder">
              <div className="cam-corner tl" /><div className="cam-corner tr" />
              <div className="cam-corner bl" /><div className="cam-corner br" />
            </div>
            <div className="cam-hint">⬆⬇⬅➡ Pan · Pinch to zoom</div>
          </div>
          <DPad joystickRef={joystickRef} />
          <button className="cam-shutter" onClick={takePhoto} onTouchEnd={e => { e.preventDefault(); takePhoto() }}>
            <div className="cam-shutter-inner" />
          </button>
          <button className="cam-exit" onClick={exitCamera}>✕</button>
          {photoCount > 0 && (
            <button className="cam-count" onClick={() => { exitCamera(); setShowGallery(true) }}>
              📷 {photoCount}
            </button>
          )}
        </>
      ) : (
        <>
          <Joystick joystickRef={joystickRef} />
          <EmoteUI onEmote={sendEmote} />
          <ChatUI messages={chatMessages} onSend={sendChat} onFocusChange={setChatFocused} />
          <MusicPlayer isPanda={isPanda} musicState={globalState.musicState} sendAction={sendAction} />
        </>
      )}

      {showGallery && <PhotoGallery onClose={() => setShowGallery(false)} />}
    </div>
  )
}
