import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, RotateCcw } from 'lucide-react'
import type { CardConfig } from '../../shared/models/card'
import { useMusicTrack } from '../../shared/audio/useMusicTrack'
import { FloatingAudio } from '../../shared/audio/FloatingAudio'
import { CardPreview } from '../../shared/ui/CardPreview'
import { ConfettiBurst } from '../../shared/ui/ConfettiBurst'
import { useReveal } from '../../shared/ui/useReveal'
import { CakePreview } from '../cake/components/CakePreview'
import { WebARModal } from '../cake/components/WebARModal'
import { OpeningInvitation } from '../../shared/ui/OpeningInvitation'
import { FloatingEmojis } from '../../shared/ui/FloatingEmojis'
import { WeddingEventCard } from './components/WeddingEventCard'
import { AnniversaryTimeline } from './components/AnniversaryTimeline'

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

export function PreviewPage({
  card,
  published = false,
  cardId = 'default',
}: {
  card: CardConfig
  published?: boolean
  cardId?: string
}) {
  const [opened, setOpened] = useState(false)
  const [burst, setBurst] = useState(0)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [musicBlocked, setMusicBlocked] = useState(false)
  const [extinguishedCandles, setExtinguishedCandles] = useState<string[]>([])
  const [arModalOpen, setArModalOpen] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const pageRoot = useRef<HTMLElement>(null)
  const replayRequested = useRef(false)
  const contentsHeading = useRef<HTMLHeadingElement>(null)
  const alive = useRef(false)
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isWedding = card.occasion === 'wedding-invitation'
  const isAnniversary = card.occasion === 'anniversary'
  const isBirthdayTimeline =
    card.occasion === 'birthday' && Boolean(card.event?.anniversary?.enabled)
  const hasTimeline = isAnniversary || isBirthdayTimeline

  const cakePlacement = card.cake.placement || 'end'
  const hasValidPagePlacement =
    cakePlacement !== 'end' &&
    (cakePlacement === 'cover' ||
      card.pages.some((p) => p.id === cakePlacement))
  const effectiveCakePlacement = hasValidPagePlacement ? cakePlacement : 'end'

  const scenes: string[] = ['story-cover']
  if (card.cake.enabled && effectiveCakePlacement === 'cover') {
    scenes.push('story-cake')
  }
  card.pages.forEach((p) => {
    scenes.push(`story-page-${p.id}`)
    if (card.cake.enabled && effectiveCakePlacement === p.id) {
      scenes.push('story-cake')
    }
  })
  if (isWedding) scenes.push('story-wedding')
  if (hasTimeline) scenes.push('story-anniversary')
  if (card.cake.enabled && effectiveCakePlacement === 'end') {
    scenes.push('story-cake')
  }
  scenes.push('story-end')

  function getNextScene(currentId: string) {
    const idx = scenes.indexOf(currentId)
    return idx >= 0 && idx < scenes.length - 1 ? scenes[idx + 1] : 'story-end'
  }
  const {
    track,
    failed: audioMissing,
    loading: audioLoading,
  } = useMusicTrack(card.music)

  const candleCount = card.cake.candles.length
  const allCandlesBlown =
    card.cake.enabled &&
    candleCount > 0 &&
    card.cake.candles.every((c) => extinguishedCandles.includes(c.id))

  const handleToggleCandle = useCallback(
    (id: string) => {
      setExtinguishedCandles((prev) => {
        const next = prev.includes(id)
          ? prev.filter((item) => item !== id)
          : [...prev, id]
        if (
          candleCount > 0 &&
          card.cake.candles.every((c) => next.includes(c.id))
        ) {
          setBurst((n) => n + 1)
        }
        return next
      })
    },
    [card.cake.candles, candleCount],
  )

  const handleBlowAll = useCallback(() => {
    if (!card.cake.enabled || candleCount === 0) return
    setExtinguishedCandles(card.cake.candles.map((c) => c.id))
    setBurst((n) => n + 1)
  }, [card.cake.candles, card.cake.enabled, candleCount])

  const handleRelight = useCallback(() => {
    setExtinguishedCandles([])
  }, [])

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
    setExtinguishedCandles([])
    replayRequested.current = true
    setOpened(false)
    setMusicBlocked(false)
    pageRoot.current?.scrollTo({ top: 0, behavior: 'instant' })
  }
  const renderCakeSection = () => {
    if (!card.cake.enabled) return null
    const isAtEnd = effectiveCakePlacement === 'end'
    return (
      <section
        id="story-cake"
        className="story-scene scene-cake"
        aria-label="သင့်အတွက် Cake"
      >
        <Reveal>
          <p className="scene-kicker">
            {isAtEnd ? 'နောက်ဆုံး အံ့ဩစရာ' : 'သင့်အတွက် အမှတ်တရ'}
          </p>
          <h2 className="cake-scene-title">
            {card.receiverName || 'သင့်'} အတွက် Cake လေး 🎂
          </h2>
          <div className="story-cake">
            <CakePreview
              recipe={card.cake}
              extinguishedCandleIds={extinguishedCandles}
              onToggleCandle={handleToggleCandle}
            />
          </div>
          {candleCount > 0 && (
            <div className="cake-actions">
              {!allCandlesBlown ? (
                <button
                  type="button"
                  className="cake-blow-btn"
                  onClick={handleBlowAll}
                >
                  🕯️💨 ဆုတောင်းပြီး မီးမှုတ်မယ်
                </button>
              ) : (
                <div className="cake-wish-banner" role="status">
                  <h3>🎉 ဆုတောင်းပြည့်ပါစေ! ✨</h3>
                  <p>မွေးနေ့/အမှတ်တရဆုမွန်ကောင်းများ အမြဲပြည့်စုံပါစေ။</p>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={handleRelight}
                  >
                    🕯️ ဖယောင်းတိုင် ပြန်ထွန်းမယ်
                  </button>
                </div>
              )}
            </div>
          )}
          <p className="cake-wish">
            {candleCount > 0
              ? allCandlesBlown
                ? 'ဆုတောင်းလေး တောင်းပြီးပါပြီ ✨ ကိတ်လေးကို လှည့်ကြည့်နိုင်ပါတယ်'
                : 'ဖယောင်းတိုင်လေးများကို နှိပ်၍လည်း မီးငြိမ်းနိုင်ပါတယ် ✨'
              : 'ကိတ်လေးကို လှည့်ကြည့်ရင်း ဆုတောင်းလေး တောင်းလိုက်ပါ ✨'}
          </p>
          <div className="cake-ar-action">
            <button
              type="button"
              className="button secondary webar-trigger-button"
              onClick={() => setArModalOpen(true)}
            >
              📱 လက်တွေ့ပတ်ဝန်းကျင်ထဲတွင် Cake ကြည့်မယ် (WebAR)
            </button>
          </div>
        </Reveal>
        <ScrollHint target={getNextScene('story-cake')} />
        {arModalOpen && (
          <WebARModal
            recipe={card.cake}
            cakeTitle={card.receiverName || 'Cake'}
            onClose={() => setArModalOpen(false)}
          />
        )}
      </section>
    )
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
          {!published && (
            <p className="pill">နမူနာသာ ဖြစ်ပါတယ် · Publish မလုပ်ရသေးပါ</p>
          )}
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
      {opened && (audioMissing || audioLoading) && (
        <p role="status" className="music-start-hint">
          {audioMissing
            ? 'သီချင်းဖိုင်ကို ဖွင့်မရပါ။ ကတ်ကို ဆက်ဖတ်နိုင်ပါတယ်။'
            : 'သီချင်း ပြင်ဆင်နေပါတယ်။ ပြီးရင် Play ကို နှိပ်ပေးပါ။'}
        </p>
      )}
      {opened && (
        <>
          <FloatingEmojis emoji={card.opening.emoji} active={opened} />
          <ConfettiBurst
            className="story-confetti"
            burst={burst}

            palette={card.opening.style === 'gift' ? 1 : 0}
          />

          <section id="story-cover" className="story-scene scene-cover">
            <Reveal className="reveal-cover">
              <h1
                className="receiver-content-heading reveal-step-1"
                ref={contentsHeading}
                tabIndex={-1}
              >
                {card.receiverName || 'ချစ်ရသူလေး'} အတွက် အမှတ်တရလေး
              </h1>
              <div className="story-card">
                <CardPreview card={card} />
              </div>
            </Reveal>
            <ScrollHint target={getNextScene('story-cover')} />
          </section>

          {effectiveCakePlacement === 'cover' && renderCakeSection()}

          {card.pages.map((page, index) => (
            <Fragment key={page.id}>
              <section
                id={`story-page-${page.id}`}
                className="story-scene scene-page"
                aria-label={`စာမျက်နှာ ${index + 2}`}
              >
                <Reveal>
                  <p className="scene-kicker reveal-step-1">
                    အမှတ်တရ {index + 1} / {card.pages.length}
                  </p>
                  <div className="story-card">
                    <CardPreview card={card} pageId={page.id} />
                  </div>
                </Reveal>
                <ScrollHint target={getNextScene(`story-page-${page.id}`)} />
              </section>
              {effectiveCakePlacement === page.id && renderCakeSection()}
            </Fragment>
          ))}

          {isWedding && (
            <section
              id="story-wedding"
              className="story-scene scene-wedding"
              aria-label="မင်္ဂလာဖိတ်ကြားလွှာ အချက်အလက်များ"
            >
              <Reveal>
                <p className="scene-kicker">မင်္ဂလာ အစီအစဉ်</p>
                <WeddingEventCard
                  wedding={card.event?.wedding}
                  cardId={cardId}
                  coupleNames={card.title}
                />
              </Reveal>
              <ScrollHint target={getNextScene('story-wedding')} />
            </section>
          )}

          {hasTimeline && (
            <section
              id="story-anniversary"
              className="story-scene scene-anniversary"
              aria-label={
                isBirthdayTimeline
                  ? 'မွေးနေ့ အမှတ်တရ မှတ်တိုင်များ'
                  : 'နှစ်ပတ်လည် အမှတ်တရ မှတ်တိုင်များ'
              }
            >
              <Reveal>
                <p className="scene-kicker">
                  {isBirthdayTimeline
                    ? 'လွန်ခဲ့သော နှစ်များ၏ မွေးနေ့မှတ်တမ်း'
                    : 'ချစ်သက်တမ်း မှတ်တမ်းများ'}
                </p>
                <AnniversaryTimeline
                  anniversary={card.event?.anniversary}
                  coupleNames={card.title}
                  colors={card.event?.anniversary?.colors ?? card.appearance.colors}
                  isBirthday={isBirthdayTimeline}
                />
              </Reveal>
              <ScrollHint target={getNextScene('story-anniversary')} />
            </section>
          )}

          {effectiveCakePlacement === 'end' && renderCakeSection()}

          <section id="story-end" className="story-scene scene-end">
            <Reveal>
              <p className="end-mark reveal-step-1">အမှတ်တရ · AhMatTaYa</p>
              <p className="end-line reveal-step-2">
                ဒီကတ်လေးကို {card.senderName || 'သင့်ချစ်ရသူ'} က သင့်အတွက်သာ
                လက်နဲ့ဖန်တီးပေးထားတာပါ။
              </p>
              <div className="end-actions reveal-step-3">
                <button className="button secondary" onClick={replay}>
                  <RotateCcw size={14} /> ဖိတ်စာ ပြန်ကြည့်မယ်
                </button>
                <Link className="button primary" to="/create">
                  {published ? 'ကိုယ်ပိုင်ကတ် ဖန်တီးမယ်' : 'ကတ်ကို ပြန်ပြင်မယ်'}
                </Link>
              </div>
            </Reveal>
          </section>
        </>
      )}
    </main>
  )
}
