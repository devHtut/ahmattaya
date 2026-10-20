import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createMusic,
  musicSchema,
  MAX_AUDIO_BYTES,
  MAX_AUDIO_SECONDS,
} from '../src/shared/models/music.ts'
import {
  validateAudioFile,
  saveAudioAsset,
} from '../src/shared/media/audio-assets.ts'
import { createCard } from '../src/shared/templates/templates.ts'
import {
  loadProjects,
  saveProjects,
  PROJECTS_KEY,
} from '../src/features/projects/project-storage.ts'
const custom = {
  revision: 0,
  assetId: 'a'.repeat(64),
  name: 'My song.mp3',
  seconds: 180,
  bytes: 1024,
}
function memory() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}
test('custom music requires a bounded local asset record rather than an arbitrary URL', () => {
  const music = { ...createMusic(), trackId: 'custom', custom }
  assert.equal(musicSchema.safeParse(music).success, true)
  assert.equal(musicSchema.safeParse({ ...music, custom: null }).success, false)
  for (const change of [
    { assetId: 'https://example.com/song.mp3' },
    { name: '' },
    { name: 'x'.repeat(121) },
    { seconds: NaN },
    { seconds: 0 },
    { seconds: MAX_AUDIO_SECONDS + 1 },
    { bytes: 0 },
    { bytes: MAX_AUDIO_BYTES + 1 },
  ])
    assert.equal(
      musicSchema.safeParse({ ...music, custom: { ...custom, ...change } })
        .success,
      false,
    )
})
test('file checks accept common audio formats and reject empty, oversized or unsupported files', async () => {
  for (const [name, type] of [
    ['song.MP3', 'audio/mpeg'],
    ['song.m4a', 'audio/x-m4a'],
    ['song.wav', 'audio/x-wav'],
    ['song.ogg', 'audio/ogg'],
    ['song.webm', 'audio/webm'],
    ['song.mp3', ''],
    ['song.mp3', 'application/octet-stream'],
  ])
    assert.equal(validateAudioFile({ name, type, size: 1024 }), null)
  for (const file of [
    { name: 'x.png', type: 'image/png', size: 1 },
    { name: 'x.mp3', type: 'text/plain', size: 1 },
    { name: 'x.mp3', type: 'audio/mpeg', size: 0 },
    { name: 'x.wav', type: 'audio/wav', size: MAX_AUDIO_BYTES + 1 },
  ]) {
    assert.ok(validateAudioFile(file))
    await assert.rejects(saveAudioAsset(file))
  }
})
test('v9 project migration preserves background, preset, volume and loop without writing', () => {
  const storage = memory()
  const card = createCard('anniversary')
  card.schemaVersion = 9
  card.music = { trackId: 'soft-promise', volume: 0.2, loop: false }
  const library = {
    version: 1,
    activeId: 'one',
    projects: [
      {
        id: 'one',
        name: 'Old project',
        updatedAt: new Date().toISOString(),
        deleted: false,
        card,
      },
    ],
  }
  const raw = JSON.stringify(library)
  storage.setItem(PROJECTS_KEY, raw)
  const result = loadProjects(storage)
  assert.equal(result.status, 'restored')
  const loaded = result.library.projects[0].card
  assert.equal(loaded.schemaVersion, 10)
  assert.deepEqual(loaded.music, { ...card.music, custom: null })
  assert.deepEqual(loaded.background, card.background)
  assert.equal(storage.getItem(PROJECTS_KEY), raw)
})
test('custom music metadata roundtrips and project copies share asset IDs without duplicating bytes', () => {
  const card = createCard('birthday')
  card.music = { trackId: 'custom', custom, volume: 0.4, loop: false }
  const project = {
    id: 'one',
    name: 'My project',
    updatedAt: new Date().toISOString(),
    deleted: false,
    card,
  }
  const library = {
    version: 1,
    activeId: 'two',
    projects: [project, { ...project, id: 'two', card: structuredClone(card) }],
  }
  const storage = memory()
  assert.equal(saveProjects(storage, library), true)
  assert.deepEqual(loadProjects(storage).library, library)
  assert.equal(storage.getItem(PROJECTS_KEY).includes('data:audio'), false)
  const retained = musicSchema.parse({ ...card.music, trackId: 'none' })
  assert.deepEqual(retained.custom, custom)
})
