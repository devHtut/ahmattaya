import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { musicSchema, createMusic } from '../src/shared/models/music.ts'
import { musicTracks, findMusicTrack } from '../src/shared/audio/tracks.ts'
import { createCard } from '../src/shared/templates/templates.ts'
import {
  loadDraft,
  saveDraft,
} from '../src/features/creator/lib/draft-storage.ts'

test('music is opt-in and rejects arbitrary URLs, invalid volume and loop values', () => {
  assert.deepEqual(createMusic(), { trackId: 'none', volume: 0.35, loop: true })
  for (const change of [
    { trackId: 'https://example.com/song.mp3' },
    { volume: -1 },
    { volume: 1.1 },
    { volume: NaN },
    { loop: 'yes' },
  ]) {
    assert.equal(
      musicSchema.safeParse({ ...createMusic(), ...change }).success,
      false,
    )
  }
  assert.equal(findMusicTrack('none'), undefined)
})

test('each preset has a playable, non-silent bounded PCM asset and a credit', () => {
  assert.equal(new Set(musicTracks.map((track) => track.id)).size, 3)
  for (const track of musicTracks) {
    assert.equal(
      musicSchema.safeParse({ ...createMusic(), trackId: track.id }).success,
      true,
    )
    assert.ok(track.credit && track.license)
    const asset = readFileSync(
      new URL(`../public${track.src}`, import.meta.url),
    )
    assert.equal(asset.toString('ascii', 0, 4), 'RIFF')
    assert.equal(asset.toString('ascii', 8, 12), 'WAVE')
    assert.equal(asset.readUInt16LE(20), 1)
    assert.equal(asset.readUInt16LE(22), 1)
    assert.equal(asset.readUInt16LE(34), 16)
    const seconds = asset.readUInt32LE(40) / asset.readUInt32LE(28)
    assert.ok(Math.abs(seconds - track.seconds) < 1)
    assert.ok(asset.length < 1_500_000)
    let peak = 0,
      sumSquares = 0
    for (let offset = 44; offset < asset.length; offset += 2) {
      const sample = asset.readInt16LE(offset) / 32768
      peak = Math.max(peak, Math.abs(sample))
      sumSquares += sample * sample
    }
    assert.ok(peak > 0.2 && peak < 0.99)
    assert.ok(Math.sqrt(sumSquares / ((asset.length - 44) / 2)) > 0.01)
  }
})

test('music choices survive storage and v4 drafts safely migrate to silent defaults', () => {
  let raw = null
  const storage = {
    getItem: () => raw,
    setItem: (_key, value) => {
      raw = value
    },
  }
  const card = createCard('anniversary')
  card.music = { trackId: 'memory-evening', volume: 0.45, loop: false }
  assert.equal(saveDraft(storage, card), true)
  assert.deepEqual(loadDraft(storage).card.music, card.music)
  const { music: _music, ...legacy } = card
  raw = JSON.stringify({
    storageVersion: 1,
    savedAt: '2026-10-20T00:00:00.000Z',
    card: { ...legacy, schemaVersion: 4 },
  })
  const original = raw
  const loaded = loadDraft(storage)
  assert.equal(loaded.status, 'restored')
  assert.deepEqual(loaded.card.music, createMusic())
  assert.equal(loaded.card.schemaVersion, 8)
  assert.equal(raw, original)
})
