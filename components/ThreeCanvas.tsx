'use client'

import { useEffect, useRef, useCallback } from 'react'
import { sceneRegistry } from '@/three/scenes'

interface ThreeCanvasProps {
  slideId: number
}

export default function ThreeCanvas({ slideId }: ThreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const initScene = useCallback((id: number) => {
    if (!canvasRef.current) return
    // Cleanup previous scene
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    const sceneFactory = sceneRegistry[id]
    if (sceneFactory) {
      cleanupRef.current = sceneFactory(canvasRef.current)
    }
  }, [])

  useEffect(() => {
    initScene(slideId)

    const handleResize = () => {
      if (!canvasRef.current) return
      const w = window.innerWidth
      const h = window.innerHeight
      canvasRef.current.width = w * window.devicePixelRatio
      canvasRef.current.height = h * window.devicePixelRatio
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [slideId, initScene])

  return (
    <canvas
      ref={canvasRef}
      className="slide-canvas"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
