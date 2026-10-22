// Opt-in live verification. Creates two temporary Auth guests and one harmless
// private fixture row. It never reads existing drafts or logs keys/tokens.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { createCard } from '../src/shared/templates/templates.ts'
import { saveCloudDraft, readCloudDraft } from '../src/shared/cloud/drafts.ts'

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i), line.slice(i + 1).trim()]
    }),
)
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
assert.ok(url && key, 'Public cloud configuration is required')
function client() {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
const owner = client(),
  other = client(),
  unsigned = client()
try {
  const a = await owner.auth.signInAnonymously()
  const b = await other.auth.signInAnonymously()
  assert.equal(a.error, null, 'Owner guest sign-in failed')
  assert.equal(b.error, null, 'Other guest sign-in failed')
  const ownerId = a.data.user.id
  const project = {
    id: crypto.randomUUID(),
    name: 'Cloud access verification fixture',
    card: createCard('birthday'),
    updatedAt: new Date().toISOString(),
    deleted: false,
  }
  project.cloud = await saveCloudDraft(owner, ownerId, project)
  assert.equal(project.cloud.revision, 1)
  assert.deepEqual(
    (await readCloudDraft(owner, ownerId, project.id)).card,
    project.card,
  )
  project.card.message = 'Live verification snapshot — no personal content.'
  const updated = await saveCloudDraft(owner, ownerId, project)
  assert.equal(updated.revision, 2)
  await assert.rejects(saveCloudDraft(owner, ownerId, project), {
    code: 'conflict',
  })
  // Target the exact fixture, without owner filters, to test RLS itself.
  const hidden = await other
    .from('private_drafts')
    .select('id')
    .eq('id', project.id)
  assert.equal(hidden.error, null)
  assert.deepEqual(hidden.data, [])
  const deniedUpdate = await other
    .from('private_drafts')
    .update({ name: 'Must not succeed' })
    .eq('id', project.id)
    .select('id')
  assert.equal(deniedUpdate.error, null)
  assert.deepEqual(deniedUpdate.data, [])
  const forged = await other
    .from('private_drafts')
    .insert({
      owner_id: ownerId,
      id: crypto.randomUUID(),
      name: 'Denied fixture',
      card: project.card,
    })
  assert.equal(forged.error?.code, '42501')
  const ownership = await owner
    .from('private_drafts')
    .update({ owner_id: b.data.user.id })
    .eq('id', project.id)
  assert.equal(ownership.error?.code, '42501')
  const anonymousRead = await unsigned
    .from('private_drafts')
    .select('id')
    .eq('id', project.id)
  assert.equal(anonymousRead.error?.code, '42501')
  assert.equal(
    (await readCloudDraft(owner, ownerId, project.id)).name,
    project.name,
  )
  console.log(
    'PASS: live insert/read/update, stale-save conflict, unrelated-guest isolation, forged-owner rejection, immutable ownership and unauthenticated denial.',
  )
  console.log(
    'One private verification fixture remains under a temporary test guest; no existing user drafts were read or changed.',
  )
} catch (error) {
  console.error(
    'Live Cloud verification failed:',
    error?.code || error?.name || 'unknown',
  )
  process.exitCode = 1
}
