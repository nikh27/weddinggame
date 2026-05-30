import React, { useEffect, useRef, useState } from 'react'

// Encode the URLs properly so the browser/server can fetch them without issue
const SONGS = [
  { id: 0, title: '🎵 Aaj Se Teri', url: encodeURI('/Aaj Se Teri - Lyrical  Padman  Akshay Kumar & Radhika Apte  Arijit Singh  Amit Trivedi - Zee Music Company.mp3') },
  { id: 1, title: '🎵 Tu Chahiye', url: encodeURI('/Tu Chahiye Bajrangi Bhaijaan 128 Kbps.mp3') },
  { id: 2, title: '🎵 Tu Hi Mera', url: encodeURI('/Tu Hi Mera Jannat 2 Original Motion Picturetrack 128 Kbps.mp3') },
  { id: 3, title: '🎵 Tum Ho Toh Saiyaara', url: encodeURI('/Tum Ho Toh Saiyaara 128 Kbps.mp3') },
  { id: 4, title: '🎵 Tum Se Hi', url: encodeURI('/Tum Se Hi Jab We Met 128 Kbps (1).mp3') },
  { id: 5, title: '🎵 Tum Se Teri Baaton', url: encodeURI('/Tum Se Teri Baaton Mein Aisa Uljha Jiya 128 Kbps.mp3') }
]

export default function MusicPlayer({ isPanda, musicState, sendAction }) {
  const audioRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [localTime, setLocalTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [lastSeekId, setLastSeekId] = useState(null)

  // Default state if server hasn't sent one yet
  const state = musicState || { isPlaying: false, songIndex: 0, volume: 0.5 }
  const currentSong = SONGS[state.songIndex]

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = state.volume

    const expectedUrl = currentSong.url
    // Decode both to compare accurately
    if (!decodeURI(audio.src).endsWith(decodeURI(expectedUrl))) {
      audio.src = expectedUrl
    }

    if (state.seekId && state.seekId !== lastSeekId) {
      audio.currentTime = state.seekTime || 0
      setLocalTime(state.seekTime || 0)
      setLastSeekId(state.seekId)
    }

    if (state.isPlaying) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Auto-play prevented or file not found.", error)
        })
      }
    } else {
      audio.pause()
    }
  }, [state.isPlaying, state.songIndex, state.volume, currentSong, state.seekId, state.seekTime, lastSeekId])

  const togglePlay = () => {
    sendAction('music_control', { isPlaying: !state.isPlaying })
  }

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value)
    sendAction('music_control', { volume: newVol })
  }

  const changeSong = (direction) => {
    let newIdx = (state.songIndex + direction + SONGS.length) % SONGS.length
    // Reset time when changing song
    sendAction('music_control', { songIndex: newIdx, isPlaying: true, seekTime: 0, seekId: Date.now() })
  }

  const selectSong = (index) => {
    setShowPlaylist(false)
    sendAction('music_control', { songIndex: index, isPlaying: true, seekTime: 0, seekId: Date.now() })
  }

  const handleSeekChange = (e) => {
    setLocalTime(parseFloat(e.target.value))
  }

  const handleSeekEnd = (e) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
    sendAction('music_control', { seekTime: newTime, seekId: Date.now() })
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <>
      <audio 
        ref={audioRef} 
        loop 
        preload="auto" 
        onTimeUpdate={() => {
          if (audioRef.current) setLocalTime(audioRef.current.currentTime)
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
      />

      {/* Controls: Only Panda can control the music */}
      {isPanda && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none'
        }}>
          {/* Collapsed Icon Button */}
          <button 
            onClick={() => setExpanded(!expanded)}
            style={{
              pointerEvents: 'auto',
              background: state.isPlaying ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(20, 20, 20, 0.8)',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              animation: (state.isPlaying && !expanded) ? 'pulse 2s infinite' : 'none'
            }}
          >
            🎧
          </button>

          {/* Expanded UI */}
          {expanded && (
            <div style={{
              pointerEvents: 'auto',
              marginTop: '10px',
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#fff',
              padding: '16px 20px',
              borderRadius: '16px',
              fontFamily: 'Nunito, sans-serif',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              width: '240px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '10px', color: '#fbbf24', display: 'flex', justifyContent: 'space-between' }}>
                <span>DJ Panda</span>
                <span>{state.songIndex + 1} / {SONGS.length}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ 
                  fontSize: '15px', 
                  fontWeight: '600', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  color: '#f8fafc',
                  flex: 1
                }}>
                  {currentSong.title}
                </div>
                <button 
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  style={{
                    background: 'none', border: 'none', color: '#f59e0b', fontSize: '16px', cursor: 'pointer',
                    padding: '4px', transform: showPlaylist ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s'
                  }}
                >
                  ▼
                </button>
              </div>

              {/* Playlist Selection */}
              {showPlaylist && (
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '8px',
                  padding: '8px',
                  marginBottom: '16px',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {SONGS.map((song, idx) => (
                    <div 
                      key={song.id}
                      onClick={() => selectSong(idx)}
                      style={{
                        padding: '6px 8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: idx === state.songIndex ? '#fcd34d' : '#cbd5e1',
                        background: idx === state.songIndex ? 'rgba(255,255,255,0.1)' : 'transparent',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {idx + 1}. {song.title.replace('🎵 ', '')}
                    </div>
                  ))}
                </div>
              )}

              {/* Playback Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                <button onClick={() => changeSong(-1)} style={btnStyle}>⏮</button>
                <button 
                  onClick={togglePlay} 
                  style={{ 
                    ...btnStyle, 
                    fontSize: '20px', 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '50%', 
                    background: '#f59e0b', 
                    color: '#fff',
                    boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  {state.isPlaying ? '⏸' : '▶️'}
                </button>
                <button onClick={() => changeSong(1)} style={btnStyle}>⏭</button>
              </div>

              {/* Seek Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', width: '30px', textAlign: 'right', opacity: 0.7 }}>{formatTime(localTime)}</span>
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={localTime} 
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                  style={{
                    flex: 1,
                    accentColor: '#fcd34d',
                    height: '4px',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '11px', width: '30px', opacity: 0.7 }}>{formatTime(duration)}</span>
              </div>

              {/* Volume Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', opacity: 0.7 }}>🔉</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={state.volume} 
                  onChange={handleVolumeChange}
                  style={{
                    flex: 1,
                    accentColor: '#f59e0b',
                    height: '4px',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', opacity: 0.7 }}>🔊</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicator for Penguin */}
      {!isPanda && state.isPlaying && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(15, 23, 42, 0.7)',
          color: '#fcd34d',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 'bold',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ animation: 'pulse 2s infinite' }}>🎧</span> 
          <span>Panda is playing: {currentSong.title}</span>
        </div>
      )}
    </>
  )
}

const btnStyle = {
  background: 'none',
  border: 'none',
  color: 'white',
  fontSize: '18px',
  cursor: 'pointer',
  padding: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.1s'
}
