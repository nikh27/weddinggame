import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

// Each stage has multiple sentences. After all sentences, show the action.
const PUJARI_SCRIPT = {
  2: {
    sentences: [
      "🕉️ Aum Shanti... Aum Shanti...",
      "Welcome, dear Panda and Penguin.",
      "Today, under the sacred sky and the blessings of the divine, we witness a most holy union.",
      "Two souls who found each other across the universe...",
      "...are about to become one.",
      "Jai Mala is our first sacred ritual.",
      "Panda, please step forward and place the garland of flowers around Penguin's neck."
    ],
    actionText: "🌸 Place Garland on Penguin",
    actionFor: 'panda'
  },
  3: {
    sentences: [
      "Subh! Subh! 🌺",
      "Panda has expressed his love with this garland.",
      "Now Penguin, it is your turn to accept and return this love.",
      "Please step forward and place your garland around Panda's neck.",
      "Let all the family and friends shower their blessings!"
    ],
    actionText: "🌸 Place Garland on Panda",
    actionFor: 'penguin'
  },
  4: {
    sentences: [
      "Jai Ho! The Jai Mala is complete! 🎉",
      "Both garlands have been exchanged. The love is sealed.",
      "Now we invoke Agni Dev — the sacred fire — as our eternal witness.",
      "Agni Dev is the purest form of the divine...",
      "...and he will carry your vows to the heavens.",
      "Please be seated near the sacred fire for the Havan ceremony."
    ],
    actionText: "🔥 Sit for Havan",
    actionFor: 'both'
  },
  5: {
    sentences: [
      "Om Swaha... Om Swaha... 🔥",
      "Agni Dev, we offer this sacred fire to you.",
      "Please carry the vows of this couple to the divine.",
      "Panda and Penguin, do you take each other as your life partners?",
      "As you have accepted, so shall the fire witness.",
      "Now rise. It is time for the most sacred part of the ceremony...",
      "...the Saat Pheras. Seven steps, seven vows.",
      "Each circle around this fire is one eternal promise."
    ],
    actionText: "🚶 Begin Saat Pheras",
    actionFor: 'both'
  },
  6: {
    sentences: [
      "Walk together, side by side. 🚶‍♀️🚶",
      "With each circle, you make a sacred vow.",
      "First Phera: Together we shall share our food and nourishment.",
      "Second Phera: Together we shall grow in strength.",
      "Third Phera: Together we shall prosper in wealth.",
      "Fourth Phera: Together we shall share joy and sorrow.",
      "Fifth Phera: Together we shall care for our family.",
      "Sixth Phera: Together we shall remain faithful.",
      "Seventh Phera: Together we shall be lifelong friends and partners.",
      "Walk all seven circles now..."
    ],
    actionText: null,
    actionFor: null
  },
  7: {
    sentences: [
      "Saat Pheras complete! Hari Om! 🙏",
      "Seven vows made. Seven promises kept.",
      "Agni Dev has witnessed your love.",
      "Now for Sindoor — the mark of eternal love.",
      "Panda, take the sacred sindoor...",
      "...and lovingly apply it on Penguin's forehead.",
      "This marks the beginning of your life together."
    ],
    actionText: "❤️ Apply Sindoor",
    actionFor: 'panda'
  },
  8: {
    sentences: [
      "The sindoor shines beautifully! 🌟",
      "Now for the Mangalsutra — the sacred thread.",
      "This necklace is the symbol of your eternal bond.",
      "It is worn close to the heart...",
      "...as a reminder of this sacred promise.",
      "Panda, please tie the Mangalsutra around Penguin's neck."
    ],
    actionText: "📿 Tie Mangalsutra",
    actionFor: 'panda'
  },
  9: {
    sentences: [
      "🎊 Vivah Sampann! 🎊",
      "The wedding ceremony is now complete!",
      "May the blessings of all the gods be with you.",
      "May your love grow stronger every day.",
      "May your home be filled with joy, laughter, and prosperity.",
      "You are now joined as one, for eternity.",
      "Congratulations, Panda and Penguin! 🐼💕🐧"
    ],
    actionText: "✨ Complete Wedding!",
    actionFor: 'both'
  }
}

