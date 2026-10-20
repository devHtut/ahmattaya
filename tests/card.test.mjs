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
    { schemaVersion: 2 },
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
