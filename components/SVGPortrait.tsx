'use client'

import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

interface Props {
  src: string
  visible: boolean
  accent?: string
}

export default function SVGPortrait({ src, visible, accent = '#D4AF37' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedSrc = useRef('')
  const idleAnim = useRef<ReturnType<typeof animate> | null>(null)

  // ── Idle float (shared by both modes) ────────────────────────────────────────
  function startIdle(el: Element) {
    try { idleAnim.current?.pause() } catch {}
    idleAnim.current = animate(el, {
      translateY: [0, -14, 0],
      duration: 5000,
      loop: true,
      easing: 'easeInOutSine',
    })
  }

  // ── Entrance — auto-detects fill-based vs stroke-based SVG ───────────────────
  function startEntrance(container: HTMLDivElement) {
    try { idleAnim.current?.pause() } catch {}

    const svgEl = container.querySelector<SVGSVGElement>('svg')
    if (!svgEl) return

    const shapes = Array.from(
      container.querySelectorAll<SVGGeometryElement>(
        'path, line, polyline, polygon, circle, ellipse, rect'
      )
    )
    if (!shapes.length) return

    const isLineart =
      shapes.length < 120 &&
      shapes.some((s) => {
        const stroke = s.getAttribute('stroke') ?? ''
        const style = s.getAttribute('style') ?? ''
        return stroke === 'currentColor' || style.includes('stroke:currentColor')
      })

    if (isLineart) {
      shapes.forEach((el) => {
        const len = el.getTotalLength ? Math.ceil(el.getTotalLength()) : 300
        el.style.strokeDasharray = `${len}`
        el.style.strokeDashoffset = `${len}`
        el.style.opacity = '0'
      })
      animate(shapes, {
        strokeDashoffset: 0,
        opacity: 1,
        duration: 2000,
        easing: 'easeInOutCubic',
        delay: stagger(30, { start: 200 }),
      })
      window.setTimeout(() => startIdle(svgEl), 2500)
    } else {
      svgEl.style.opacity = '0'
      svgEl.style.transformOrigin = 'center center'
      animate(svgEl, {
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.92, 1],
        duration: 1400,
        easing: 'easeOutExpo',
        delay: 200,
      })
      window.setTimeout(() => startIdle(svgEl), 1800)
    }
  }

  // ── Load SVG when src changes ─────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    try { idleAnim.current?.pause() } catch {}
    container.innerHTML = ''
    loadedSrc.current = ''

    let cancelled = false

    fetch(src)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((html) => {
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = html

        const svgEl = containerRef.current.querySelector('svg')
        if (svgEl) {
          svgEl.removeAttribute('width')
          svgEl.removeAttribute('height')
          svgEl.style.cssText = 'width:100%;height:100%;overflow:visible;opacity:0;'
        }

        loadedSrc.current = src
        if (visible) startEntrance(containerRef.current)
      })
      .catch(() => {
        // SVG not found — slide shows no portrait, 3D scene fills the space
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // ── Re-trigger entrance when slide becomes visible ────────────────────────────
  useEffect(() => {
    if (!visible || !loadedSrc.current || !containerRef.current) return
    startEntrance(containerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  return (
    <div
      ref={containerRef}
      className="svg-portrait"
      style={{
        color: accent,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  )
}
