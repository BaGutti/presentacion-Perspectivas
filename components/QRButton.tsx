'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'

export default function QRButton() {
  const [open, setOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setIsDesktop(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  useEffect(() => {
    if (!open || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, window.location.href, {
      width: 220,
      margin: 2,
      color: { dark: '#D4AF37', light: '#000000' },
    })
  }, [open])

  if (!isDesktop) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '1.2rem',
          right: '1.2rem',
          zIndex: 150,
          background: 'rgba(212,175,55,0.12)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 4,
          color: 'rgba(212,175,55,0.5)',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1rem',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(212,175,55,0.2)'
          e.currentTarget.style.color = 'rgba(212,175,55,0.9)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(212,175,55,0.12)'
          e.currentTarget.style.color = 'rgba(212,175,55,0.5)'
        }}
        aria-label="Abrir código QR"
      >
        ⣿
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#000',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 8,
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <canvas ref={canvasRef} style={{ display: 'block', marginBottom: '1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Escanea para abrir en tu celular
            </p>
          </div>
        </div>
      )}
    </>
  )
}
