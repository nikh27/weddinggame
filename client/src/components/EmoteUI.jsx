import React from 'react'

const EMOTES = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👋', label: 'Wave' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '😂', label: 'Laugh' },
]

export default function EmoteUI({ onEmote }) {
  return (
    <div className="emote-container">
      {EMOTES.map(({ emoji, label }) => (
        <button
          key={emoji}
          className="emote-btn"
          onClick={() => onEmote(emoji)}
          title={label}
          aria-label={label}
          onTouchEnd={(e) => { e.preventDefault(); onEmote(emoji); }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
