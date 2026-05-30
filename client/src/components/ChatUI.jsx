import React, { useState, useRef, useEffect, useCallback } from 'react'

export default function ChatUI({ messages, onSend, onFocusChange }) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)   // whether history log is visible
  const [toasts, setToasts] = useState([])  // floating messages (disappear 3s)
  const inputRef = useRef(null)
  const logRef = useRef(null)
  const wrapRef = useRef(null)

  // When new message arrives → add as toast
  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    const toastId = last.id
    setToasts(prev => {
      // Avoid duplicates
      if (prev.find(t => t.id === toastId)) return prev
      return [...prev.slice(-3), { ...last, toastId }]
    })
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    }, 3000)
    return () => clearTimeout(timer)
  }, [messages])

  // Auto scroll log
  useEffect(() => {
    if (logRef.current && open) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages, open])

  // Click outside → close log
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        onFocusChange(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('pointerdown', onClick)
    return () => document.removeEventListener('pointerdown', onClick)
  }, [onFocusChange])

  // Enter key → open log
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && !open) {
        e.preventDefault()
        setOpen(true)
        onFocusChange(true)
        setTimeout(() => inputRef.current?.focus(), 60)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
        onFocusChange(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onFocusChange])

  const openChat = useCallback(() => {
    setOpen(true)
    onFocusChange(true)
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [onFocusChange])

  const send = useCallback(() => {
    const msg = input.trim()
    if (!msg) return
    onSend(msg)
    setInput('')
    inputRef.current?.focus()
  }, [input, onSend])

  const onKeyDown = (e) => {
    e.stopPropagation()
    if (e.key === 'Enter') { e.preventDefault(); send() }
    if (e.key === 'Escape') { setOpen(false); onFocusChange(false); inputRef.current?.blur() }
  }

  return (
    <div className="chat-wrap" ref={wrapRef}>
      {/* Floating toast messages (3 sec) */}
      {!open && (
        <div className="chat-toasts">
          {toasts.map(t => (
            <div key={t.id} className="chat-toast">
              <span className={`chat-name ${t.character}`}>
                {t.character === 'panda' ? '🐼' : '🐧'}
              </span>
              <span className="chat-text">{t.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable history (only when open) */}
      {open && messages.length > 0 && (
        <div className="chat-log" ref={logRef}>
          {messages.map(m => (
            <div key={m.id} className="chat-msg">
              <span className={`chat-name ${m.character}`}>
                {m.character === 'panda' ? '🐼' : '🐧'}
              </span>
              <span className="chat-text">{m.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input bar — always visible */}
      <div className="chat-bar" onClick={!open ? openChat : undefined}>
        <input
          ref={inputRef}
          className={`chat-input ${open ? 'active' : ''}`}
          type="text"
          placeholder={open ? 'Type a message...' : '💬 Chat...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => { setOpen(true); onFocusChange(true) }}
          maxLength={120}
          readOnly={!open}
        />
        {open && (
          <button className="chat-send-btn" onClick={send} onTouchEnd={e => { e.preventDefault(); send() }}>
            ➤
          </button>
        )}
      </div>
    </div>
  )
}
