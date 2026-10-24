import { useEffect, useRef, useState, type RefObject } from 'react'
import type { MusicConfig } from '../models/music'
import type { PlayableTrack } from './useMusicTrack'

// Key this component by track ID so switching tracks stops the previous player.
export function MusicPlayer({
  track,
  music,
  onVolumeChange,
  audioRef,
}: {
  track: PlayableTrack
  music: MusicConfig
  onVolumeChange?: (volume: number) => void
  audioRef?: RefObject<HTMLAudioElement | null>
}) {
  const internalRef = useRef<HTMLAudioElement>(null)
  const element = audioRef ?? internalRef
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
  return (
    <div className="music-player">
      <p className="music-player-title">♫ {track.title}</p>
      <audio
        ref={element}
        src={track.src}
        controls
        preload="none"
        loop={music.loop}
        aria-label={`${track.title} နားထောင်မယ်`}
        onError={() => setFailed(true)}
        onCanPlay={() => setFailed(false)}
        onVolumeChange={(e) => {
          if (e.currentTarget.volume !== music.volume)
            onVolumeChange?.(e.currentTarget.volume)
        }}
      />
      {failed && (
        <p role="alert" className="music-error">
          သီချင်း ဖွင့်မရပါ။ Play ကို ထပ်နှိပ်ကြည့်ပါ။ မရသေးရင် ဖန်တီးသူဘက်မှာ
          သီချင်းဖိုင် ပြန်ရွေးပေးပါ။
        </p>
      )}
    </div>
  )
}
