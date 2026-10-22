export type CloudConfigResult =
  | { status: 'missing' | 'invalid' }
  | { status: 'configured'; url: string; publicKey: string }

// This only catches configuration mistakes; Supabase verifies authentication and
// RLS server-side. Client-side JWT decoding is not an authorization check.
export function readCloudConfig(
  env: Record<string, string | undefined>,
): CloudConfigResult {
  const rawUrl = env.VITE_SUPABASE_URL?.trim()
  const key = (
    env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
  )?.trim()
  if (!rawUrl || !key) return { status: 'missing' }
  try {
    const url = new URL(rawUrl)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    )
      return { status: 'invalid' }
    if (
      key.startsWith('sb_publishable_') &&
      /^sb_publishable_[A-Za-z0-9_-]+$/.test(key)
    )
      return { status: 'configured', url: url.origin, publicKey: key }
    const parts = key.split('.')
    if (parts.length !== 3) return { status: 'invalid' }
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    )
    if (
      payload.role !== 'anon' ||
      (url.hostname.endsWith('.supabase.co') &&
        payload.ref !== url.hostname.split('.')[0])
    )
      return { status: 'invalid' }
    return { status: 'configured', url: url.origin, publicKey: key }
  } catch {
    return { status: 'invalid' }
  }
}
