import React, { useEffect } from 'react'
import { usePlayerMovement } from '../hooks/usePlayerMovement'
import CharacterModel from './CharacterModel'
import FollowCamera from './FollowCamera'
import ProximityHearts from './ProximityHearts'

export default function Player({ socket, character, emote, chatFocused, joystickRef, speaking, frozen, remotePlayer, posRef: externalPosRef, rings, isSitting, weddingStage }) {
  const { meshRef, posRef, animRef, handleKeyDown, handleKeyUp } = usePlayerMovement(socket, character, joystickRef, frozen, externalPosRef, isSitting, weddingStage)

  useEffect(() => {
    if (frozen) return
    const kd = (e) => { if (!chatFocused) handleKeyDown(e) }
    const ku = (e) => { if (!chatFocused) handleKeyUp(e) }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [handleKeyDown, handleKeyUp, chatFocused, frozen])

  return (
    <>
      {/* Follow camera only when NOT in camera mode */}
      {!frozen && <FollowCamera playerRef={meshRef} />}

      <group ref={meshRef}>
        <CharacterModel
          character={character}
          animRef={animRef}
          emote={emote}
          name={character === 'panda' ? '🐼 Panda' : '🐧 Penguin'}
          speaking={speaking}
          rings={rings}
          isSitting={isSitting}
          weddingStage={weddingStage}
        />
      </group>

      <ProximityHearts localPosRef={posRef} remotePlayer={remotePlayer} />
    </>
  )
}
