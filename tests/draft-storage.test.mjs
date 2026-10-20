import assert from 'node:assert/strict'
import test from 'node:test'
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
      card: { ...card, schemaVersion: 2 },
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
