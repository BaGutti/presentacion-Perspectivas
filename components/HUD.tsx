'use client'

interface HUDProps {
  current: number
  total: number
  title: string
  onCounterClick?: () => void
}

export default function HUD({ current, total, title, onCounterClick }: HUDProps) {
  const progress = (current / total) * 100

  return (
    <>
      {/* Top bar */}
      <div className="hud">
        <span 
          className="hud-counter" 
          onClick={onCounterClick}
          style={{ cursor: onCounterClick ? 'pointer' : 'default' }}
        >
          {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="hud-title">{title}</span>
        <span className="hud-counter" style={{ color: 'rgba(212,175,55,0.3)' }}>
          Historia de la Pedagogía
        </span>
      </div>

      {/* Bottom progress bar */}
      <div
        className="hud-progress-bar"
        style={{ width: `${progress}%` }}
      />
    </>
  )
}
