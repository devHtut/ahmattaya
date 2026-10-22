import type { SupabaseClient } from '@supabase/supabase-js'
import { readCloudConfig } from './config'
export const cloudConfig = readCloudConfig(import.meta.env)
let client: Promise<SupabaseClient> | undefined
export function getCloudClient(): Promise<SupabaseClient> {
  if (cloudConfig.status !== 'configured')
    return Promise.reject(new Error('Cloud configuration missing'))
  const { url, publicKey } = cloudConfig
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, publicKey, {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal ?? AbortSignal.timeout(120_000),
          }),
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'ahmattaya.cloud-auth',
      },
    }),
  )
  return client
}

let receiverClient: Promise<SupabaseClient> | undefined
// Recipients never restore or create the editor's guest session.
export function getReceiverClient(): Promise<SupabaseClient> {
  if (cloudConfig.status !== 'configured')
    return Promise.reject(new Error('Cloud configuration missing'))
  const { url, publicKey } = cloudConfig
  receiverClient ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, publicKey, {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: 'no-store',
            signal: init?.signal ?? AbortSignal.timeout(120_000),
          }),
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'ahmattaya.receiver',
      },
    }),
  )
  return receiverClient
}
