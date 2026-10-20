import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultPhotoFrame } from '../src/shared/lib/photo-geometry.ts'
import {
  DRAFT_STORAGE_KEY,
  loadDraft,
  saveDraft,
} from '../src/features/creator/lib/draft-storage.ts'
import {
  createCard,
  changeOccasion,
} from '../src/shared/templates/templates.ts'

function memoryStorage(initial = null) {
  let value = initial
  return {
    getItem: () => value,
    setItem: (key, next) => {
      assert.equal(key, DRAFT_STORAGE_KEY)
      value = next
    },
  }
}

test('saves and restores Burmese content, theme, occasion and whitespace exactly', () => {
  const storage = memoryStorage()
  assert.deepEqual(loadDraft(storage), { status: 'empty' })
  const card = {
    ...createCard('anniversary'),
    senderName: 'မောင် မောင် ',
    message: 'ပျော်ရွှင်ပါစေ\nချစ်ရသူ 💖',
    theme: 'rose',
  }
  assert.equal(saveDraft(storage, card), true)
  const recovered = loadDraft(storage)
  assert.equal(recovered.status, 'restored')
  assert.deepEqual(recovered.card, card)
  assert.ok(!Number.isNaN(Date.parse(recovered.savedAt)))
})

test('rejects damaged data and future versions without modifying storage', () => {
  const card = createCard('birthday')
  for (const raw of [
    '{broken',
    'null',
    '{}',
    JSON.stringify({
      storageVersion: 2,
      savedAt: new Date().toISOString(),
      card,
    }),
    JSON.stringify({
      storageVersion: 1,
      savedAt: new Date().toISOString(),
      card: { ...card, schemaVersion: 6 },
    }),
    JSON.stringify({ storageVersion: 1, savedAt: 'invalid', card }),
  ]) {
    const storage = memoryStorage(raw)
    assert.deepEqual(loadDraft(storage), { status: 'invalid' })
    assert.equal(storage.getItem(DRAFT_STORAGE_KEY), raw)
  }
})

test('storage access and quota errors do not crash the editor', () => {
  const storage = {
    getItem() {
      throw new Error('SecurityError')
    },
    setItem() {
      throw new Error('QuotaExceededError')
    },
  }
  assert.deepEqual(loadDraft(storage), { status: 'unavailable' })
  assert.equal(saveDraft(storage, createCard('birthday')), false)
})

test('invalid card cannot overwrite an existing saved draft', () => {
  const storage = memoryStorage('existing')
  assert.equal(
    saveDraft(storage, {
      ...createCard('birthday'),
      message: 'x'.repeat(2001),
    }),
    false,
  )
  assert.equal(storage.getItem(DRAFT_STORAGE_KEY), 'existing')
})

test('occasion switches preserve personal content and custom titles', () => {
  const birthday = {
    ...createCard('birthday'),
    senderName: 'ကိုကို',
    receiverName: 'မေ',
    message: 'ကိုယ်ပိုင်စာသား',
    theme: 'gold',
  }
  const wedding = changeOccasion(birthday, 'wedding-invitation')
  assert.equal(wedding.title, createCard('wedding-invitation').title)
  assert.equal(wedding.message, birthday.message)
  assert.equal(wedding.senderName, birthday.senderName)
  assert.equal(wedding.receiverName, birthday.receiverName)
  assert.equal(wedding.theme, birthday.theme)
  const custom = { ...birthday, title: 'ကိုယ်ပိုင် ခေါင်းစဉ်' }
  assert.equal(changeOccasion(custom, 'anniversary').title, custom.title)
  assert.deepEqual(changeOccasion(custom, 'birthday'), custom)
  assert.equal(birthday.occasion, 'birthday')
})

