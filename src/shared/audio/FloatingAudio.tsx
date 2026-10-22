import { useEffect, useRef, useState, type RefObject } from 'react'
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { MusicConfig } from '../models/music'
import type { PlayableTrack } from './useMusicTrack'

/**
 * Floating audio control for the receiver experience. Wires the same
 * <audio> element the opening gesture started, but renders as a small pill
 * with playing-bars so it doesn't interrupt the scroll story. The player
 * remains mounted while the invitation opens to preserve gesture playback.
 */
export function FloatingAudio({
  track,
  music,
  audioRef,
}: {
  track: PlayableTrack
  music: MusicConfig
  audioRef: RefObject<HTMLAudioElement | null>
}) {
  const internalRef = useRef<HTMLAudioElement>(null)
  const element = audioRef ?? internalRef
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (element.current) element.current.volume = music.volume
  }, [element, music.volume])
  useEffect(() => {
    const audio = element.current
    if (audio) audio.src = track.src
    return () => {
      if (!audio) return
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  }, [element, track.src])

  function toggle() {
    const audio = element.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => setFailed(true))
    } else {
      audio.pause()
    }
  }

  return (
    <div className="floating-audio" role="group" aria-label="နောက်ခံသံစဉ်">
      <audio
        ref={element}
        src={track.src}
        preload="auto"
        loop={music.loop}
        muted={muted}
        aria-label={`${track.title} နားထောင်မယ်`}
        onError={() => setFailed(true)}
        onCanPlay={() => setFailed(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <span
        className={`fa-bars ${playing && !muted ? 'on' : ''}`}
        aria-hidden="true"
      >
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="fa-title">♫ {track.title}</span>
      <button
        className="fa-btn"
        onClick={toggle}
        aria-label={playing ? 'သီချင်း ခေတ္တရပ်မယ်' : 'သီချင်း ဖွင့်မယ်'}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        className="fa-btn"
        onClick={() => setMuted((value) => !value)}
        aria-pressed={muted}
        aria-label={muted ? 'အသံ ပြန်ဖွင့်မယ်' : 'အသံပိတ်မယ်'}
      >
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
      {failed && (
        <p role="alert" className="fa-error">
          <Music size={11} /> သီချင်း ဖွင့်မရပါ
        </p>
      )}
    </div>
  )
}