export default function HousePujari({ position, rotation, weddingStage, isPanda, onAction }) {
  const groupRef = useRef()
  const armLRef = useRef()
  const armRRef = useRef()
  const headRef = useRef()

  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showAction, setShowAction] = useState(false)
  const charIdxRef = useRef(0)
  const timerRef = useRef(null)
  const waitTimerRef = useRef(null)
  const stageRef = useRef(weddingStage)

  const script = PUJARI_SCRIPT[weddingStage]

  const startTyping = useCallback((text, currentIdx) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current)
    
    charIdxRef.current = 0
    setDisplayedText('')
    setIsTyping(true)
    setShowAction(false)
    
    timerRef.current = setInterval(() => {
      charIdxRef.current++
      setDisplayedText(text.slice(0, charIdxRef.current))
      
      // When typing finishes
      if (charIdxRef.current >= text.length) {
        clearInterval(timerRef.current)
        setIsTyping(false)
        
        // Auto advance after a delay based on text length (min 2.5s, max 5s)
        const waitTime = Math.min(5000, Math.max(2500, text.length * 60))
        
        waitTimerRef.current = setTimeout(() => {
          const activeScript = PUJARI_SCRIPT[stageRef.current]
          const nextIdx = currentIdx + 1
          if (activeScript && nextIdx < activeScript.sentences.length) {
            setSentenceIdx(nextIdx)
            startTyping(activeScript.sentences[nextIdx], nextIdx)
          } else {
            setShowAction(true)
          }
        }, waitTime)
      }
    }, 40) // Typing speed
  }, [])

  // Reset when stage changes
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current)
      
    stageRef.current = weddingStage
    setSentenceIdx(0)
    setDisplayedText('')
    setIsTyping(false)
    setShowAction(false)
    
    if (PUJARI_SCRIPT[weddingStage]) {
      setTimeout(() => startTyping(PUJARI_SCRIPT[weddingStage].sentences[0], 0), 400)
    }
    
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current)
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current)
    }
  }, [weddingStage, startTyping])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.position.y = position[1]
    armLRef.current.rotation.x = -1.5
    armLRef.current.rotation.z = -0.5
    if (weddingStage === 5 || weddingStage === 6) {
      armRRef.current.rotation.x = -1.5 + Math.sin(t * 4) * 0.4
      armRRef.current.rotation.z = 0.5 + Math.sin(t * 4) * 0.2
    } else {
      armRRef.current.rotation.x = -1.5
      armRRef.current.rotation.z = 0.5
    }
    if (script && weddingStage < 10) {
      headRef.current.rotation.x = Math.sin(t * 3) * 0.1
      headRef.current.rotation.y = Math.sin(t * 1.5) * 0.05
    } else {
      headRef.current.rotation.x = 0.1
      headRef.current.rotation.y = 0
    }
  })

  // Determine if the action button should be visible to this player
  const canAct = script && showAction && (
    script.actionFor === 'both' ||
    (script.actionFor === 'panda' && isPanda) ||
    (script.actionFor === 'penguin' && !isPanda)
  )

  const showDialog = !!script && !!displayedText

  return (
    <group position={position} rotation={rotation}>
      <group ref={groupRef}>
        {/* Cushion */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.8, 0.2, 0.8]} />
          <meshStandardMaterial color="#ea580c" roughness={0.9} />
        </mesh>

        {/* Body (Orange robes) */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.6, 0.8, 0.4]} />
          <meshStandardMaterial color="#f97316" roughness={0.8} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.5} />
          </mesh>
          <mesh position={[-0.12, 0.05, 0.26]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="black" />
          </mesh>
          <mesh position={[0.12, 0.05, 0.26]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="black" />
          </mesh>
          <group position={[0, 0.05, 0.27]}>
            <mesh position={[-0.12, 0, 0]}>
              <torusGeometry args={[0.07, 0.015, 8, 24]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} />
            </mesh>
            <mesh position={[0.12, 0, 0]}>
              <torusGeometry args={[0.07, 0.015, 8, 24]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.015, 0.015]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} />
            </mesh>
          </group>
          <group position={[0, 0.16, 0.26]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.02, 0.1, 0.03]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
            <mesh position={[-0.03, 0, 0]}>
              <boxGeometry args={[0.01, 0.1, 0.03]} />
              <meshStandardMaterial color="#fef08a" />
            </mesh>
            <mesh position={[0.03, 0, 0]}>
              <boxGeometry args={[0.01, 0.1, 0.03]} />
              <meshStandardMaterial color="#fef08a" />
            </mesh>
          </group>
          <mesh position={[0, -0.15, 0.26]}>
            <boxGeometry args={[0.4, 0.3, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>

        {/* Arms */}
        <group ref={armLRef} position={[-0.4, 0.9, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color="#f97316" roughness={0.8} />
          </mesh>
        </group>
        <group ref={armRRef} position={[0.4, 0.9, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color="#f97316" roughness={0.8} />
          </mesh>
        </group>

        {/* Dialogue Box - Wider, typewriter style */}
        {showDialog && (
          <Html position={[0, 2.2, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              color: '#78350f',
              padding: '16px 20px',
              borderRadius: '16px',
              border: '3px solid #f59e0b',
              fontSize: '14px',
              fontWeight: '600',
              width: '340px',
              minHeight: '80px',
              textAlign: 'left',
              boxShadow: '0 8px 30px rgba(234, 88, 12, 0.35)',
              fontFamily: 'Georgia, serif',
              lineHeight: '1.6',
              position: 'relative',
              userSelect: 'none',
            }}>
              {/* Pujari label */}
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#b45309',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                🕉️ Pandit Ji
              </div>

              {/* Sentence text */}
              <div style={{ minHeight: '40px' }}>
                {displayedText}
                {isTyping && <span style={{ animation: 'blink 0.7s infinite', opacity: 1 }}>▌</span>}
              </div>

              {/* Progress dots */}
              {!showAction && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '10px', justifyContent: 'center' }}>
                  {script.sentences.map((_, i) => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: i <= sentenceIdx ? '#f59e0b' : '#d1d5db'
                    }} />
                  ))}
                </div>
              )}

              {/* Tap hint or action button */}
              {!showAction ? (
                <div style={{
                  marginTop: '8px', fontSize: '11px', color: '#a16207',
                  textAlign: 'right', opacity: 0.7
                }}>
                  {isTyping ? 'Speaking...' : 'Waiting...'}
                </div>
              ) : canAct ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onAction && onAction() }}
                  style={{
                    marginTop: '12px', width: '100%',
                    padding: '10px 0',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', border: 'none',
                    borderRadius: '10px', fontSize: '14px',
                    fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.5)',
                  }}
                >
                  {script.actionText}
                </button>
              ) : (
                <div style={{
                  marginTop: '10px', fontSize: '12px', color: '#92400e',
                  textAlign: 'center', fontStyle: 'italic'
                }}>
                  ⏳ Waiting...
                </div>
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
