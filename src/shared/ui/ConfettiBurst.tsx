import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  spin: number
  shape: 'rect' | 'circle' | 'ribbon'
  life: number
}

const PALETTES = [
  ['#b8462a', '#d0583a', '#a5854a', '#e8c977', '#f1ddd0', '#fffdf7'],
  ['#8b5cf6', '#b49bdc', '#e8c977', '#f4effb', '#a5854a'],
]

/**
 * Canvas confetti. Fires a burst whenever `burst` increments (1..n). When
 * `ambient` is on, a slow trickle of pieces keeps drifting down — used at the
 * cake finale. Pure visual layer; pointer-events stay off.
 */
export function ConfettiBurst({
  burst = 0,
  ambient = false,
  palette = 0,
  className,
}: {
  burst?: number
  ambient?: boolean
  palette?: number
  className?: string
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const frame = useRef(0)
  const burstSeen = useRef(0)
  const ambientOn = useRef(ambient)
  const ambientClock = useRef(0)
  const api = useRef<{
    spawn: (n: number, s: 'burst' | 'drift') => void
    ensureRunning: () => void
  } | null>(null)

  useEffect(() => {
    ambientOn.current = ambient
  }, [ambient])

  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const colors = PALETTES[palette % PALETTES.length]

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv!.width = cv!.clientWidth * dpr
      cv!.height = cv!.clientHeight * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    const observer = new ResizeObserver(size)
    observer.observe(cv)

    function spawn(count: number, spread: 'burst' | 'drift') {
      const w = cv!.clientWidth
      const h = cv!.clientHeight
      for (let i = 0; i < count; i++) {
        const burstUp = spread === 'burst'
        particles.current.push({
          x: burstUp
            ? w / 2 + (Math.random() - 0.5) * w * 0.25
            : Math.random() * w,
          y: burstUp ? h * 0.72 : -12 - Math.random() * 30,
          vx: burstUp ? (Math.random() - 0.5) * 7 : (Math.random() - 0.5) * 0.6,
          vy: burstUp
            ? -(4.5 + Math.random() * 6.5)
            : 0.5 + Math.random() * 0.8,
          size: burstUp ? 5 + Math.random() * 7 : 4 + Math.random() * 5,
          color: colors[(Math.random() * colors.length) | 0],
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.2,
          shape: (['rect', 'circle', 'ribbon'] as const)[
            (Math.random() * 3) | 0
          ],
          life: 0,
        })
      }
    }

    function tick() {
      const w = cv!.clientWidth
      const h = cv!.clientHeight
      ctx!.clearRect(0, 0, w, h)
      particles.current = particles.current.filter(
        (p) => p.y < h + 24 && p.life < 400,
      )
      for (const p of particles.current) {
        p.life++
        p.vy += 0.14
        p.vx *= 0.985
        p.x += p.vx + Math.sin((p.life + p.rotation * 60) / 22) * 0.5
        p.y += p.vy
        p.rotation += p.spin
        const fade = p.life > 300 ? 1 - (p.life - 300) / 100 : 1
        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.rotation)
        ctx!.globalAlpha = Math.max(fade, 0) * 0.92
        ctx!.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx!.beginPath()
          ctx!.arc(0, 0, p.size / 2.4, 0, Math.PI * 2)
          ctx!.fill()
        } else if (p.shape === 'ribbon') {
          ctx!.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3)
        } else {
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size * 0.72, p.size)
        }
        ctx!.restore()
      }
      if (ambientOn.current && !reduced && ++ambientClock.current % 14 === 0) {
        spawn(1, 'drift')
      }
      if (particles.current.length || (ambientOn.current && !reduced)) {
        frame.current = requestAnimationFrame(tick)
      } else {
        frame.current = 0
      }
    }
    function ensureRunning() {
      if (!frame.current) frame.current = requestAnimationFrame(tick)
    }
    api.current = { spawn, ensureRunning }
    if (ambient && !reduced) ensureRunning()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame.current)
      frame.current = 0
      api.current = null
    }
  }, [ambient, palette])

  useEffect(() => {
    if (burst === burstSeen.current) return
    burstSeen.current = burst
    if (burst <= 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    api.current?.spawn(90, 'burst')
    api.current?.ensureRunning()
  }, [burst])

  return <canvas ref={canvas} className={className} aria-hidden="true" />
}
