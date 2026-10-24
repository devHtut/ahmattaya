import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { OpeningConfig } from '../models/opening'
import { resolveFontFamily } from '../fonts/fonts-catalog'

export function OpeningInvitation({
  opening,
  receiverName,
  senderName,
  withMusic = false,
  musicEnabled = true,
  onMusicToggle,
  onActivate,
  onOpened,
}: {
  opening: OpeningConfig
  receiverName: string
  senderName: string
  withMusic?: boolean
  musicEnabled?: boolean
  onMusicToggle?: (enabled: boolean) => void
  onActivate?: () => void
  onOpened?: () => void
}) {
  const [phase, setPhase] = useState<'closed' | 'opening'>('closed')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  function open() {
    if (phase === 'opening') return
    onActivate?.()
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reducedMotion || opening.animation === 'none') {
      onOpened?.()
      return
    }
    setPhase('opening')
    timer.current = setTimeout(() => {
      setPhase('closed')
      onOpened?.()
    }, 750)
  }
  const style = {
    '--opening-bg': opening.background,
    '--opening-color': opening.color,
    '--opening-seal': opening.sealColor,
    '--opening-text': opening.textColor,
  } as CSSProperties

  const titleStyle: CSSProperties = opening.titleFont
    ? { fontFamily: resolveFontFamily(opening.titleFont) }
    : {}
  const messageStyle: CSSProperties = opening.messageFont
    ? { fontFamily: resolveFontFamily(opening.messageFont) }
    : {}
  const buttonStyle: CSSProperties = opening.buttonFont
    ? { fontFamily: resolveFontFamily(opening.buttonFont) }
    : {}

  const kickerText = (opening.kicker ?? 'A LITTLE SURPRISE FOR YOU').trim()

  return (
    <section
      className={`opening-invitation opening-${opening.style} motion-${opening.animation} phase-${phase}`}
      style={style}
      aria-label="အဖွင့်ဖိတ်စာ"
    >
      {opening.showKicker !== false && kickerText && (
        <span className="opening-kicker">{kickerText}</span>
      )}
      <p className="opening-recipient">{receiverName || 'ချစ်ရသူလေး'} အတွက်</p>
      <div className="opening-art" aria-hidden="true">
        <div className="opening-note">{opening.emoji}</div>
        <div className="opening-pocket" />
        <div className="opening-flap" />
        {opening.style === 'gate' && <div className="opening-flap-right" />}
        {opening.style === 'scroll' && (
          <div className="opening-scroll-roller bottom" />
        )}
        <div className="opening-seal">{opening.emoji}</div>

        {opening.animation === 'sparkles' && (
          <div className="opening-sparkles">
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={index}
                style={
                  {
                    '--spark-x': `${((index % 4) - 1.5) * 64}px`,
                    '--spark-y': `${-40 - Math.floor(index / 4) * 45}px`,
                    '--spark-rotation': `${index * 37}deg`,
                    '--spark-delay': `${(index % 3) * 50}ms`,
                  } as CSSProperties
                }
              >
                {index % 2 ? '✨' : opening.emoji}
              </span>
            ))}
          </div>
        )}

        {opening.animation === 'confetti' && (
          <div className="opening-confetti-burst">
            {Array.from({ length: 24 }, (_, index) => {
              const colors = [
                '#f43f5e',
                '#ec4899',
                '#8b5cf6',
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#f97316',
              ]
              return (
                <span
                  key={index}
                  style={
                    {
                      '--confetti-color': colors[index % colors.length],
                      '--confetti-x': `${Math.cos((index / 24) * 2 * Math.PI) * (60 + (index % 5) * 25)}px`,
                      '--confetti-y': `${Math.sin((index / 24) * 2 * Math.PI) * (50 + (index % 4) * 20)}px`,
                      '--confetti-rot': `${index * 45}deg`,
                      '--confetti-delay': `${(index % 4) * 40}ms`,
                    } as CSSProperties
                  }
                />
              )
            })}
          </div>
        )}

        {opening.animation === 'hearts' && (
          <div className="opening-hearts-burst">
            {Array.from({ length: 14 }, (_, index) => {
              const hearts = ['💖', '💕', '💗', '💓', '✨', '🌸']
              return (
                <span
                  key={index}
                  style={
                    {
                      '--heart-x': `${((index % 5) - 2) * 55}px`,
                      '--heart-y': `${-40 - Math.floor(index / 3) * 40}px`,
                      '--heart-scale': `${0.8 + (index % 3) * 0.3}`,
                      '--heart-delay': `${(index % 4) * 60}ms`,
                    } as CSSProperties
                  }
                >
                  {hearts[index % hearts.length]}
                </span>
              )
            })}
          </div>
        )}

        {opening.animation === 'glow' && (
          <div className="opening-glow-rings">
            <span className="glow-ring glow-1" />
            <span className="glow-ring glow-2" />
          </div>
        )}
      </div>

      <h2 style={titleStyle}>{opening.title || 'သင့်အတွက် အမှတ်တရလေး'}</h2>
      <p className="opening-message" style={messageStyle}>
        {opening.message}
      </p>
      <p className="opening-sender">
        ချစ်ခြင်းများစွာဖြင့် · {senderName || 'သင့်အမည်'}
      </p>
      <button
        className="opening-button"
        style={buttonStyle}
        disabled={phase === 'opening'}
        onClick={open}
      >
        {phase === 'opening'
          ? 'ဖွင့်နေပါတယ်…'
          : opening.buttonText.trim() || 'ဖွင့်ကြည့်မယ်'}
      </button>
      {withMusic && (
        <label className="opening-music-note">
          <input
            type="checkbox"
            checked={musicEnabled}
            onChange={(e) => onMusicToggle?.(e.target.checked)}
          />{' '}
          ♫ သံစဉ်ပါ ဖွင့်မယ်
        </label>
      )}
    </section>
  )
}
