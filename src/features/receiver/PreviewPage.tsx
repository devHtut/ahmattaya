import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, RotateCcw } from 'lucide-react'
import type { CardConfig } from '../../shared/models/card'
import { useMusicTrack } from '../../shared/audio/useMusicTrack'
import { FloatingAudio } from '../../shared/audio/FloatingAudio'
import { CardPreview } from '../../shared/ui/CardPreview'
import { ConfettiBurst } from '../../shared/ui/ConfettiBurst'
import { useReveal } from '../../shared/ui/useReveal'
import { CakePreview } from '../cake/components/CakePreview'
import { OpeningInvitation } from '../../shared/ui/OpeningInvitation'

function ScrollHint({ target }: { target: string }) {
  return (
    <a
      className="scroll-hint"
      href={`#${target}`}
      aria-label="နောက်အပိုင်းသို့ သွားမယ်"
    >
      <ChevronDown size={18} />
      <span>ဆက်ကြည့်မယ်</span>
    </a>
  )
}

function Reveal({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}

export function PreviewPage({ card }: { card: CardConfig }) {
  const [opened, setOpened] = useState(false)
  const [burst, setBurst] = useState(0)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [musicBlocked, setMusicBlocked] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const pageRoot = useRef<HTMLElement>(null)
  const replayRequested = useRef(false)
  const contentsHeading = useRef<HTMLHeadingElement>(null)
  const alive = useRef(false)
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    track,
    failed: audioMissing,
    loading: audioLoading,
  } = useMusicTrack(card.music)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (burstTimer.current) clearTimeout(burstTimer.current)
    }
  }, [])
  useEffect(() => {
    if (opened) contentsHeading.current?.focus()
    else if (replayRequested.current) {
      pageRoot.current
        ?.querySelector<HTMLButtonElement>('.opening-button')
        ?.focus()
      replayRequested.current = false
    }
  }, [opened])
  const handleOpened = useCallback(() => {
    setOpened(true)
    // Give the opening transition a beat, then the reveal burst.
    burstTimer.current = setTimeout(() => {
      if (alive.current) setBurst((n) => n + 1)
    }, 420)
  }, [])
  function activate() {
    if (!track || !card.opening.musicOnOpen || !musicEnabled || !audio.current)
      return
    // Keep play() inside the receiver's click gesture, before the visual reveal.
    const promise = audio.current.play()
    promise
      .then(() => {
        if (alive.current) setMusicBlocked(false)
      })
      .catch(() => {
        if (alive.current) setMusicBlocked(true)
      })
  }
  function replay() {
    if (audio.current) {
      audio.current.pause()
      if (audio.current.readyState > 0) audio.current.currentTime = 0
    }
    if (burstTimer.current) clearTimeout(burstTimer.current)
    setBurst(0)
    replayRequested.current = true
    setOpened(false)
    setMusicBlocked(false)
    pageRoot.current?.scrollTo({ top: 0, behavior: 'instant' })
  }
  const accent = card.appearance.colors.accent
  return (
    <main
      ref={pageRoot}
      id="main-content"
      className={`receiver-story ${opened ? 'is-opened' : 'is-sealed'}`}
      style={{ ['--card-accent' as string]: accent }}
    >
      {track && (
        <div className="story-audio" hidden={!opened}>
          <FloatingAudio
            key={track.id}
            track={track}
            music={card.music}
            audioRef={audio}
          />
          {musicBlocked && (
            <p role="status" className="music-start-hint">
              အသံဖွင့်ဖို့ Play ကို နှိပ်ပေးပါ။
            </p>
          )}
        </div>
      )}
      {!opened && (
        <section className="story-scene scene-opening">
          <p className="pill">နမူနာသာ ဖြစ်ပါတယ် · Publish မလုပ်ရသေးပါ</p>
          <OpeningInvitation
            opening={card.opening}
            receiverName={card.receiverName}
            senderName={card.senderName}
            withMusic={Boolean(track && card.opening.musicOnOpen)}
            musicEnabled={musicEnabled}
            onMusicToggle={setMusicEnabled}
            onActivate={activate}
            onOpened={handleOpened}
          />
          {(audioMissing || audioLoading) && (
            <p role="status" className="music-start-hint">
              {audioMissing
                ? 'သီချင်းဖိုင်ကို ဖွင့်မရပါ။ ကတ်ကို ဆက်ဖတ်နိုင်ပါတယ်။'
                : 'သီချင်းဖိုင်ကို ပြင်ဆင်နေပါတယ်။ ဖွင့်ပြီးနောက် Play ကို နှိပ်နိုင်ပါတယ်။'}
            </p>
          )}
        </section>
      )}
      {opened && (
        <>
          <ConfettiBurst
            className="story-confetti"
            burst={burst}

            palette={card.opening.style === 'gift' ? 1 : 0}
          />

          <section id="story-cover" className="story-scene scene-cover">
            <Reveal className="reveal-cover">
              <h1
                className="receiver-content-heading"
                ref={contentsHeading}
                tabIndex={-1}
              >
                {card.receiverName || 'ချစ်ရသူလေး'} အတွက် အမှတ်တရလေး
              </h1>
              <div className="story-card">
                <CardPreview card={card} />
              </div>
            </Reveal>
            <ScrollHint
              target={
                card.pages[0]
                  ? `story-page-${card.pages[0].id}`
                  : card.cake.enabled
                    ? 'story-cake'
                    : 'story-end'
              }
            />
          </section>

          {card.pages.map((page, index) => (
            <section
              id={`story-page-${page.id}`}
              className="story-scene scene-page"
              key={page.id}
              aria-label={`စာမျက်နှာ ${index + 2}`}
            >
              <Reveal>
                <p className="scene-kicker">
                  အမှတ်တရ {index + 1} / {card.pages.length}
                </p>
                <div className="story-card">
                  <CardPreview card={card} pageId={page.id} />
                </div>
              </Reveal>
              <ScrollHint
                target={
                  card.pages[index + 1]
                    ? `story-page-${card.pages[index + 1].id}`
                    : card.cake.enabled
                      ? 'story-cake'
                      : 'story-end'
                }
              />
            </section>
          ))}

          {card.cake.enabled && (
            <section
              id="story-cake"
              className="story-scene scene-cake"
              aria-label="သင့်အတွက် Cake"
            >
              <Reveal>
                <p className="scene-kicker">နောက်ဆုံး အံ့ဩစရာ</p>
                <h2 className="cake-scene-title">
                  {card.receiverName || 'သင့်'} အတွက် Cake လေး 🎂
                </h2>
                <div className="story-cake">
                  <CakePreview recipe={card.cake} />
                </div>
                <p className="cake-wish">
                  ကိတ်လေးကို လှည့်ကြည့်ရင်း ဆုတောင်းလေး တောင်းလိုက်ပါ ✨
                </p>
              </Reveal>
            </section>
          )}

          <section id="story-end" className="story-scene scene-end">
            <Reveal>
              <p className="end-mark">အမှတ်တရ · AhMatTaYa</p>
              <p className="end-line">
                ဒီကတ်လေးကို {card.senderName || 'သင့်ချစ်ရသူ'} က သင့်အတွက်သာ
                လက်နဲ့ဖန်တီးပေးထားတာပါ။
              </p>
              <div className="end-actions">
                <button className="button secondary" onClick={replay}>
                  <RotateCcw size={14} /> ဖိတ်စာ ပြန်ကြည့်မယ်
                </button>
                <Link className="button primary" to="/create">
                  ကတ်ကို ပြန်ပြင်မယ်
                </Link>
              </div>
            </Reveal>
          </section>
        </>
      )}
    </main>
  )
}