test('legacy v1 drafts migrate without losing text or the chosen theme', () => {
  const card = {
    schemaVersion: 1,
    occasion: 'birthday',
    senderName: 'မောင်မောင်',
    receiverName: 'သီရိ',
    title: 'Happy Birthday',
    message: 'ကျန်းမာပျော်ရွှင်ပါစေ။',
    theme: 'rose',
  }
  const storage = memoryStorage(
    JSON.stringify({
      storageVersion: 1,
      savedAt: '2026-10-20T00:00:00.000Z',
      card,
    }),
  )
  const restored = loadDraft(storage)
  assert.equal(restored.status, 'restored')
  assert.equal(restored.card.schemaVersion, 5)
  assert.equal(restored.card.message, card.message)
  assert.equal(restored.card.theme, 'rose')
  assert.equal(restored.card.appearance.colors.background, '#fce5ed')
  assert.equal(
    JSON.parse(storage.getItem(DRAFT_STORAGE_KEY)).card.schemaVersion,
    1,
  )
  assert.equal(saveDraft(storage, restored.card), true)
  assert.deepEqual(loadDraft(storage).card, restored.card)
})

test('custom appearance survives storage and occasion changes', () => {
  const storage = memoryStorage()
  const card = createCard('birthday')
  card.appearance.colors.text = '#123456'
  card.appearance.heading.font = 'Padauk'
  card.appearance.heading.size = 40
  card.appearance.body.italic = true
  assert.equal(saveDraft(storage, card), true)
  const recovered = loadDraft(storage)
  assert.deepEqual(recovered.card.appearance, card.appearance)
  assert.deepEqual(
    changeOccasion(recovered.card, 'anniversary').appearance,
    card.appearance,
  )
})

test('v2 drafts migrate to the current model while preserving custom appearance', () => {
  const { pages: _pages, photos: _photos, ...current } = createCard('birthday')
  const card = { ...current, schemaVersion: 2 }
  card.appearance.heading.font = 'Padauk'
  const raw = JSON.stringify({
    storageVersion: 1,
    savedAt: '2026-10-20T00:00:00.000Z',
    card,
  })
  const storage = memoryStorage(raw)
  const loaded = loadDraft(storage)
  assert.equal(loaded.status, 'restored')
  assert.deepEqual(loaded.card.pages, [])
  assert.deepEqual(loaded.card.photos, [])
  assert.deepEqual(loaded.card.appearance, card.appearance)
  assert.equal(storage.getItem(DRAFT_STORAGE_KEY), raw)
})

test('multi-page drafts and compressed images round-trip through storage', () => {
  const card = createCard('anniversary')
  card.pages = [
    {
      id: 'memory',
      title: 'အမှတ်တရ',
      message: 'တွေ့ဆုံခဲ့တဲ့ နေ့လေး',
      paper: 'lined',
    },
  ]
  card.photos = [
    {
      id: 'photo',
      pageId: 'memory',
      src: 'data:image/webp;base64,YWJj',
      caption: 'အတူတူ',
      frame: defaultPhotoFrame(0),
    },
  ]
  const storage = memoryStorage()
  assert.equal(saveDraft(storage, card), true)
  assert.deepEqual(loadDraft(storage).card, card)
})

test('v3 photos migrate into independent positioned frames without changing storage', () => {
  const { photos: _photos, ...current } = createCard('birthday')
  const photo = {
    id: 'old',
    pageId: 'cover',
    src: 'data:image/webp;base64,YWJj',
    caption: 'အမှတ်တရ',
  }
  const card = { ...current, schemaVersion: 3, photos: [photo] }
  const raw = JSON.stringify({
    storageVersion: 1,
    savedAt: '2026-10-20T00:00:00.000Z',
    card,
  })
  const storage = memoryStorage(raw)
  const loaded = loadDraft(storage)
  assert.equal(loaded.status, 'restored')
  assert.equal(loaded.card.schemaVersion, 5)
  assert.deepEqual(loaded.card.photos[0], {
    ...photo,
    frame: defaultPhotoFrame(0),
  })
  assert.equal(storage.getItem(DRAFT_STORAGE_KEY), raw)
  loaded.card.photos[0].frame = {
    ...loaded.card.photos[0].frame,
    x: 60,
    rotation: 20,
    shadow: false,
  }
  assert.equal(saveDraft(storage, loaded.card), true)
  assert.deepEqual(loadDraft(storage).card, loaded.card)
})
