import React, { useEffect, useRef, useState, useCallback } from 'react'

const ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

// status: idle | connecting | connected | error
export default function VoiceChat({ socket, character, partnerOnline, onSpeakingChange }) {
  const [status, setStatus] = useState('idle')
  const [muted, setMuted] = useState(false)

  const peerRef = useRef(null)
  const streamRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const iceQueue = useRef([])
  const hasRemoteRef = useRef(false)
  const mountedRef = useRef(true)
  const analyserLocalRef = useRef(null)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; cleanup() } }, [])

  function cleanup() {
    peerRef.current?.close(); peerRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
    hasRemoteRef.current = false; iceQueue.current = []
    analyserLocalRef.current = null
  }

  async function getMic() {
    if (streamRef.current) return streamRef.current
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      })
      streamRef.current = s
      // Monitor own voice
      try {
        const ctx = new AudioContext()
        const src = ctx.createMediaStreamSource(s)
        const an = ctx.createAnalyser(); an.fftSize = 256
        src.connect(an)
        analyserLocalRef.current = an
        const data = new Uint8Array(an.fftSize)
        let frame
        const check = () => {
          if (!mountedRef.current) return
          an.getByteTimeDomainData(data)
          const vol = data.reduce((a,b) => a + Math.abs(b-128), 0) / data.length
          onSpeakingChange?.({ who: 'me', speaking: vol > 5 })
          frame = requestAnimationFrame(check)
        }
        check()
      } catch(e) {}
      return s
    } catch(e) {
      setStatus('error'); return null
    }
  }

  function buildPeer() {
    peerRef.current?.close()
    hasRemoteRef.current = false; iceQueue.current = []
    const pc = new RTCPeerConnection({ iceServers: ICE })

    pc.onicecandidate = e => { if (e.candidate) socket?.emit('webrtc_ice', { candidate: e.candidate }) }

    pc.onconnectionstatechange = () => {
      if (!mountedRef.current) return
      const s = pc.connectionState
      if (s === 'connected') { if (mountedRef.current) setStatus('connected') }
      if (s === 'failed' || s === 'disconnected') {
        setStatus('connecting')
        if (character === 'panda') setTimeout(() => { if (mountedRef.current) call() }, 2500)
      }
    }

    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') pc.restartIce() }

    pc.ontrack = e => {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0]
      // Monitor remote voice
      try {
        const ctx = new AudioContext()
        const src = ctx.createMediaStreamSource(e.streams[0])
        const an = ctx.createAnalyser(); an.fftSize = 256
        src.connect(an)
        const data = new Uint8Array(an.fftSize)
        const check = () => {
          if (!mountedRef.current) return
          an.getByteTimeDomainData(data)
          const vol = data.reduce((a,b) => a + Math.abs(b-128), 0) / data.length
          onSpeakingChange?.({ who: 'partner', speaking: vol > 5 })
          requestAnimationFrame(check)
        }
        check()
      } catch(e) {}
    }

    peerRef.current = pc
    return pc
  }

  async function drainQueue(pc) {
    for (const c of iceQueue.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch(e) {}
    }
    iceQueue.current = []
  }

  const call = useCallback(async () => {
    if (!socket || !mountedRef.current) return
    setStatus('connecting')
    const stream = await getMic()
    if (!stream) return
    const pc = buildPeer()
    stream.getTracks().forEach(t => pc.addTrack(t, stream))
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('webrtc_offer', { offer })
    } catch(e) { console.error('[Voice] call err', e) }
  }, [socket, character])

  // Start call when partner joins
  useEffect(() => {
    if (!partnerOnline || !socket) return
    if (status === 'idle' && character === 'panda') {
      const t = setTimeout(() => call(), 600)
      return () => clearTimeout(t)
    }
  }, [partnerOnline, socket, character, status, call])

  // Signal handlers
  useEffect(() => {
    if (!socket) return

    const onOffer = async ({ offer }) => {
      if (!mountedRef.current) return
      setStatus('connecting')
      const stream = await getMic()
      if (!stream) return
      const pc = buildPeer()
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        hasRemoteRef.current = true
        await drainQueue(pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('webrtc_answer', { answer })
      } catch(e) { console.error('[Voice] answer err', e) }
    }

    const onAnswer = async ({ answer }) => {
      try {
        await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer))
        hasRemoteRef.current = true
        await drainQueue(peerRef.current)
      } catch(e) {}
    }

    const onIce = async ({ candidate }) => {
      if (!hasRemoteRef.current) { iceQueue.current.push(candidate); return }
      try { await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate)) } catch(e) {}
    }

    socket.on('webrtc_offer', onOffer)
    socket.on('webrtc_answer', onAnswer)
    socket.on('webrtc_ice', onIce)
    return () => {
      socket.off('webrtc_offer', onOffer)
      socket.off('webrtc_answer', onAnswer)
      socket.off('webrtc_ice', onIce)
    }
  }, [socket, character, call])

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted })
    setMuted(m => !m)
  }

  const dotColor = status === 'connected' ? '#86efac' : status === 'connecting' ? '#fdba74' : status === 'error' ? '#ff6b9d' : '#666'

  return (
    <div className="voice-ui">
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      <div className="voice-pill" style={{ borderColor: dotColor }}>
        <span className="voice-dot-sm" style={{ background: dotColor }} />
        <span className="voice-label-sm">
          {status === 'connected' ? 'Voice' : status === 'connecting' ? 'Connecting' : status === 'error' ? 'No mic' : 'Voice off'}
        </span>
        {status === 'connected' && (
          <button className={`voice-mute-sm ${muted ? 'muted' : ''}`} onClick={toggleMute}>
            {muted ? '🔇' : '🎙️'}
          </button>
        )}
      </div>
    </div>
  )
}
