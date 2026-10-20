import assert from 'node:assert/strict'
import test from 'node:test'
import { cardSchema } from '../src/shared/models/card.ts'
import { createCard, occasions } from '../src/shared/templates/templates.ts'

test('every occasion starts with a valid independent draft', () => {
  for (const { id } of occasions) {
    const draft = createCard(id)
    assert.equal(cardSchema.safeParse(draft).success, true)
    draft.senderName = 'ပြင်ဆင်ထားသော အမည်'
    assert.equal(createCard(id).senderName, '')
  }
})
test('rejects unsupported schema versions, occasions and oversized content', () => {
  const draft = createCard('birthday')
  for (const change of [
    { schemaVersion: 7 },
    { occasion: 'unknown' },
    { message: 'a'.repeat(2001) },
    { receiverName: 'a'.repeat(81) },
  ]) {
    assert.equal(cardSchema.safeParse({ ...draft, ...change }).success, false)
  }
})
test('Burmese multiline content survives validation', () => {
  const message = 'ချစ်ရသူလေးရေ\nပျော်ရွှင်ပါစေ။ 💖'
  assert.equal(
    cardSchema.parse({ ...createCard('anniversary'), message }).message,
    message,
  )
})

test('custom colors and typography validate with bounded sizes', () => {
  const card = createCard('birthday')
  card.appearance.colors.background = '#123aBc'
  card.appearance.heading = {
    font: 'Padauk',
    size: 48,
    bold: false,
    italic: true,
    align: 'left',
  }
  assert.equal(cardSchema.safeParse(card).success, true)
  for (const bad of ['red', '#fff', '#123456; background:url(x)']) {
    assert.equal(
      cardSchema.safeParse({
        ...card,
        appearance: {
          ...card.appearance,
          colors: { ...card.appearance.colors, text: bad },
        },
      }).success,
      false,
    )
  }
  for (const size of [17, 49, 24.5]) {
    assert.equal(
      cardSchema.safeParse({
        ...card,
        appearance: {
          ...card.appearance,
          heading: { ...card.appearance.heading, size },
        },
      }).success,
      false,
    )
  }
  assert.equal(
    cardSchema.safeParse({
      ...card,
      appearance: {
        ...card.appearance,
        body: { ...card.appearance.body, font: 'unknown' },
      },
    }).success,
    false,
  )
})

test('drafts do not share nested style objects', () => {
  const first = createCard('birthday')
  first.appearance.heading.size = 48
  first.appearance.colors.background = '#000000'
  const second = createCard('birthday')
  assert.equal(second.appearance.heading.size, 24)
  assert.notEqual(second.appearance.colors.background, '#000000')
})
