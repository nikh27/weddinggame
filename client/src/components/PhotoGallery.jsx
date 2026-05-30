import React, { useState, useEffect, useCallback } from 'react'

export default function PhotoGallery({ onClose }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/photos')
      const data = await r.json()
      setPhotos(data)
    } catch (e) {
      setPhotos([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadPhotos() }, [loadPhotos])

  const deletePhoto = async (filename, e) => {
    e.stopPropagation()
    try {
      await fetch(`/api/photos/${filename}`, { method: 'DELETE' })
      setPhotos(prev => prev.filter(p => p.filename !== filename))
      if (selected?.filename === filename) setSelected(null)
    } catch (e) {}
  }

  const download = (url, filename) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  const downloadAll = () => {
    photos.forEach((p, i) => {
      setTimeout(() => download(p.url, p.filename), i * 300)
    })
  }

  return (
    <div className="gallery-overlay" onClick={onClose}>
      <div className="gallery-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="gallery-header">
          <span>📸 Memories ({photos.length})</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {photos.length > 0 && (
              <button className="gallery-dl-all-btn" onClick={downloadAll} title="Download all">
                ⬇ All
              </button>
            )}
            <button className="gallery-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="gallery-empty">Loading memories... ✨</div>
        ) : photos.length === 0 ? (
          <div className="gallery-empty">No photos yet 📷<br />
            <span style={{ fontSize: '0.78rem', opacity: 0.5 }}>Take one in camera mode!</span>
          </div>
        ) : (
          <div className="gallery-grid">
            {photos.map((p) => (
              <div key={p.filename} className="gallery-thumb-wrap" onClick={() => setSelected(p)}>
                <img src={p.url} alt={p.filename} className="gallery-thumb" loading="lazy" />
                <button
                  className="gallery-thumb-del"
                  onClick={e => deletePhoto(p.filename, e)}
                  title="Delete"
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Full screen view */}
        {selected && (
          <div className="gallery-fullview" onClick={() => setSelected(null)}>
            <img src={selected.url} alt="Memory" className="gallery-full-img" />
            <div className="gallery-full-actions" onClick={e => e.stopPropagation()}>
              <button className="gallery-dl-btn" onClick={() => download(selected.url, selected.filename)}>
                ⬇ Download
              </button>
              <button className="gallery-close-full" onClick={() => setSelected(null)}>
                ✕ Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
