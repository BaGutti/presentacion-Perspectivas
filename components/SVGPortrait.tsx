'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'

interface Props {
  src: string
  visible: boolean
  accent?: string
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 500): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, { cache: 'force-cache' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.text()
    } catch (_e) {
      if (i === retries - 1) throw new Error('Max retries reached')
      await new Promise((res) => setTimeout(res, delayMs * (i + 1)))
    }
  }
  throw new Error('Unreachable')
}

export default function SVGPortrait({ src, visible, accent = '#D4AF37' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const idleAnim = useRef<ReturnType<typeof animate> | null>(null)
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const srcRef = useRef(src)

  // ── Idle float ────────────────────────────────────────────────────────────────
  function startIdle(el: Element) {
    try { idleAnim.current?.pause() } catch {}
    idleAnim.current = animate(el, {
      translateY: [0, -14, 0],
      duration: 5000,
      loop: true,
      easing: 'easeInOutSine',
    })
  }

  // ── Entrance animation ────────────────────────────────────────────────────────
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
      container.style.opacity = '1'
      container.style.transition = 'opacity 0.3s ease'
      window.setTimeout(() => startIdle(svgEl), 2500)
    } else {
      svgEl.style.transformOrigin = 'center center'
      svgEl.style.transform = 'translateY(30px) scale(0.92)'
      svgEl.style.opacity = '0'
      container.style.opacity = '1'
      container.style.transition = 'opacity 0.3s ease'
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

  // ── Load SVG with retry ───────────────────────────────────────────────────────
  useEffect(() => {
    srcRef.current = src
    setSvgContent(null)
    setError(false)
    let cancelled = false

    fetchWithRetry(src)
      .then((html) => {
        if (cancelled) return
        setSvgContent(html)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
      })

    return () => { cancelled = true }
  }, [src])

  // ── Inject SVG and animate when content is ready ──────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container || !svgContent) return

    container.innerHTML = svgContent

    const svgEl = container.querySelector('svg')
    if (svgEl) {
      const width = svgEl.getAttribute('width')
      const height = svgEl.getAttribute('height')
      if (!width) svgEl.setAttribute('width', '100%')
      if (!height) svgEl.setAttribute('height', '100%')
      svgEl.style.width = '100%'
      svgEl.style.height = '100%'
      svgEl.style.overflow = 'visible'
    }

    startEntrance(container)
  }, [svgContent])

  // ── Re-trigger entrance when visibility changes ───────────────────────────────
  useEffect(() => {
    if (!visible || !svgContent || !containerRef.current) return
    startEntrance(containerRef.current)
  }, [visible, svgContent])

  return (
    <div
      ref={containerRef}
      className="svg-portrait"
      style={{
        color: accent,
        opacity: svgContent && visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      {error && (
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: `drop-shadow(0 0 28px ${accent}44)`,
          }}
        />
      )}
    </div>
  )
}
