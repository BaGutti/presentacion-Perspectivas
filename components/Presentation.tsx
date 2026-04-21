'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { slides } from '@/lib/slides'
import ThreeCanvas from './ThreeCanvas'
import HUD from './HUD'
import SVGPortrait from './SVGPortrait'
import QRButton from './QRButton'

const TOTAL = slides.length
const TRANSITION_MS = 700

export default function Presentation() {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [textVisible, setTextVisible] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const lockedRef = useRef(false)

  const slide = slides[current]

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('currentSlide')
    if (saved) {
      const idx = parseInt(saved, 10)
      if (!isNaN(idx) && idx >= 0 && idx < TOTAL) {
        setCurrent(idx)
      }
    }
  }, [])

  // Save to localStorage when slide changes
  useEffect(() => {
    localStorage.setItem('currentSlide', current.toString())
  }, [current])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goTo = useCallback((idx: number) => {
    if (lockedRef.current) return
    if (idx < 0 || idx >= TOTAL) return
    lockedRef.current = true
    setTransitioning(true)
    setTextVisible(false)
    setShowMenu(false)

    setTimeout(() => {
      setCurrent(idx)
      setTransitioning(false)
      setTimeout(() => {
        setTextVisible(true)
        lockedRef.current = false
      }, 200)
    }, TRANSITION_MS)
  }, [])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [next, prev])

  // ── Trackpad wheel gestures ────────────────────────────────────────────────
  useEffect(() => {
    let accumX = 0
    let lastEventTime = 0
    let inCooldown = false
    let cooldownTimer: NodeJS.Timeout | null = null
    
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now()
      
      if (inCooldown) {
        return
      }
      
      // Reset if pause between gestures (800ms)
      if (now - lastEventTime > 800) {
        accumX = 0
      }
      lastEventTime = now
      
      accumX += e.deltaX
      
      if (Math.abs(accumX) > 200) {
        inCooldown = true
        
        if (accumX > 0) {
          next()
        } else {
          prev()
        }
        
        if (cooldownTimer) clearTimeout(cooldownTimer)
        
        // After triggering, ignore ALL wheel events for 2 seconds
        cooldownTimer = setTimeout(() => {
          inCooldown = false
          accumX = 0
        }, 2000)
      }
    }
    
    document.addEventListener('wheel', handleWheel, { passive: true })
    return () => {
      document.removeEventListener('wheel', handleWheel)
      if (cooldownTimer) clearTimeout(cooldownTimer)
    }
  }, [next, prev])

  // Prevent browser swipe navigation
  useEffect(() => {
    const handleBeforeunload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeunload)
    return () => window.removeEventListener('beforeunload', handleBeforeunload)
  }, [])

  // ── Click to advance ─────────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    const x = e.clientX / window.innerWidth
    if (x > 0.5) next()
    else prev()
  }, [next, prev])

  // ── Swipe navigation ─────────────────────────────────────────────────────────
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDx < 40 || absDx < absDy) {
      touchStartRef.current = null
      return
    }
    if (dx > 0) prev()
    else next()
    touchStartRef.current = null
  }, [next, prev])

  // ── Custom cursor ────────────────────────────────────────────────────────────
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!cursorRef.current) return
      cursorRef.current.style.left = `${e.clientX}px`
      cursorRef.current.style.top = `${e.clientY}px`
      // Change cursor hint based on position
      const x = e.clientX / window.innerWidth
      cursorRef.current.style.transform = `translate(-50%,-50%) scale(${x > 0.5 ? 1.2 : 0.9})`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div id="slide-container" style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#000', position: 'relative' }}>
      {/* Custom cursor */}
      <div ref={cursorRef} className="custom-cursor" />

      {/* Three.js canvas */}
      <ThreeCanvas slideId={slide.id} />

      {/* Transition overlay */}
      <div
        ref={overlayRef}
        className="transition-overlay"
        style={{
          opacity: transitioning ? 1 : 0,
          transition: `opacity ${TRANSITION_MS * 0.5}ms ease`,
          pointerEvents: transitioning ? 'auto' : 'none',
        }}
      />

      {/* Click zones */}
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', inset: 0, zIndex: 5,
        }}
      />

      {/* SVG Portrait — right side, animated with Anime.js */}
      {slide.svgFile && (
        <SVGPortrait
          src={`/portraits/${slide.svgFile}`}
          visible={textVisible}
          accent={slide.accent}
        />
      )}

      {/* Slide text content */}
      <div
        className={`slide-content${slide.svgFile ? ' has-portrait' : ''}`}
        style={{
          opacity: textVisible ? 1 : 0,
          transition: `opacity ${TRANSITION_MS * 0.6}ms ease`,
          transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
          transitionProperty: 'opacity, transform',
        }}
      >
        <div
          className="slide-chapter"
          style={{
            opacity: textVisible ? 1 : 0,
            color: slide.accent || '#D4AF37',
            transition: `opacity ${TRANSITION_MS}ms ease ${TRANSITION_MS * 0.1}ms`,
          }}
        >
          {slide.chapter}
        </div>

        <h1
          className={`slide-title${[10, 15, 17].includes(slide.id) ? ' text-reduced' : ''}`}
          style={{
            opacity: textVisible ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms ease ${TRANSITION_MS * 0.2}ms, transform ${TRANSITION_MS}ms ease ${TRANSITION_MS * 0.2}ms`,
            transform: textVisible ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          {slide.title}
        </h1>

        <p
          className={`slide-subtitle${[10, 15, 17].includes(slide.id) ? ' text-reduced' : ''}`}
          style={{
            opacity: textVisible ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms ease ${TRANSITION_MS * 0.3}ms`,
          }}
        >
          {slide.subtitle}
        </p>

        <div
          className="slide-keywords"
          style={{
            opacity: textVisible ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms ease ${TRANSITION_MS * 0.4}ms`,
          }}
        >
          {slide.keywords.map((kw) => (
            <span key={kw} className="slide-keyword" style={{ borderColor: `${slide.accent}66` || 'rgba(212,175,55,0.3)' }}>
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Nav arrows */}
      {current > 0 && (
        <button
          className="nav-arrow nav-prev"
          onClick={(e) => { e.stopPropagation(); prev() }}
          aria-label="Anterior"
        >
          ‹
        </button>
      )}
      {current < TOTAL - 1 && (
        <button
          className="nav-arrow nav-next"
          onClick={(e) => { e.stopPropagation(); next() }}
          aria-label="Siguiente"
        >
          ›
        </button>
      )}

      {/* HUD */}
      <HUD current={current + 1} total={TOTAL} title={slide.chapter} onCounterClick={() => setShowMenu(!showMenu)} />

      {/* Slide picker menu */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowMenu(false)}
        >
          <div
            style={{
              background: '#111',
              padding: '2rem',
              borderRadius: '8px',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid #333',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#D4AF37', marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>
              Ir a diapositiva
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  style={{
                    padding: '0.5rem',
                    background: i === current ? '#D4AF37' : '#222',
                    color: i === current ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMenu(false)}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.5rem',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* QR button — only on first slide, desktop only */}
      {current === 0 && <QRButton />}
    </div>
  )
}
