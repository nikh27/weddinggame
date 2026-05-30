import React, { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'

const SONGS = [
  { id: 0, title: 'Aaj Se Teri', url: encodeURI('/Aaj Se Teri - Lyrical  Padman  Akshay Kumar & Radhika Apte  Arijit Singh  Amit Trivedi - Zee Music Company.mp3') },
  { id: 1, title: 'Tu Chahiye', url: encodeURI('/Tu Chahiye Bajrangi Bhaijaan 128 Kbps.mp3') },
  { id: 2, title: 'Tu Hi Mera', url: encodeURI('/Tu Hi Mera Jannat 2 Original Motion Picturetrack 128 Kbps.mp3') },
  { id: 3, title: 'Tum Ho Toh Saiyaara', url: encodeURI('/Tum Ho Toh Saiyaara 128 Kbps.mp3') },
  { id: 4, title: 'Tum Se Hi', url: encodeURI('/Tum Se Hi Jab We Met 128 Kbps (1).mp3') },
  { id: 5, title: 'Tum Se Teri Baaton', url: encodeURI('/Tum Se Teri Baaton Mein Aisa Uljha Jiya 128 Kbps.mp3') }
]

const STORY_LINES = [
  { delay: 0,    text: "And so it was written in the stars..." },
  { delay: 2800, text: "A little Panda and a little Penguin found each other..." },
  { delay: 5800, text: "...across worlds, across maps, across every little adventure." },
  { delay: 9000, text: "They laughed together. They danced together." },
  { delay: 12000, text: "They walked seven circles around a sacred fire..." },
  { delay: 15200, text: "...and with every step, promised a lifetime." },
  { delay: 18500, text: "Today, the universe paused for them. 🌙" },
  { delay: 21500, text: "And two hearts became one story." },
  { delay: 24800, text: "Forever and always, Panda 🐼 & Penguin 🐧" },
]

export default function WeddingEnding({ socket }) {
  const [phase, setPhase] = useState('story') // story | certificate
  const [visibleLines, setVisibleLines] = useState([])
  const [photos, setPhotos] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [songIdx, setSongIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const audioRef = useRef(null)
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  // Auto-play music
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = SONGS[songIdx].url
    audio.volume = 0.6
    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [songIdx, isPlaying])

  // Show story lines one by one
  useEffect(() => {
    if (phase !== 'story') return
    const timers = STORY_LINES.map((line, idx) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, idx])
      }, line.delay)
    )
    // Move to certificate after story ends
    const endTimer = setTimeout(() => setPhase('certificate'), 28500)
    return () => { timers.forEach(clearTimeout); clearTimeout(endTimer) }
  }, [phase])

  // Fetch photos for the certificate
  useEffect(() => {
    if (phase !== 'certificate') return
    fetch('/api/photos')
      .then(r => r.json())
      .then(data => setPhotos(data))
      .catch(() => setPhotos([]))
  }, [phase])

  const downloadCertificate = () => {
    const el = document.getElementById('wedding-certificate')
    if (!el) return
    
    // Briefly adjust styling to ensure crisp capture if needed, then capture
    html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
      const imgData = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = imgData
      a.download = `Wedding_Certificate_${dateStr}.png`
      a.click()
    })
  }

  const downloadPhoto = (url, filename) => {
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
  }

  const downloadAllPhotos = () => {
    photos.forEach((p, i) => setTimeout(() => downloadPhoto(p.url, p.filename), i * 350))
  }

  const togglePlay = () => setIsPlaying(p => !p)
  const nextSong = () => setSongIdx(i => (i + 1) % SONGS.length)
  const prevSong = () => setSongIdx(i => (i - 1 + SONGS.length) % SONGS.length)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: "'Georgia', serif"
    }}>
      <audio ref={audioRef} loop />

      {/* Floating petals */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(22)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: '-20px',
            fontSize: `${12 + Math.random() * 12}px`,
            animation: `petalFall ${4 + Math.random() * 6}s linear ${Math.random() * 8}s infinite`,
            opacity: 0.7
          }}>
            {['🌸', '🌺', '🌼', '✨', '⭐', '💮'][i % 6]}
          </div>
        ))}
      </div>

      {/* ── STORY PHASE ── */}
      {phase === 'story' && (
        <div style={{
          maxWidth: '680px', width: '90%', textAlign: 'center',
          display: 'flex', flexDirection: 'column', gap: '18px',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: '52px', marginBottom: '10px', animation: 'heartbeat 2s ease-in-out infinite' }}>💑</div>

          {STORY_LINES.map((line, idx) => (
            <p key={idx} style={{
              margin: 0,
              fontSize: idx === 8 ? '24px' : idx === 0 ? '17px' : '20px',
              fontWeight: idx === 8 ? '700' : '400',
              color: idx === 8 ? '#fcd34d' : idx % 2 === 0 ? '#f9d0e0' : '#e2c8f0',
              letterSpacing: '0.03em',
              lineHeight: '1.5',
              opacity: visibleLines.includes(idx) ? 1 : 0,
              transform: visibleLines.includes(idx) ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 1.4s ease',
              textShadow: '0 0 30px rgba(255,200,220,0.4)'
            }}>
              {line.text}
            </p>
          ))}
        </div>
      )}

      {/* ── CERTIFICATE PHASE ── */}
      {phase === 'certificate' && (
        <div style={{
          width: '100%', height: '100%', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '30px 20px', gap: '40px', boxSizing: 'border-box'
        }}>

          {/* === WEDDING CERTIFICATE === */}
          <div id="wedding-certificate" style={{
            background: 'linear-gradient(145deg, #1a0a00, #2d1200)',
            border: '4px solid #b8860b',
            borderRadius: '20px',
            padding: '50px 60px',
            maxWidth: '700px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 0 80px rgba(184,134,11,0.3), 0 0 0 2px #6b4c08, inset 0 0 60px rgba(0,0,0,0.5)',
            boxSizing: 'border-box'
          }}>
            {/* Corner ornaments */}
            {['top-left','top-right','bottom-left','bottom-right'].map(pos => (
              <div key={pos} style={{
                position: 'absolute',
                top: pos.includes('top') ? '12px' : 'auto',
                bottom: pos.includes('bottom') ? '12px' : 'auto',
                left: pos.includes('left') ? '12px' : 'auto',
                right: pos.includes('right') ? '12px' : 'auto',
                fontSize: '26px', opacity: 0.6
              }}>✦</div>
            ))}

            <div style={{ fontSize: '13px', letterSpacing: '4px', color: '#b8860b', marginBottom: '10px', textTransform: 'uppercase' }}>
              ✦ Certificate of Sacred Union ✦
            </div>
            <div style={{ fontSize: '42px', margin: '10px 0 4px', filter: 'drop-shadow(0 0 12px gold)' }}>💍</div>
            <h1 style={{
              fontSize: '36px', fontWeight: '700',
              background: 'linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              margin: '0 0 6px', letterSpacing: '2px'
            }}>
              Vivah Sampann
            </h1>
            <p style={{ color: '#d4a76a', fontSize: '13px', margin: '0 0 30px', letterSpacing: '2px' }}>WEDDING COMPLETE</p>

            <div style={{ width: '80%', height: '1px', background: 'linear-gradient(90deg, transparent, #b8860b, transparent)', margin: '0 auto 30px' }} />

            <p style={{ color: '#e8c898', fontSize: '16px', margin: '0 0 20px', lineHeight: '1.8' }}>
              This is to certify that on this auspicious day of
            </p>

            <div style={{ fontSize: '22px', color: '#ffd700', fontWeight: '600', margin: '0 0 20px', letterSpacing: '1px' }}>
              {dateStr}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', margin: '20px 0 30px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px' }}>🐼</div>
                <div style={{ color: '#ffd700', fontSize: '22px', fontWeight: '700', fontFamily: 'Georgia, serif' }}>Panda</div>
              </div>
              <div style={{ fontSize: '28px', color: '#ff8c69' }}>💕</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px' }}>🐧</div>
                <div style={{ color: '#ffd700', fontSize: '22px', fontWeight: '700', fontFamily: 'Georgia, serif' }}>Penguin</div>
              </div>
            </div>

            <p style={{ color: '#e8c898', fontSize: '15px', lineHeight: '1.9', margin: '0 0 24px', fontStyle: 'italic' }}>
              were united in holy matrimony, bound together<br />
              by love, seven sacred pheras, and the eternal promises<br />
              made before the sacred fire.
            </p>

            <div style={{ width: '80%', height: '1px', background: 'linear-gradient(90deg, transparent, #b8860b, transparent)', margin: '0 auto 24px' }} />

            <p style={{ color: '#c4956a', fontSize: '13px', fontStyle: 'italic', lineHeight: '1.8', margin: 0 }}>
              "May your love be like the stars — constant, bright,<br />
              and impossible to count. May every day of your life<br />
              begin with a smile and end with gratitude." 🌟
            </p>

            <div style={{ marginTop: '30px', fontSize: '22px', letterSpacing: '8px', color: '#b8860b', opacity: 0.5 }}>
              ✦ ✦ ✦
            </div>
          </div>

          {/* Download Certificate Button */}
          <button onClick={downloadCertificate} style={{
            background: 'linear-gradient(135deg, #b8860b, #ffd700)',
            color: '#1a0a00', border: 'none', borderRadius: '12px',
            padding: '14px 36px', fontSize: '16px', fontWeight: '700',
            cursor: 'pointer', letterSpacing: '1px',
            boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
            transition: 'transform 0.2s'
          }}
            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            ⬇ Download Certificate
          </button>

          {/* === PHOTO MEMORIES === */}
          <div style={{ maxWidth: '700px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '28px', color: '#fcd34d', fontWeight: '700', marginBottom: '6px' }}>📸 Your Precious Memories</div>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Moments Panda captured during the journey</div>
            </div>

            {photos.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '15px', padding: '30px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                No photos captured yet 📷<br/>
                <span style={{ fontSize: '12px', opacity: 0.6 }}>Use camera mode next time to capture memories!</span>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '12px', marginBottom: '20px'
                }}>
                  {photos.map(p => (
                    <div key={p.filename} style={{ position: 'relative', cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1', border: '2px solid rgba(184,134,11,0.3)' }}
                      onClick={() => setSelectedPhoto(p)}>
                      <img src={p.url} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.target.style.transform = 'scale(1)'}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={downloadAllPhotos} style={{
                    background: 'rgba(255,255,255,0.08)', color: '#fcd34d',
                    border: '1px solid rgba(252,211,77,0.4)', borderRadius: '10px',
                    padding: '10px 28px', fontSize: '14px', cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}>⬇ Download All Photos</button>
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom: '100px' }} />
        </div>
      )}

      {/* === MUSIC PLAYER (always visible) === */}
      <div style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(10, 10, 30, 0.9)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,215,0,0.3)', borderRadius: '20px',
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px',
        zIndex: 10000, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        minWidth: '320px', maxWidth: '90vw'
      }}>
        {/* Playlist toggle */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowPlaylist(p => !p)} style={{
            background: 'none', border: 'none', color: '#fcd34d',
            fontSize: '22px', cursor: 'pointer', padding: '0'
          }}>🎵</button>
          {showPlaylist && (
            <div style={{
              position: 'absolute', bottom: '48px', left: '0',
              background: 'rgba(10,10,30,0.97)', border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: '12px', padding: '10px', width: '220px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.8)', zIndex: 10001
            }}>
              {SONGS.map((song, idx) => (
                <div key={song.id} onClick={() => { setSongIdx(idx); setIsPlaying(true); setShowPlaylist(false) }} style={{
                  padding: '8px 12px', cursor: 'pointer', borderRadius: '6px',
                  fontSize: '13px', color: idx === songIdx ? '#fcd34d' : '#cbd5e1',
                  background: idx === songIdx ? 'rgba(255,215,0,0.15)' : 'transparent',
                  marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {idx + 1}. {song.title}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prev */}
        <button onClick={prevSong} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⏮</button>

        {/* Play/Pause */}
        <button onClick={togglePlay} style={{
          background: 'linear-gradient(135deg, #b8860b, #ffd700)',
          border: 'none', borderRadius: '50%', width: '40px', height: '40px',
          fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(255,215,0,0.4)'
        }}>
          {isPlaying ? '⏸' : '▶️'}
        </button>

        {/* Next */}
        <button onClick={nextSong} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⏭</button>

        {/* Song name */}
        <div style={{ color: '#fcd34d', fontSize: '13px', fontFamily: 'sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {SONGS[songIdx].title}
        </div>
      </div>

      {/* Full photo view */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 20000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px'
        }} onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto.url} alt="Memory" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px', border: '2px solid #b8860b' }} />
          <div style={{ display: 'flex', gap: '12px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => downloadPhoto(selectedPhoto.url, selectedPhoto.filename)} style={{
              background: 'linear-gradient(135deg, #b8860b, #ffd700)', color: '#1a0a00',
              border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
            }}>⬇ Download</button>
            <button onClick={() => setSelectedPhoto(null)} style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer'
            }}>✕ Close</button>
          </div>
        </div>
      )}

      {/* Dev Mode Reset Button */}
      {socket && (
        <button
          onClick={() => {
            const pwd = window.prompt('Enter dev password to reset game:');
            if (pwd === 'plovep') {
              if (window.confirm('Reset the entire game and delete the saved wedding state?')) {
                socket.emit('action', { type: 'reset_game' });
              }
            } else if (pwd !== null) {
              window.alert('Incorrect password!');
            }
          }}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 30000,
            background: 'rgba(255, 0, 0, 0.2)', color: '#fca5a5',
            border: '1px solid rgba(255, 0, 0, 0.5)', borderRadius: '8px',
            padding: '8px 12px', fontSize: '12px', cursor: 'pointer',
            backdropFilter: 'blur(4px)'
          }}
        >
          Reset Game (Dev)
        </button>
      )}

      <style>{`
        @keyframes petalFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.5; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @media print {
          body > * { display: none !important; }
          #wedding-certificate { display: block !important; }
        }
      `}</style>
    </div>
  )
}
