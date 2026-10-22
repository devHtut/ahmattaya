import test from 'node:test'
import assert from 'node:assert/strict'
import {
  accountEmail,
  accountCode,
  requestAccountCode,
  confirmAccountCode,
  signOutAccount,
  accountMessage,
  isPermanentAccount,
} from '../src/shared/cloud/account.ts'
const id = '11111111-1111-4111-8111-111111111111'
const guest = { id, is_anonymous: true, email: '', email_confirmed_at: null }
const permanent = {
  id,
  is_anonymous: false,
  email: 'test@example.com',
  email_confirmed_at: '2026-10-22T00:00:00Z',
}
function api(initial = null) {
  let user = initial
  const calls = []
  return {
    calls,
    setUser: (value) => {
      user = value
    },
    auth: {
      getSession: async () => ({
        data: { session: user ? { user } : null },
        error: null,
      }),
      getUser: async () => ({ data: { user }, error: null }),
      updateUser: async (data) => {
        calls.push(['update', data])
        return { data: { user }, error: null }
      },
      signInWithOtp: async (data) => {
        calls.push(['send', data])
        return { data: {}, error: null }
      },
      verifyOtp: async (data) => {
        calls.push(['verify', data])
        user = permanent
        return { data: { user, session: { user } }, error: null }
      },
      signOut: async (data) => {
        calls.push(['out', data])
        user = null
        return { error: null }
      },
    },
  }
}
test('email/code validation rejects malformed input and errors never expose server messages', () => {
  assert.equal(accountEmail('  test@example.com '), 'test@example.com')
  assert.equal(accountCode('123 456'), '123456')
  for (const email of ['bad', 'a@', 'a'.repeat(260) + '@example.com'])
    assert.throws(() => accountEmail(email), { code: 'invalid-email' })
  for (const code of ['123', 'abcdef', '12345678901', '<script>'])
    assert.throws(() => accountCode(code), { code: 'invalid-code' })
  assert.equal(isPermanentAccount(guest), false)
  assert.equal(
    isPermanentAccount({ ...permanent, email_confirmed_at: null }),
    false,
  )
  assert.equal(isPermanentAccount(permanent), true)
  assert.ok(
    !accountMessage({ message: 'secret token 123456' }).includes('secret'),
  )
})
test('guest upgrade uses email-change verification and preserves identity without signing into another account', async () => {
  const c = api(guest)
  const attempt = await requestAccountCode(c, 'test@example.com')
  assert.deepEqual(attempt, {
    email: 'test@example.com',
    mode: 'link',
    ownerId: id,
  })
  assert.deepEqual(c.calls, [['update', { email: 'test@example.com' }]])
  assert.equal((await confirmAccountCode(c, attempt, '123456')).id, id)
  assert.deepEqual(c.calls[1], [
    'verify',
    { email: 'test@example.com', token: '123456', type: 'email_change' },
  ])
})
test('signed-out users request and verify an email code; sign-out affects only this device', async () => {
  const c = api()
  const attempt = await requestAccountCode(c, 'test@example.com')
  assert.deepEqual(c.calls[0], [
    'send',
    { email: 'test@example.com', options: { shouldCreateUser: true } },
  ])
  await confirmAccountCode(c, attempt, '123456')
  assert.equal(c.calls[1][1].type, 'email')
  await signOutAccount(c)
  assert.deepEqual(c.calls[2], ['out', { scope: 'local' }])
})
test('guest sign-out and stale attempts cannot replace or discard an existing identity', async () => {
  const c = api(guest)
  await assert.rejects(signOutAccount(c), { code: 'guest-signout' })
  await assert.rejects(
    confirmAccountCode(
      c,
      { email: 'test@example.com', mode: 'login' },
      '123456',
    ),
    { code: 'identity-changed' },
  )
  await assert.rejects(
    confirmAccountCode(
      c,
      { email: 'test@example.com', mode: 'link', ownerId: 'other' },
      '123456',
    ),
    { code: 'identity-changed' },
  )
  assert.deepEqual(c.calls, [])
  c.setUser(permanent)
  await assert.rejects(requestAccountCode(c, 'other@example.com'), {
    code: 'already-signed-in',
  })
})
test('rejected linking or invalid verification never reports a successful account', async () => {
  const c = api(guest)
  c.auth.updateUser = async () => ({
    data: { user: null },
    error: { code: 'email_exists' },
  })
  await assert.rejects(requestAccountCode(c, 'test@example.com'), {
    code: 'email_exists',
  })
  c.auth.verifyOtp = async () => ({
    data: { user: guest, session: { user: guest } },
    error: null,
  })
  await assert.rejects(
    confirmAccountCode(
      c,
      { email: 'test@example.com', mode: 'link', ownerId: id },
      '123456',
    ),
    { code: 'not-confirmed' },
  )
  assert.deepEqual(c.calls, [])
})

test('pending email confirmation can resume without treating an unconfirmed email as an account', async () => {
  const c = api({
    ...guest,
    is_anonymous: false,
    new_email: 'test@example.com',
  })
  const attempt = await requestAccountCode(c, 'test@example.com')
  assert.equal(attempt.mode, 'link')
  assert.equal((await confirmAccountCode(c, attempt, '123456')).id, id)
})
