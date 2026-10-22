// Opt-in live check: two isolated guests, a tiny image, an original preset WAV
// and one private fixture draft. No existing user drafts or files are read.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { createCard } from '../src/shared/templates/templates.ts'
import { createBackground } from '../src/shared/models/background.ts'
import { hashAsset } from '../src/shared/media/asset-bytes.ts'
import { mediaPath, MEDIA_BUCKET } from '../src/shared/cloud/media.ts'
import { saveCloudDraft, readCloudDraft } from '../src/shared/cloud/drafts.ts'

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).trim()]
    }),
)
const url = env.VITE_SUPABASE_URL,
  key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
assert.ok(url && key, 'Cloud configuration required')
function client() {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal ?? AbortSignal.timeout(120000),
        }),
    },
  })
}
function memoryCache(entries = []) {
  const data = new Map(entries)
  return {
    data,
    load: async (kind, id) => data.get(`${kind}:${id}`) ?? null,
    put: async (asset, blob) => {
      data.set(`${asset.kind}:${asset.id}`, blob)
    },
  }
}
try {
  const owner = client(),
    other = client(),
    unsigned = client()
  const a = await owner.auth.signInAnonymously(),
    b = await other.auth.signInAnonymously()
  assert.equal(a.error, null)
  assert.equal(b.error, null)
  const ownerId = a.data.user.id
  const image = new Blob(
    [
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=',
        'base64',
      ),
    ],
    { type: 'image/png' },
  )
  const audio = new Blob(
    [await readFile('public/music/little-celebration.wav')],
    { type: 'audio/wav' },
  )
  const imageId = await hashAsset(image),
    audioId = await hashAsset(audio)
  const card = createCard('birthday')
  card.background = createBackground(imageId)
  card.pages = [
    {
      id: 'memory',
      title: 'Media test',
      message: 'Shared background',
      paper: 'lined',
      background: createBackground(imageId),
    },
  ]
  card.music = {
    trackId: 'custom',
    volume: 0.35,
    loop: true,
    custom: {
      assetId: audioId,
      revision: 0,
      name: 'Original verification melody.wav',
      seconds: (audio.size - 44) / 44100,
      bytes: audio.size,
    },
  }
  const p = {
    id: crypto.randomUUID(),
    name: 'Private media verification fixture',
    card,
    deleted: false,
    updatedAt: new Date().toISOString(),
  }
  const cache = memoryCache([
    [`image:${imageId}`, image],
    [`audio:${audioId}`, audio],
  ])
  p.cloud = await saveCloudDraft(owner, ownerId, p, { cache })
  assert.equal(p.cloud.revision, 1)
  const empty = memoryCache()
  const restored = await readCloudDraft(owner, ownerId, p.id, { cache: empty })
  assert.equal(restored.media.length, 2)
  assert.equal(empty.data.size, 2)
  assert.deepEqual(
    Buffer.from(await empty.data.get(`audio:${audioId}`).arrayBuffer()),
    Buffer.from(await audio.arrayBuffer()),
  )
  // New SDK instance exercises existing-object verification after a reload.
  const fresh = client()
  assert.equal((await fresh.auth.setSession(a.data.session)).error, null)
  p.cloud = await saveCloudDraft(fresh, ownerId, p, { cache })
  assert.equal(p.cloud.revision, 2)
  const path = mediaPath(ownerId, restored.media[0])
  assert.ok((await other.storage.from(MEDIA_BUCKET).download(path)).error)
  assert.ok((await unsigned.storage.from(MEDIA_BUCKET).download(path)).error)
  const foreignUpload = await other.storage
    .from(MEDIA_BUCKET)
    .upload(`${ownerId}/image/${'f'.repeat(64)}`, image, {
      contentType: 'image/png',
    })
  assert.ok(foreignUpload.error)
  const overwrite = await owner.storage
    .from(MEDIA_BUCKET)
    .upload(path, image, { contentType: 'image/png', upsert: true })
  assert.ok(overwrite.error)
  const publicUrl = owner.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    .data.publicUrl
  assert.equal(
    (await fetch(publicUrl, { signal: AbortSignal.timeout(20000) })).ok,
    false,
  )
  const incomplete = await owner
    .from('private_drafts')
    .update({ media: [] })
    .eq('id', p.id)
  assert.equal(incomplete.error?.code, '23514')
  assert.equal(
    (await readCloudDraft(owner, ownerId, p.id, { cache: empty })).revision,
    2,
  )
  console.log(
    'PASS: private image/audio uploads, complete manifest, fresh-cache download, duplicate reuse, other/unsigned/public denial, foreign-path rejection, immutable objects and missing-manifest rejection.',
  )
  console.log(
    'One private fixture draft and two small verification files remain under an isolated test guest; no existing user data was changed.',
  )
} catch (error) {
  console.error(
    'Live media verification failed:',
    error?.code || error?.name || 'unknown',
  )
  process.exitCode = 1
}
