import assert from 'node:assert/strict'
import test from 'node:test'
import { cardSchema } from '../src/shared/models/card.ts'
import {
  weddingEventSchema,
  anniversaryEventSchema,
  eventSchema,
  createWeddingEvent,
  createAnniversaryEvent,
} from '../src/shared/models/event.ts'
import { createCard } from '../src/shared/templates/templates.ts'
import {
  listRsvpResponses,
  saveRsvpResponse,
  deleteRsvpResponse,
  clearRsvpResponses,
  exportRsvpCsv,
} from '../src/shared/rsvp/rsvp-storage.ts'

test('weddingEventSchema validates valid wedding details', () => {
  const wedding = createWeddingEvent()
  const result = weddingEventSchema.safeParse(wedding)
  assert.equal(result.success, true)

  const customWedding = {
    ...wedding,
    date: '၂၀၂၆ ခုနှစ်၊ ဒီဇင်ဘာလ ၁၅ ရက်',
    time: 'နံနက် ၉:၀၀ နာရီ',
    venue: 'စိန်ရတနာ ခန်းမ',
    location: 'ကန်တော်ကြီးပတ်လမ်း၊ ရန်ကုန်',
    mapUrl: 'https://maps.google.com/?q=yangon',
    rsvpEnabled: true,
  }
  assert.equal(weddingEventSchema.safeParse(customWedding).success, true)
})

test('anniversaryEventSchema validates valid anniversary details and timeline', () => {
  const anniversary = createAnniversaryEvent()
  const result = anniversaryEventSchema.safeParse(anniversary)
  assert.equal(result.success, true)

  const validCustom = {
    ...anniversary,
    yearsCount: 10,
    date: '၂၀၁၆ ခုနှစ်၊ မေလ ၂၀ ရက်',
    timeline: [
      {
        id: '1',
        year: '2016',
        title: 'စတင်တွေ့ဆုံခဲ့ချိန်',
        description: 'ရန်ကုန်တက္ကသိုလ်',
      },
      {
        id: '2',
        year: '2021',
        title: 'လက်ထပ်မင်္ဂလာပွဲ',
        description: 'အမှတ်တရနေ့',
      },
    ],
  }
  assert.equal(anniversaryEventSchema.safeParse(validCustom).success, true)

  // Enforces max timeline items limit
  const tooManyItems = Array.from({ length: 25 }, (_, i) => ({
    id: String(i),
    year: String(2000 + i),
    title: `Title ${i}`,
    description: '',
  }))
  assert.equal(
    anniversaryEventSchema.safeParse({ ...anniversary, timeline: tooManyItems })
      .success,
    false,
  )
})

test('cardSchema defaults event to empty object for backward compatibility', () => {
  const birthdayCard = createCard('birthday')
  delete birthdayCard.event
  const parsed = cardSchema.safeParse(birthdayCard)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.deepEqual(parsed.data.event, {})
  }
})

test('createCard initializes occasion-specific event config', () => {
  const weddingCard = createCard('wedding-invitation')
  assert.equal(weddingCard.event?.wedding?.rsvpEnabled, true)

  const anniversaryCard = createCard('anniversary')
  assert.ok(anniversaryCard.event?.anniversary)
  assert.ok(anniversaryCard.event.anniversary.timeline.length > 0)
})

test('rsvp storage supports save, list, delete, clear and CSV export', () => {
  const testProjectId = 'test-rsvp-' + Date.now()

  // Initially empty
  assert.deepEqual(listRsvpResponses(testProjectId), [])

  // Save responses
  const resp1 = saveRsvpResponse(testProjectId, {
    guestName: 'ဦးမောင်မောင်',
    attending: true,
    guestCount: 2,
    phone: '09123456789',
    notes: 'မင်္ဂလာပါ',
  })
  assert.equal(resp1.guestName, 'ဦးမောင်မောင်')
  assert.equal(resp1.guestCount, 2)
  assert.ok(resp1.id)
  assert.ok(resp1.createdAt)

  const resp2 = saveRsvpResponse(testProjectId, {
    guestName: 'ဒေါ်လှလှ',
    attending: false,
    guestCount: 0,
    phone: '09987654321',
  })

  const list = listRsvpResponses(testProjectId)
  assert.equal(list.length, 2)
  assert.equal(list[0].guestName, 'ဒေါ်လှလှ') // newest first

  // CSV export
  const csv = exportRsvpCsv(list)
  assert.ok(
    csv.includes('ဧည့်သည်အမည်,တက်ရောက်မှု,လူဦးရေ,ဖုန်း,ဆုမွန်စကား,ရက်စွဲ'),
  )
  assert.ok(csv.includes('ဦးမောင်မောင်'))
  assert.ok(csv.includes('တက်ရောက်ပါမည်'))
  assert.ok(csv.includes('မတက်ရောက်နိုင်ပါ'))

  // Delete single response
  const deleted = deleteRsvpResponse(testProjectId, resp2.id)
  assert.equal(deleted, true)
  assert.equal(listRsvpResponses(testProjectId).length, 1)

  // Clear all
  clearRsvpResponses(testProjectId)
  assert.equal(listRsvpResponses(testProjectId).length, 0)
})
