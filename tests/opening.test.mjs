import assert from 'node:assert/strict'
import test from 'node:test'
import { openingSchema, createOpening } from '../src/shared/models/opening.ts'
import {
  createCard,
  changeOccasion,
} from '../src/shared/templates/templates.ts'
import {
  loadDraft,
  saveDraft,
} from '../src/features/creator/lib/draft-storage.ts'

test('opening configuration rejects unsafe colors, unsupported effects and oversized text', () => {
  for (const change of [
    { background: 'url(x)' },
    { emoji: '<script>' },
    { title: 'x'.repeat(121) },
    { message: 'x'.repeat(301) },
    { buttonText: 'x'.repeat(51) },
    { style: 'unknown' },
    { animation: 'unknown' },
    { musicOnOpen: 'yes' },
  ]) {
    assert.equal(
      openingSchema.safeParse({ ...createOpening(), ...change }).success,
      false,
    )
  }
})
test('all opening shapes and animations validate and defaults are independent', () => {
  for (const style of ['envelope', 'gift'])
    for (const animation of ['gentle', 'sparkles', 'fade', 'none'])
      assert.equal(
        openingSchema.safeParse({ ...createOpening(), style, animation })
          .success,
        true,
      )
  const a = createCard('birthday'),
    b = createCard('anniversary')
  a.opening.color = '#000000'
  assert.notEqual(b.opening.color, a.opening.color)
  assert.deepEqual(changeOccasion(a, 'wedding-invitation').opening, a.opening)
})
test('custom opening is saved independently from the page appearance and music', () => {
  let raw = null
  const storage = {
    getItem: () => raw,
    setItem: (_key, value) => {
      raw = value
    },
  }
  const card = createCard('birthday')
  card.opening = {
    ...createOpening(),
    style: 'gift',
    emoji: '🎁',
    title: 'ချစ်ရသူအတွက်',
    animation: 'sparkles',
    musicOnOpen: false,
  }
  const colors = { ...card.appearance.colors }
  assert.equal(saveDraft(storage, card), true)
  assert.deepEqual(loadDraft(storage).card.opening, card.opening)
  assert.deepEqual(card.appearance.colors, colors)
})
test('v5 migration adds opening without losing music, content or rewriting storage', () => {
  const { opening: _opening, ...old } = createCard('anniversary')
  const card = {
    ...old,
    schemaVersion: 5,
    music: { trackId: 'soft-promise', volume: 0.2, loop: false },
  }
  const raw = JSON.stringify({
    storageVersion: 1,
    savedAt: '2026-10-20T00:00:00.000Z',
    card,
  })
  const storage = {
    getItem: () => raw,
    setItem: () => {
      throw new Error('must not write on load')
    },
  }
  const loaded = loadDraft(storage)
  assert.equal(loaded.status, 'restored')
  assert.equal(loaded.card.schemaVersion, 9)
  assert.deepEqual(loaded.card.music, card.music)
  assert.deepEqual(loaded.card.opening, createOpening())
  assert.deepEqual(loaded.card.photos, card.photos)
})
