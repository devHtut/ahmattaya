import { useEffect, useMemo, useState, type CSSProperties } from 'react'

const CELEBRATION_EMOJIS = ['✨', '🌸', '💖', '⭐', '🕊️', '🎉', '💫', '💌']

interface Particle {
  id: number
  emoji: string
  left: number // 0 to 100 percentage
  driftX: number // px to drift horizontally
  duration: number // seconds
  delay: number // seconds
  size: number // rem
  opacity: number
}

interface TapParticle {
  id: number
  x: number
  y: number
  emoji: string
}

function generateParticles(primaryEmoji?: string): Particle[] {
  // Deterministic formula instead of Math.random() in render to pass linter and remain pure.
  const emojis = primaryEmoji
    ? [primaryEmoji, ...CELEBRATION_EMOJIS, primaryEmoji]
    : CELEBRATION_EMOJIS

  const count = 16
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const emoji = emojis[i % emojis.length]
    // Spread evenly across the width with staggered offsets
    const left = Math.round(((i * 6.25 + 3.5) % 94) + 3)
    const driftX = ((i % 5) - 2) * 22
    const duration = 12 + (i % 7) * 2.5 // 12s to 27s slow, gentle float
    const delay = ((i * 1.7) % 14) * 0.9 // staggered entry
    const size = 1.1 + (i % 4) * 0.35 // 1.1rem to 2.15rem
    const opacity = 0.4 + (i % 3) * 0.18 // 0.4 to 0.76

    particles.push({
      id: i,
      emoji,
      left,
      driftX,
      duration,
      delay,
      size,
      opacity,
    })
  }
  return particles
}

export function FloatingEmojis({
  emoji,
  active = true,
}: {
  emoji?: string
  active?: boolean
}) {
  const particles = useMemo(() => generateParticles(emoji), [emoji])
  const [tapParticles, setTapParticles] = useState<TapParticle[]>([])

  useEffect(() => {
    if (!active) return

    let nextId = 0
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // Ignore clicks on buttons, inputs, links, canvas, or dialogs
      if (
        target.closest(
          'button, a, input, textarea, select, canvas, dialog, [role="button"]',
        )
      ) {
        return
      }

      const clientX = e.clientX
      const clientY = e.clientY
      if (clientX === undefined || clientY === undefined) return

      const tapEmoji = emoji || '💖'
      const id = ++nextId
      setTapParticles((prev) => [
        ...prev.slice(-5),
        { id, x: clientX, y: clientY, emoji: tapEmoji },
      ])

      setTimeout(() => {
        setTapParticles((prev) => prev.filter((p) => p.id !== id))
      }, 1400)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [active, emoji])

  if (!active) return null

  return (
    <div
      className="floating-emojis-container"
      aria-hidden="true"
      role="presentation"
    >
      {particles.map((p) => {
        const style: CSSProperties = {
          left: `${p.left}%`,
          fontSize: `${p.size}rem`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          ['--drift-x' as string]: `${p.driftX}px`,
          ['--max-opacity' as string]: p.opacity,
        }
        return (
          <span key={p.id} className="floating-emoji" style={style}>
            {p.emoji}
          </span>
        )
      })}
      {tapParticles.map((t) => (
        <span
          key={t.id}
          className="tap-emoji-reaction"
          style={{
            left: `${t.x}px`,
            top: `${t.y}px`,
          }}
        >
          {t.emoji}
        </span>
      ))}
    </div>
  )
}
