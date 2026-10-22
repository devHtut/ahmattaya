import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createCard } from '../src/shared/templates/templates.ts'
import { createBackground } from '../src/shared/models/background.ts'
import {
  attachCloudReceipt,
  cloudProjectCopy,
  loadProjects,
  saveProjects,
} from '../src/features/projects/project-storage.ts'
import {
  prepareCloudDraft,
  saveCloudDraft,
  readCloudDraft,
  listCloudDrafts,
  cloudDraftMessage,
  receiptFor,
} from '../src/shared/cloud/drafts.ts'

const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const now = '2026-10-22T00:00:00.000Z'
function project() {
  return {
    id: 'local-project',
    name: 'ချစ်ရသူအတွက်',
    card: createCard('birthday'),
    deleted: false,
    updatedAt: now,
  }
}
function row(overrides = {}) {
  return {
    id: 'remote-project',
    owner_id: owner,
    name: 'ချစ်ရသူအတွက်',
    revision: 2,
    updated_at: '2026-10-22T00:00:00+00:00',
    ...overrides,
  }
}
function api(body, status = 200) {
  const requests = []
  const client = createClient(
    'https://example.supabase.co',
    'public-test-key',
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (url, init) => {
          requests.push({ url: new URL(url), init })
          return new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' },
          })
        },
      },
    },
  )
  return { client, requests }
}
test('cloud snapshots retain embedded photos and external media references without mutating local cards', () => {
  const p = project()
  p.card.message = 'ချစ်ခြင်းတွေနဲ့\n  အမှတ်တရ'
  p.card.photos.push({
    id: 'photo-1',
    pageId: 'cover',
    src: 'data:image/png;base64,AQID',
    caption: 'Photo',
    frame: { x: 50, y: 50, width: 20, ratio: 1, rotation: 4, shadow: true },
  })
  assert.deepEqual(prepareCloudDraft(p).card, p.card)
  const original = structuredClone(p)
  p.card.background = createBackground('a'.repeat(64))
  assert.deepEqual(prepareCloudDraft(p).card, p.card)
  p.card.background = null
  p.card.pages.push({
    id: 'p1',
    title: 'Page',
    message: 'Text',
    paper: 'lined',
    background: createBackground('b'.repeat(64)),
  })
  assert.deepEqual(prepareCloudDraft(p).card, p.card)
  p.card.pages = []
  p.card.music = {
    trackId: 'custom',
    volume: 0.35,
    loop: true,
    custom: {
      assetId: 'c'.repeat(64),
      revision: 0,
      name: 'Song',
      seconds: 10,
      bytes: 30,
    },
  }
  assert.deepEqual(prepareCloudDraft(p).card, p.card)
  assert.equal(original.card.background, null)
  assert.throws(
    () => prepareCloudDraft({ ...original, card: { schemaVersion: 999 } }),
    { code: 'invalid' },
  )
})
test('initial save uses insert; linked drafts use owner and revision filters without upsert', async () => {
  const p = project()
  const insert = api(row({ id: p.id, revision: 1 }))
  const first = await saveCloudDraft(insert.client, owner, p)
  assert.equal(first.projectId, p.id)
  assert.equal(insert.requests[0].init.method, 'POST')
  assert.equal(JSON.parse(insert.requests[0].init.body).owner_id, owner)
  assert.equal(insert.requests[0].url.searchParams.has('on_conflict'), false)
  p.cloud = receiptFor(row())
  const update = api(row({ revision: 3 }))
  await saveCloudDraft(update.client, owner, p)
  const sent = update.requests[0]
  assert.equal(sent.init.method, 'PATCH')
  assert.equal(sent.url.searchParams.get('owner_id'), `eq.${owner}`)
  assert.equal(sent.url.searchParams.get('id'), 'eq.remote-project')
  assert.equal(sent.url.searchParams.get('revision'), 'eq.2')
  assert.deepEqual(Object.keys(JSON.parse(sent.init.body)).sort(), [
    'card',
    'media',
    'name',
  ])
  // A different Guest never inherits another Guest's remote identity.
  const changedOwner = api(row({ owner_id: other, id: p.id, revision: 1 }))
  await saveCloudDraft(changedOwner.client, other, p)
  assert.equal(changedOwner.requests[0].init.method, 'POST')
  assert.equal(JSON.parse(changedOwner.requests[0].init.body).id, p.id)
})
test('conflicts, rejected schemas and another owner never become successful saves or restores', async () => {
  const p = { ...project(), cloud: receiptFor(row()) }
  await assert.rejects(saveCloudDraft(api(null).client, owner, p), {
    code: 'conflict',
  })
  await assert.rejects(
    saveCloudDraft(
      api({ code: '23505', message: 'duplicate' }, 409).client,
      owner,
      project(),
    ),
    { code: '23505' },
  )
  await assert.rejects(
    saveCloudDraft(api(row({ owner_id: other })).client, owner, p),
    { code: 'invalid' },
  )
  await assert.rejects(
    readCloudDraft(
      api({ ...row(), card: { schemaVersion: 999 } }).client,
      owner,
      'remote-project',
    ),
    { code: 'invalid' },
  )
  await assert.rejects(
    readCloudDraft(
      api({ ...row({ owner_id: other }), card: p.card }).client,
      owner,
      'remote-project',
    ),
    { code: 'invalid' },
  )
  const read = api({ ...row(), card: p.card })
  assert.deepEqual(
    (await readCloudDraft(read.client, owner, 'remote-project')).card,
    p.card,
  )
  const list = api([row()])
  assert.equal((await listCloudDrafts(list.client, owner, 20)).length, 1)
  assert.equal(list.requests[0].url.searchParams.get('offset'), '20')
  assert.equal(
    list.requests[0].url.searchParams.get('select').includes('card'),
    false,
  )
})
test('server receipts preserve edits made in flight, survive storage and cloud restores create independent local copies', () => {
  const p = project()
  const library = { version: 1, activeId: p.id, projects: [p] }
  p.card.message = 'New edits while upload is in flight'
  const receipt = receiptFor(row())
  const acknowledged = attachCloudReceipt(library, p.id, receipt)
  assert.equal(acknowledged.projects[0].card.message, p.card.message)
  assert.equal(library.projects[0].cloud, undefined)
  const data = new Map()
  const storage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  }
  assert.equal(saveProjects(storage, acknowledged), true)
  assert.deepEqual(loadProjects(storage).library, acknowledged)
  const remote = { ...row(), card: p.card }
  const copy = cloudProjectCopy(remote)
  assert.notEqual(copy.id, p.id)
  assert.notEqual(copy.id, remote.id)
  assert.equal(copy.cloud.projectId, remote.id)
  assert.equal(copy.cloud.revision, 2)
  copy.card.message = 'Independent edit'
  assert.equal(remote.card.message, p.card.message)
})
test('friendly errors do not expose raw server messages', () => {
  assert.match(cloudDraftMessage({ code: 'PGRST205' }), /database/)
  assert.equal(
    cloudDraftMessage({ message: 'sensitive details' }).includes(
      'sensitive details',
    ),
    false,
  )
  assert.match(cloudDraftMessage({ code: '23505' }), /Cloud/)
})
