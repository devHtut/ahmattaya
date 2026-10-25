import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultPhotoFrame } from '../src/shared/lib/photo-geometry.ts'
import { cardSchema, MAX_PHOTO_BYTES } from '../src/shared/models/card.ts'
import { createCard } from '../src/shared/templates/templates.ts'
import {
  moveItem,
  createPage,
  removePage,
} from '../src/features/creator/lib/pages.ts'
import { validatePhotoFile } from '../src/features/creator/lib/compress-photo.ts'

const tinyPhoto = {
  id: 'photo-1',
  pageId: 'cover',
  src: 'data:image/webp;base64,YWJj',
  caption: 'အမှတ်တရလေး',
  frame: defaultPhotoFrame(0),
}

test('allows at most five photos across the whole card and eight additional pages', () => {
  const card = createCard('birthday')
  card.pages = Array.from({ length: 8 }, (_, i) => createPage(`page-${i}`))
  card.photos = Array.from({ length: 5 }, (_, i) => ({
    ...tinyPhoto,
    id: `photo-${i}`,
    pageId: i === 0 ? 'cover' : `page-${i}`,
  }))
  assert.equal(cardSchema.safeParse(card).success, true)
  assert.equal(
    cardSchema.safeParse({
      ...card,
      photos: [...card.photos, { ...tinyPhoto, id: 'extra' }],
    }).success,
    false,
  )
  assert.equal(
    cardSchema.safeParse({
      ...card,
      pages: [...card.pages, createPage('extra')],
    }).success,
    false,
  )
})

test('rejects orphaned photos, duplicated identities and unsafe data URLs', () => {
  const card = createCard('birthday')
  for (const photo of [
    { ...tinyPhoto, pageId: 'missing' },
    { ...tinyPhoto, src: 'javascript:alert(1)' },
    { ...tinyPhoto, src: 'data:image/svg+xml;base64,YWJj' },
    { ...tinyPhoto, src: 'data:image/png;base64,' },
  ]) {
    assert.equal(
      cardSchema.safeParse({ ...card, photos: [photo] }).success,
      false,
    )
  }
  assert.equal(
    cardSchema.safeParse({ ...card, photos: [tinyPhoto, tinyPhoto] }).success,
    false,
  )
  assert.equal(
    cardSchema.safeParse({
      ...card,
      pages: [createPage('same'), createPage('same')],
    }).success,
    false,
  )
})

test('enforces decoded image byte limits, including base64 padding', () => {
  const card = createCard('birthday')
  for (const bytes of [MAX_PHOTO_BYTES, MAX_PHOTO_BYTES + 1]) {
    const src = `data:image/webp;base64,${Buffer.alloc(bytes).toString('base64')}`
    assert.equal(
      cardSchema.safeParse({ ...card, photos: [{ ...tinyPhoto, src }] })
        .success,
      bytes <= MAX_PHOTO_BYTES,
    )
  }
})

test('page removal deletes its photos and keeps other content intact', () => {
  const card = {
    ...createCard('birthday'),
    pages: [
      createPage('a'),
      { ...createPage('b'), paper: 'lined', message: 'စာမျက်နှာနှစ်' },
    ],
    photos: [
      tinyPhoto,
      { ...tinyPhoto, id: 'a-photo', pageId: 'a' },
      { ...tinyPhoto, id: 'b-photo', pageId: 'b' },
    ],
  }
  const removed = removePage(card, 'a')
  assert.deepEqual(
    removed.pages.map((page) => page.id),
    ['b'],
  )
  assert.deepEqual(
    removed.photos.map((photo) => photo.id),
    ['photo-1', 'b-photo'],
  )
  assert.equal(card.pages.length, 2)
  assert.equal(cardSchema.safeParse(removed).success, true)
})

test('reordering preserves identities and safely ignores invalid moves', () => {
  const items = ['a', 'b', 'c']
  assert.deepEqual(moveItem(items, 0, 2), ['b', 'c', 'a'])
  assert.deepEqual(moveItem(items, 2, 0), ['c', 'a', 'b'])
  assert.deepEqual(moveItem(items, 0, -1), items)
  assert.deepEqual(items, ['a', 'b', 'c'])
})

test('rejects unsupported and oversized image inputs before decoding', () => {
  assert.equal(validatePhotoFile({ type: 'image/jpeg', size: 1000 }), null)
  assert.ok(validatePhotoFile({ type: 'image/svg+xml', size: 1000 }))
  assert.ok(validatePhotoFile({ type: 'image/png', size: 16 * 1024 * 1024 }))
  assert.ok(validatePhotoFile({ type: 'image/png', size: 0 }))
})

test('each page can independently override heading and body font style or inherit from cover', () => {
  const card = createCard('birthday')
  const page1 = createPage('page-1')
  page1.heading = { font: 'Aka03 Regular', size: 36, bold: true, align: 'center' }
  page1.body = { font: 'Padauk', size: 16, italic: true, align: 'left' }
  const page2 = createPage('page-2')

  card.pages = [page1, page2]
  assert.equal(cardSchema.safeParse(card).success, true)

  // Invalid font rejected
  assert.equal(
    cardSchema.safeParse({
      ...card,
      pages: [{ ...page1, heading: { ...page1.heading, font: 'unknown' } }],
    }).success,
    false,
  )

  // Invalid heading size rejected
  assert.equal(
    cardSchema.safeParse({
      ...card,
      pages: [{ ...page1, heading: { ...page1.heading, size: 55 } }],
    }).success,
    false,
  )

  // Invalid body size rejected
  assert.equal(
    cardSchema.safeParse({
      ...card,
      pages: [{ ...page1, body: { ...page1.body, size: 30 } }],
    }).success,
    false,
  )
})

