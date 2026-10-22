import {
  publishProject,
  loadPublishedCard,
  downloadPublishedMedia,
  PUBLISHED_BUCKET,
  unpublish,
} from '../src/shared/cloud/publishing.ts'
// Opt-in live check: two isolated guests, a tiny image, an original preset WAV
// and one published fixture draft. No existing user drafts or files are read.
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
          cache: 'no-store',
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
if (process.argv[2] === '--receiver-only') {
  try {
    const unsigned = client()
    const snapshot = await loadPublishedCard(unsigned, process.argv[3])
    for (const asset of snapshot.media)
      await downloadPublishedMedia(unsigned, snapshot.id, asset)
    console.log('Receiver-only verified')
  } catch (error) {
    console.error('Receiver-only failed:', error.code || error.name)
    process.exitCode = 1
  }
  process.exit(process.exitCode ?? 0)
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
  let publication = await publishProject(owner, ownerId, p, {
    cache,
    onSaved: (r) => {
      p.cloud = r
    },
  })
  const snapshot = await loadPublishedCard(unsigned, publication.id)
  assert.equal(snapshot.media.length, 2)
  assert.equal(snapshot.card.title, card.title)
  assert.equal('owner_id' in snapshot, false)
  for (const asset of snapshot.media) {
    await downloadPublishedMedia(owner, publication.id, asset)
    await downloadPublishedMedia(unsigned, publication.id, asset)
  }
  const path = mediaPath(publication.id, snapshot.media[0])
  const listing = await unsigned.storage
    .from(PUBLISHED_BUCKET)
    .list(publication.id + '/image')
  assert.ok(
    listing.error || listing.data.length === 0,
    'Receiver must not list media',
  )
  const rootListing = await unsigned.storage.from(PUBLISHED_BUCKET).list('')
  assert.ok(
    rootListing.error || rootListing.data.length === 0,
    'Receiver must not enumerate publications',
  )
  assert.ok(
    (await unsigned.storage.from(PUBLISHED_BUCKET).createSignedUrl(path, 60))
      .error,
    'Receiver cannot sign files',
  )
  assert.ok((await other.rpc('unpublish_card', { p_id: publication.id })).error)
  assert.ok((await unsigned.from('published_cards').select('*')).error)
  p.card.title = 'Updated only in private draft'
  p.cloud = await saveCloudDraft(owner, ownerId, p, { cache })
  assert.equal(
    (await loadPublishedCard(unsigned, publication.id)).card.title,
    snapshot.card.title,
  )
  // Compare to captured public snapshot rather than mutable local card.
  assert.notEqual(
    (await loadPublishedCard(unsigned, publication.id)).card.title,
    p.card.title,
  )
  const firstId = publication.id
  publication = await publishProject(owner, ownerId, p, {
    cache,
    onSaved: (r) => {
      p.cloud = r
    },
  })
  assert.equal(publication.id, firstId)
  assert.equal(
    (await loadPublishedCard(unsigned, firstId)).card.title,
    p.card.title,
  )
  await unpublish(owner, firstId)
  await assert.rejects(
    loadPublishedCard(unsigned, firstId),
    /publication-missing/,
  )
  assert.ok(
    (
      await unsigned.storage
        .from(PUBLISHED_BUCKET)
        .download(
          path,
          { cacheNonce: crypto.randomUUID() },
          { cache: 'no-store' },
        )
    ).error,
  )
  console.log(
    'PASS: receiver snapshot with verified image/audio, unsigned downloads, no listing/signing/table reads, owner-only controls, private edit isolation, same-link republish and revocation.',
  )
  console.log(
    'Isolated test guest fixtures remain; no existing user data was changed.',
  )
} catch (error) {
  console.error(
    'Live publishing verification failed:',
    error?.code || error?.name || 'unknown',
    error?.code === 'ERR_ASSERTION' ? error.stack : '',
  )
  process.exitCode = 1
}
