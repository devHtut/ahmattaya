import { useEffect, useRef, useState } from 'react'
import type { MusicConfig } from '../models/music'
import type { MusicTrack } from './tracks'

// Key this component by track ID so switching tracks stops the previous player.
export function MusicPlayer({
  track,
  music,
  onVolumeChange,
}: {
  track: MusicTrack
  music: MusicConfig
  onVolumeChange?: (volume: number) => void
}) {
  const element = useRef<HTMLAudioElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (element.current) element.current.volume = music.volume
  }, [music.volume])
  useEffect(() => {
    const audio = element.current
    if (audio) audio.src = track.src
    return () => {
      if (!audio) return
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  }, [track.src])
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
          သီချင်း ဖွင့်မရပါ။ Connection ကို စစ်ပြီး Play ကို ထပ်နှိပ်ကြည့်ပါ။
        </p>
      )}
      <p className="field-hint">Play ကို နှိပ်မှ အသံထွက်ပါမယ်။</p>
    </div>
  )
}
