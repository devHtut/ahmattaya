import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createCard } from '../src/shared/templates/templates.ts'
import { createBackground } from '../src/shared/models/background.ts'
import { hashAsset, verifyAsset } from '../src/shared/media/asset-bytes.ts'
import { cacheImageAsset } from '../src/shared/media/image-assets.ts'
import { cacheAudioAsset } from '../src/shared/media/audio-assets.ts'
import {
  mediaPath,
  mediaReferences,
  uploadDraftMedia,
  restoreDraftMedia,
  validateMediaManifest,
} from '../src/shared/cloud/media.ts'
import { saveCloudDraft, readCloudDraft } from '../src/shared/cloud/drafts.ts'

const owner = '11111111-1111-4111-8111-111111111111'
async function fixture() {
  const image = new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], {
    type: 'image/png',
  })
  const audio = new Blob([new Uint8Array([82, 73, 70, 70, 4, 5, 6])], {
    type: 'audio/wav',
  })
  const imageId = await hashAsset(image),
    audioId = await hashAsset(audio)
  const card = createCard('birthday')
  card.background = createBackground(imageId)
  card.pages = [
    {
      id: 'p1',
      title: 'Memory',
      message: 'Text',
      paper: 'lined',
      background: { ...createBackground(imageId), zoom: 2 },
    },
  ]
  card.music = {
    trackId: 'custom',
    volume: 0.35,
    loop: true,
    custom: {
      assetId: audioId,
      revision: 0,
      bytes: audio.size,
      seconds: 1,
      name: 'Song',
    },
  }
  const manifest = [
    { kind: 'image', id: imageId, bytes: image.size, mime: image.type },
    { kind: 'audio', id: audioId, bytes: audio.size, mime: audio.type },
  ]
  return { card, image, audio, manifest }
}
function cache(entries = []) {
  const data = new Map(entries),
    writes = []
  return {
    data,
    writes,
    load: async (kind, id) => data.get(`${kind}:${id}`) ?? null,
    put: async (asset, blob) => {
      writes.push(asset)
      data.set(`${asset.kind}:${asset.id}`, blob)
    },
  }
}
function api(
  manifest,
  blobs,
  {
    duplicate = false,
    failAudio = false,
    badDownload = false,
    stale = false,
  } = {},
) {
  const calls = []
  const client = createClient(
    'https://example.supabase.co',
    'public-test-key',
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (input, init = {}) => {
          const url = new URL(input),
            method = init.method ?? 'GET'
          calls.push({ url, method, body: init.body })
          if (url.pathname.includes('/storage/v1/object/')) {
            const id = url.pathname.split('/').at(-1)
            if (method === 'POST') {
              if (duplicate || (failAudio && id === manifest[1].id))
                return new Response(
                  JSON.stringify({
                    statusCode: duplicate ? '409' : '503',
                    message: duplicate
                      ? 'The resource already exists'
                      : 'unavailable',
                  }),
                  {
                    status: duplicate ? 409 : 503,
                    headers: { 'Content-Type': 'application/json' },
                  },
                )
              return new Response(
                JSON.stringify({ Id: 'stored', Key: url.pathname }),
                { headers: { 'Content-Type': 'application/json' } },
              )
            }
            const blob = badDownload
              ? new Blob(['corrupt'], { type: 'image/png' })
              : blobs.get(id)
            return new Response(blob ?? 'missing', {
              status: blob ? 200 : 404,
              headers: { 'Content-Type': blob?.type ?? 'text/plain' },
            })
          }
          if (url.pathname.includes('/rest/v1/')) {
            const row = {
              id: 'project',
              owner_id: owner,
              name: 'Media card',
              revision: 1,
              updated_at: '2026-10-22T00:00:00Z',
              card: api.card,
              media: manifest,
            }
            return new Response(JSON.stringify(stale ? null : row), {
              headers: { 'Content-Type': 'application/json' },
            })
          }
          throw Error('Unexpected URL')
        },
      },
    },
  )
  return { client, calls }
}
test('media references deduplicate shared page backgrounds and require a complete, bounded manifest', async () => {
  const f = await fixture()
  assert.equal(mediaReferences(f.card).length, 2)
  assert.deepEqual(validateMediaManifest(f.card, f.manifest), f.manifest)
  for (const bad of [
    [],
    [f.manifest[0]],
    [...f.manifest, f.manifest[0]],
    [{ ...f.manifest[0], url: 'https://evil.example' }, f.manifest[1]],
    [f.manifest[0], { ...f.manifest[1], bytes: 999 }],
  ])
    assert.throws(() => validateMediaManifest(f.card, bad), {
      code: 'media-invalid',
    })
  assert.throws(() => mediaPath('../owner', f.manifest[0]), {
    code: 'media-invalid',
  })
  assert.equal(
    mediaPath(owner, f.manifest[0]),
    `${owner}/image/${f.manifest[0].id}`,
  )
})
test('every local dependency is validated before uploading; absent, oversized and corrupt files fail safely', async () => {
  const f = await fixture(),
    c = cache([[`image:${f.manifest[0].id}`, f.image]]),
    a = api(f.manifest, new Map())
  await assert.rejects(
    uploadDraftMedia(a.client, owner, f.card, { cache: c }),
    { code: 'media-missing' },
  )
  assert.equal(a.calls.length, 0)
  c.data.set(
    `audio:${f.manifest[1].id}`,
    new Blob(['wrong'], { type: 'audio/wav' }),
  )
  await assert.rejects(
    uploadDraftMedia(a.client, owner, f.card, { cache: c }),
    { code: 'media-corrupt' },
  )
  assert.equal(a.calls.length, 0)
  await assert.rejects(
    verifyAsset(
      f.manifest[0].id,
      new Blob([new Uint8Array(204801)], { type: 'image/png' }),
      'image',
    ),
  )
  await assert.rejects(
    cacheImageAsset(
      f.manifest[0].id,
      new Blob(['bad'], { type: 'image/svg+xml' }),
    ),
  )
  await assert.rejects(
    cacheAudioAsset(f.manifest[1].id, new Blob(['bad'], { type: 'text/html' })),
  )
})
test('all uploads precede the draft commit, and confirmed immutable files are reused on retry', async () => {
  const f = await fixture(),
    c = cache(
      f.manifest.map((m, i) => [`${m.kind}:${m.id}`, i ? f.audio : f.image]),
    ),
    a = api(f.manifest, new Map())
  const project = {
    id: 'project',
    name: 'Media card',
    card: f.card,
    updatedAt: '2026-10-22T00:00:00Z',
    deleted: false,
  }
  const progress = []
  await saveCloudDraft(a.client, owner, project, {
    cache: c,
    onProgress: (p) => progress.push(p),
  })
  assert.equal(a.calls.length, 3)
  assert.ok(
    a.calls
      .slice(0, 2)
      .every((c) => c.url.pathname.includes('/storage/v1/object/')),
  )
  assert.deepEqual(JSON.parse(a.calls[2].body).media, f.manifest)
  assert.deepEqual(progress.at(-1), { phase: 'upload', completed: 2, total: 2 })
  await saveCloudDraft(a.client, owner, project, { cache: c })
  assert.equal(
    a.calls.filter((c) => c.url.pathname.includes('/storage/v1/')).length,
    2,
  )
})
test('partial upload failure never commits or deletes shared media', async () => {
  const f = await fixture(),
    c = cache(
      f.manifest.map((m, i) => [`${m.kind}:${m.id}`, i ? f.audio : f.image]),
    ),
    a = api(f.manifest, new Map(), { failAudio: true })
  await assert.rejects(
    saveCloudDraft(
      a.client,
      owner,
      { id: 'project', name: 'Test', card: f.card },
      { cache: c },
    ),
    { code: 'media-upload' },
  )
  assert.equal(
    a.calls.some((c) => c.url.pathname.includes('/rest/v1/')),
    false,
  )
  assert.equal(
    a.calls.some((c) => c.method === 'DELETE'),
    false,
  )
})
test('existing object conflicts are accepted only after downloading and verifying the bytes', async () => {
  const f = await fixture(),
    c = cache(
      f.manifest.map((m, i) => [`${m.kind}:${m.id}`, i ? f.audio : f.image]),
    ),
    blobs = new Map([
      [f.manifest[0].id, f.image],
      [f.manifest[1].id, f.audio],
    ])
  const a = api(f.manifest, blobs, { duplicate: true })
  assert.deepEqual(
    await uploadDraftMedia(a.client, owner, f.card, { cache: c }),
    f.manifest,
  )
  assert.equal(a.calls.filter((c) => c.method === 'GET').length, 2)
  const bad = api(f.manifest, blobs, { duplicate: true, badDownload: true })
  await assert.rejects(
    uploadDraftMedia(bad.client, owner, f.card, { cache: c }),
    { code: 'media-corrupt' },
  )
})
test('fresh restores download and validate every asset before returning a card; existing caches are repaired', async () => {
  const f = await fixture(),
    blobs = new Map([
      [f.manifest[0].id, f.image],
      [f.manifest[1].id, f.audio],
    ]),
    a = api(f.manifest, blobs),
    c = cache()
  api.card = f.card
  const row = await readCloudDraft(a.client, owner, 'project', { cache: c })
  assert.deepEqual(row.card, f.card)
  assert.equal(c.writes.length, 2)
  assert.equal(a.calls.filter((c) => c.method === 'GET').length, 3)
  c.data.set(
    `image:${f.manifest[0].id}`,
    new Blob(['bad'], { type: 'image/png' }),
  )
  await restoreDraftMedia(a.client, owner, f.card, f.manifest, { cache: c })
  assert.equal(c.writes.length, 3)
  const bad = api(f.manifest, blobs, { badDownload: true })
  await assert.rejects(
    readCloudDraft(bad.client, owner, 'project', { cache: cache() }),
    { code: 'media-corrupt' },
  )
  const quota = cache()
  quota.put = async () => {
    throw Error('quota')
  }
  await assert.rejects(
    restoreDraftMedia(a.client, owner, f.card, f.manifest, { cache: quota }),
    { code: 'media-local' },
  )
})
