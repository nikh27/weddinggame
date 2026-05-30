import { useThree } from '@react-three/fiber'
import { useRef, useLayoutEffect } from 'react'

/**
 * Registers a capture function via captureRef.
 * Uses double-RAF to wait for R3F to draw the current frame,
 * then reads toDataURL from the preserved buffer.
 * NO useFrame priority = R3F keeps rendering normally.
 */
export default function CaptureHelper({ captureRef }) {
  const { gl } = useThree()
  const glRef = useRef(gl)
  glRef.current = gl   // always up-to-date, no stale closure

  useLayoutEffect(() => {
    captureRef.current = (callback) => {
      // Wait 2 animation frames: R3F finishes this frame, then we read
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            const url = glRef.current.domElement.toDataURL('image/jpeg', 0.92)
            callback(url)
          } catch (e) {
            console.warn('[Capture] toDataURL failed:', e)
          }
        })
      })
    }
  }, [captureRef])

  return null
}
