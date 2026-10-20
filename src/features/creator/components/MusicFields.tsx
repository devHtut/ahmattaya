import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2 } from 'lucide-react'
import { saveAudioAsset } from '../../../shared/media/audio-assets'
import { useMusicTrack } from '../../../shared/audio/useMusicTrack'
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
  const { track, failed, loading } = useMusicTrack(card.music)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [over, setOver] = useState(false)
  const latest = useRef({ card, onChange })
  const mounted = useRef(false)
  const uploading = useRef(false)
  useEffect(() => {
    latest.current = { card, onChange }
  }, [card, onChange])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  async function upload(files: File[]) {
    if (uploading.current || !files.length) return
    if (files.length !== 1) {
      setFeedback('သီချင်းဖိုင် တစ်ဖိုင်ပဲ ရွေးပေးပါ။')
      return
    }
    uploading.current = true
    setBusy(true)
    setFeedback('သီချင်းကို စစ်ဆေးပြီး သိမ်းနေပါတယ်…')
    try {
      const file = files[0]
      const { assetId, seconds } = await saveAudioAsset(file)
      if (!mounted.current) return
      const { card: current, onChange: commit } = latest.current
      commit({
        ...current,
        music: {
          ...current.music,
          trackId: 'custom',
          custom: {
            assetId,
            revision: Date.now(),
            seconds,
            bytes: file.size,
            name: file.name.trim().slice(0, 120) || 'ကိုယ့်သီချင်း',
          },
        },
      })
      setFeedback('သီချင်း ထည့်ပြီးပါပြီ။ Play နဲ့ နားထောင်စမ်းနိုင်ပါတယ်။')
    } catch (error) {
      if (mounted.current)
        setFeedback(
          error instanceof Error && /[\u1000-\u109f]/.test(error.message)
            ? error.message
            : 'သီချင်းကို ဒီ browser မှာ သိမ်းမရပါ။ နေရာလွတ်ရှိမရှိ စစ်ပြီး ထပ်ကြိုးစားပေးပါ။',
        )
    } finally {
      uploading.current = false
      if (mounted.current) setBusy(false)
    }
  }
  return (
    <div className="music-fields">
      <fieldset className="track-picker" disabled={busy}>
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
      <fieldset className="custom-music-fields" disabled={busy}>
        <legend>ကိုယ့်သီချင်း ထည့်မယ်</legend>
        {card.music.custom && (
          <label
            className={`track-choice ${card.music.trackId === 'custom' ? 'is-selected' : ''}`}
          >
            <input
              type="radio"
              name="music-track"
              checked={card.music.trackId === 'custom'}
              onChange={() => update({ trackId: 'custom' })}
            />
            <span>
              <strong>{card.music.custom.name}</strong>
              <small>
                {Math.floor(Math.round(card.music.custom.seconds) / 60)}:
                {String(Math.round(card.music.custom.seconds) % 60).padStart(
                  2,
                  '0',
                )}{' '}
                · {(card.music.custom.bytes / 1024 / 1024).toFixed(1)} MB
              </small>
            </span>
          </label>
        )}
        <div
          className={`audio-dropzone ${over ? 'is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            if (!busy) setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            void upload(Array.from(e.dataTransfer.files))
          }}
        >
          <Upload size={24} aria-hidden="true" />
          <label className="photo-file-label">
            {card.music.custom
              ? 'သီချင်းဖိုင် ပြောင်းမယ်'
              : 'သီချင်းဖိုင် ရွေးမယ်'}
            <input
              type="file"
              accept=".mp3,.m4a,.wav,.ogg,.webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm"
              disabled={busy}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                e.target.value = ''
                void upload(files)
              }}
            />
          </label>
          <p className="field-hint">
            ဖိုင်ကို ဆွဲထည့်လည်း ရပါတယ်။ MP3 / M4A / WAV / OGG / WebM · 20 MB
            အထိ၊ 15 မိနစ်အထိ။ Browser အလိုက် ဖွင့်နိုင်တဲ့ format ကွာနိုင်ပါတယ်။
          </p>
        </div>
        {card.music.custom && (
          <button
            className="button secondary"
            onClick={() => {
              update({
                custom: null,
                trackId:
                  card.music.trackId === 'custom' ? 'none' : card.music.trackId,
              })
              setFeedback('ကိုယ့်သီချင်းကို ဖယ်ပြီးပါပြီ။')
            }}
          >
            <Trash2 size={15} /> ကိုယ့်သီချင်း ဖယ်မယ်
          </button>
        )}
      </fieldset>
      <p role="status" className="upload-feedback">
        {feedback}
      </p>
      {card.music.trackId !== 'none' && (
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
        </>
      )}
      {loading && <p role="status">သီချင်းဖိုင် ပြင်ဆင်နေပါတယ်…</p>}
      {failed && (
        <p role="alert" className="music-error">
          သီချင်းဖိုင်ကို ဖွင့်မရပါ။ ဖိုင်ပြန်ရွေးနိုင်ပါတယ်။
        </p>
      )}
      {track && (
        <MusicPlayer
          key={track.id}
          track={track}
          music={card.music}
          onVolumeChange={(volume) => update({ volume })}
        />
      )}
      {selected && (
        <p className="music-credit">
          {selected.credit}
          <br />
          {selected.license} · Project အတွက် သီးသန့်ဖန်တီးထားတဲ့ instrumental
          loop ဖြစ်ပါတယ်။
        </p>
      )}
      <p className="editor-note">
        ကိုယ်ပိုင်သီချင်းကို ဒီ browser ထဲမှာပဲ သိမ်းပေးပါတယ်။
        ကိုယ်တိုင်အသုံးပြုခွင့်ရှိတဲ့ သီချင်းကို ရွေးပါ။ ဖိတ်စာဖွင့်ချိန်
        သီချင်းပါ ဖွင့်မဖွင့်ကို “အဖွင့်ဖိတ်စာ” မှာ ရွေးနိုင်ပါတယ်။
      </p>
    </div>
  )
}
