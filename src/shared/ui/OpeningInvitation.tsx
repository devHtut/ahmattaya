import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { OpeningConfig } from '../models/opening'

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
  return (
    <section
      className={`opening-invitation opening-${opening.style} motion-${opening.animation} phase-${phase}`}
      style={style}
      aria-label="အဖွင့်ဖိတ်စာ"
    >
      <span className="opening-kicker">A LITTLE SURPRISE FOR YOU</span>
      <p className="opening-recipient">{receiverName || 'ချစ်ရသူလေး'} အတွက်</p>
      <div className="opening-art" aria-hidden="true">
        <div className="opening-note">{opening.emoji}</div>
        <div className="opening-pocket" />
        <div className="opening-flap" />
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
      </div>
      <h2>{opening.title || 'သင့်အတွက် အမှတ်တရလေး'}</h2>
      <p className="opening-message">{opening.message}</p>
      <p className="opening-sender">
        ချစ်ခြင်းများစွာဖြင့် · {senderName || 'သင့်အမည်'}
      </p>
      <button
        className="opening-button"
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
