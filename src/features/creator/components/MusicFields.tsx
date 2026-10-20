import type { CardConfig } from '../../../shared/models/card'
import type { MusicConfig } from '../../../shared/models/music'
import { findMusicTrack, musicTracks } from '../../../shared/audio/tracks'
import { MusicPlayer } from '../../../shared/audio/MusicPlayer'

export function MusicFields({
  card,
  onChange,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
}) {
  const update = (change: Partial<MusicConfig>) =>
    onChange({ ...card, music: { ...card.music, ...change } })
  const selected = findMusicTrack(card.music.trackId)
  return (
    <div className="music-fields">
      <fieldset className="track-picker">
        <legend>သင့်အမှတ်တရနဲ့ လိုက်မယ့် သံစဉ်လေး</legend>
        <label
          className={`track-choice ${card.music.trackId === 'none' ? 'is-selected' : ''}`}
        >
          <input
            type="radio"
            name="music-track"
            checked={card.music.trackId === 'none'}
            onChange={() => update({ trackId: 'none' })}
          />
          <span>
            <strong>သီချင်း မထည့်ဘူး</strong>
            <small>တိတ်တိတ်လေး ဖတ်ရှုစေချင်တဲ့အခါ</small>
          </span>
        </label>
        {musicTracks.map((track) => (
          <label
            className={`track-choice ${card.music.trackId === track.id ? 'is-selected' : ''}`}
            key={track.id}
          >
            <input
              type="radio"
              name="music-track"
              checked={card.music.trackId === track.id}
              onChange={() => update({ trackId: track.id })}
            />
            <span>
              <strong>{track.title}</strong>
              <small>{track.description}</small>
              <small>
                {track.mood} · {track.seconds} စက္ကန့်
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      {selected && (
        <>
          <label>
            အသံအတိုးအကျယ် — {Math.round(card.music.volume * 100)}%
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={card.music.volume * 100}
              onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
            />
          </label>
          <label className="shadow-toggle">
            <input
              type="checkbox"
              checked={card.music.loop}
              onChange={(e) => update({ loop: e.target.checked })}
            />{' '}
            သံစဉ်ကို ထပ်ခါတလဲလဲ ဖွင့်မယ်
          </label>
          <MusicPlayer
            key={selected.id}
            track={selected}
            music={card.music}
            onVolumeChange={(volume) => update({ volume })}
          />
          <p className="music-credit">
            {selected.credit}
            <br />
            {selected.license} · Project အတွက် သီးသန့်ဖန်တီးထားတဲ့ instrumental
            loop ဖြစ်ပါတယ်။
          </p>
        </>
      )}
      <p className="editor-note">
        ဒီအဆင့်မှာ preset သံစဉ်တွေပဲ ရွေးနိုင်ပါသေးတယ်။
        ကိုယ်ပိုင်သီချင်းတင်ခြင်း မပါသေးပါ။
      </p>
    </div>
  )
}
