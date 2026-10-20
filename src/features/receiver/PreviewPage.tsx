import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CardConfig } from '../../shared/models/card'
import { findMusicTrack } from '../../shared/audio/tracks'
import { MusicPlayer } from '../../shared/audio/MusicPlayer'
import { CardPreview } from '../../shared/ui/CardPreview'
import { CakePreview } from '../cake/components/CakePreview'
import { OpeningInvitation } from '../../shared/ui/OpeningInvitation'

export function PreviewPage({ card }: { card: CardConfig }) {
  const [opened, setOpened] = useState(false)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [musicBlocked, setMusicBlocked] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const pageRoot = useRef<HTMLElement>(null)
  const replayRequested = useRef(false)
  const contentsHeading = useRef<HTMLHeadingElement>(null)
  const alive = useRef(false)
  const track = findMusicTrack(card.music.trackId)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
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
    replayRequested.current = true
    setOpened(false)
    setMusicBlocked(false)
  }
  return (
    <main
      ref={pageRoot}
      id="main-content"
      className={`receiver-preview page-width ${opened ? 'is-opened' : 'is-sealed'}`}
    >
      <p className="pill">နမူနာသာ ဖြစ်ပါတယ် · Publish မလုပ်ရသေးပါ</p>
      {!opened && (
        <OpeningInvitation
          opening={card.opening}
          receiverName={card.receiverName}
          senderName={card.senderName}
          withMusic={Boolean(track && card.opening.musicOnOpen)}
          musicEnabled={musicEnabled}
          onMusicToggle={setMusicEnabled}
          onActivate={activate}
          onOpened={() => setOpened(true)}
        />
      )}
      {track && (
        <section
          hidden={!opened}
          className="receiver-music"
          aria-label="နောက်ခံသံစဉ်"
        >
          <MusicPlayer
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
        </section>
      )}
      {opened && (
        <>
          <h1
            className="receiver-content-heading"
            ref={contentsHeading}
            tabIndex={-1}
          >
            သင့်အတွက် အမှတ်တရလေး
          </h1>
          <CardPreview card={card} />
          {card.pages.map((page, index) => (
            <section
              className="receiver-card-page"
              key={page.id}
              aria-label={`စာမျက်နှာ ${index + 2}`}
            >
              <p className="page-number">
                {index + 2} / {card.pages.length + 1}
              </p>
              <CardPreview card={card} pageId={page.id} />
            </section>
          ))}
          {card.cake.enabled && (
            <section className="receiver-cake" aria-label="သင့်အတွက် Cake">
              <h2>သင့်အတွက် Cake လေး 🎂</h2>
              <CakePreview recipe={card.cake} />
            </section>
          )}
          <button className="button secondary" onClick={replay}>
            ဖိတ်စာ ပြန်ကြည့်မယ်
          </button>
        </>
      )}
      <Link className="button secondary" to="/create">
        ပြန်ပြင်မယ်
      </Link>
    </main>
  )
}
