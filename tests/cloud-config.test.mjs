import test from 'node:test'
import assert from 'node:assert/strict'
import { readCloudConfig } from '../src/shared/cloud/config.ts'
import { guestAuthMessage } from '../src/shared/cloud/auth-errors.ts'
const url = 'https://exampleproject.supabase.co'
const jwt = (payload) =>
  'header.' +
  Buffer.from(JSON.stringify(payload)).toString('base64url') +
  '.signature'
const publicKey = jwt({ role: 'anon', ref: 'exampleproject' })
test('cloud configuration supports public keys and stays disabled when incomplete', () => {
  assert.equal(readCloudConfig({}).status, 'missing')
  assert.equal(readCloudConfig({ VITE_SUPABASE_URL: url }).status, 'missing')
  assert.deepEqual(
    readCloudConfig({
      VITE_SUPABASE_URL: url + '/',
      VITE_SUPABASE_ANON_KEY: publicKey,
    }),
    { status: 'configured', url, publicKey },
  )
  assert.equal(
    readCloudConfig({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test-key',
    }).status,
    'configured',
  )
})
test('cloud configuration rejects secret/service-role keys, mismatched projects and unsafe URLs', () => {
  for (const key of [
    'sb_secret_not-public',
    jwt({ role: 'service_role', ref: 'exampleproject' }),
    jwt({ role: 'anon', ref: 'anotherproject' }),
    'broken.jwt',
    jwt(null),
  ])
    assert.equal(
      readCloudConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key })
        .status,
      'invalid',
    )
  for (const address of [
    'http://exampleproject.supabase.co',
    'https://user:password@exampleproject.supabase.co',
    url + '/auth',
    url + '?key=wrong',
    url + '#token',
  ])
    assert.equal(
      readCloudConfig({
        VITE_SUPABASE_URL: address,
        VITE_SUPABASE_ANON_KEY: publicKey,
      }).status,
      'invalid',
    )
})
test('guest auth errors distinguish disabled provider, captcha and rate limits without exposing raw server messages', () => {
  assert.match(
    guestAuthMessage({ code: 'anonymous_provider_disabled' }),
    /Anonymous sign-in/,
  )
  assert.match(guestAuthMessage({ code: 'captcha_failed' }), /CAPTCHA/)
  assert.match(guestAuthMessage({ status: 429 }), /ခဏကြာမှ/)
  assert.equal(
    guestAuthMessage({ message: 'sensitive internal detail' }).includes(
      'sensitive',
    ),
    false,
  )
})
