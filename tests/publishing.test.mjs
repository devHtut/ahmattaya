import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createCard } from '../src/shared/templates/templates.ts'
import { createBackground } from '../src/shared/models/background.ts'
import { hashAsset } from '../src/shared/media/asset-bytes.ts'
import {
  publishProject,
  parsePublishedCard,
  receiverUrl,
  loadPublishedCard,
  downloadPublishedMedia,
} from '../src/shared/cloud/publishing.ts'
const owner = '11111111-1111-4111-8111-111111111111',
  id = '22222222-2222-4222-8222-222222222222',
  build = '33333333-3333-4333-8333-333333333333',
  now = '2026-10-22T00:00:00Z'
function api(handler) {
  return createClient('https://example.supabase.co', 'public-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init = {}) => {
        const result = await handler(new URL(input), init)
        return new Response(JSON.stringify(result.body), {
          status: result.status ?? 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  })
}
function project() {
  return {
    id: 'project',
    name: 'Test',
    card: createCard('birthday'),
    deleted: false,
    updatedAt: now,
  }
}
function published(card) {
  return { id, revision: 1, published_at: now, card, media: [] }
}
test('receiver links are canonical and snapshots reject malformed cards and missing media without local fallback', async () => {
  const p = project()
  assert.equal(receiverUrl(id), 'https://ahmattaya.vercel.app/r/' + id)
  assert.throws(() => receiverUrl('../x'))
  for (const base of [
    'http://localhost',
    'javascript:alert(1)',
    'https://a:b@example.com',
  ])
    assert.throws(() => receiverUrl(id, base))
  assert.deepEqual(parsePublishedCard(published(p.card), id).card, p.card)
  assert.throws(() =>
    parsePublishedCard(published({ ...p.card, schemaVersion: 999 }), id),
  )
  assert.throws(() =>
    parsePublishedCard(
      published({ ...p.card, background: createBackground('a'.repeat(64)) }),
      id,
    ),
  )
  let calls = 0
  const client = api(() => {
    calls++
    return { body: null }
  })
  await assert.rejects(loadPublishedCard(client, 'bad'), {
    code: 'publication-missing',
  })
  assert.equal(calls, 0)
  await assert.rejects(loadPublishedCard(client, id), {
    code: 'publication-missing',
  })
  assert.equal(calls, 1)
})
test('publishing preserves the committed draft receipt when later copying fails; never finalizes an incomplete publication', async () => {
  const p = project(),
    blob = new Blob(['image'], { type: 'image/png' }),
    asset = {
      kind: 'image',
      id: await hashAsset(blob),
      bytes: blob.size,
      mime: blob.type,
    }
  p.card.background = createBackground(asset.id)
  const calls = [],
    receipts = []
  const client = api((url, init) => {
    calls.push(url.pathname)
    if (url.pathname === '/rest/v1/private_drafts')
      return {
        body: {
          id: p.id,
          owner_id: owner,
          name: p.name,
          revision: 1,
          updated_at: now,
        },
      }
    if (url.pathname.endsWith('/begin_card_publication'))
      return {
        body: {
          build_id: build,
          id,
          source_revision: 1,
          card: p.card,
          media: [asset],
        },
      }
    if (url.pathname.includes('/published-media/'))
      return {
        status: 503,
        body: { message: 'Unavailable', statusCode: '503' },
      }
    if (url.pathname.includes('/draft-media/'))
      return { body: { Id: 'stored', Key: 'stored' } }
    throw Error('Unexpected request: ' + url.pathname + ' ' + init.method)
  })
  await assert.rejects(
    publishProject(client, owner, p, {
      cache: { load: async () => blob, put: async () => {} },
      onSaved: (r) => receipts.push(r),
    }),
    { code: 'publication-media' },
  )
  assert.equal(receipts.length, 1)
  assert.equal(receipts[0].revision, 1)
  assert.equal(
    calls.some((x) => x.endsWith('/finish_card_publication')),
    false,
  )
  assert.equal(p.cloud, undefined)
})
test('receiver downloads reject corrupt bytes, even if storage returns success', async () => {
  const blob = new Blob(['valid'], { type: 'image/png' }),
    asset = {
      kind: 'image',
      id: await hashAsset(blob),
      bytes: blob.size,
      mime: blob.type,
    }
  const requests = []
  const client = createClient(
    'https://example.supabase.co',
    'public-test-key',
    {
      auth: { persistSession: false },
      global: {
        fetch: async (url, init) => {
          requests.push({ url: new URL(url), cache: init.cache })
          return new Response('wrong', {
            headers: { 'Content-Type': 'image/png' },
          })
        },
      },
    },
  )
  await assert.rejects(downloadPublishedMedia(client, id, asset), {
    code: 'media-corrupt',
  })
  await assert.rejects(downloadPublishedMedia(client, id, asset), {
    code: 'media-corrupt',
  })
  assert.equal(requests[0].cache, 'no-store')
  assert.ok(requests[0].url.searchParams.get('cacheNonce'))
  assert.notEqual(
    requests[0].url.searchParams.get('cacheNonce'),
    requests[1].url.searchParams.get('cacheNonce'),
  )
})
