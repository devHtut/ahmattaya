export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
] as const
export async function hashAsset(blob: Blob): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}
export async function verifyAsset(
  id: string,
  blob: Blob,
  kind: 'image' | 'audio',
) {
  const mimes: readonly string[] = kind === 'image' ? IMAGE_MIMES : AUDIO_MIMES
  if (
    !/^[a-f0-9]{64}$/.test(id) ||
    !blob.size ||
    blob.size > (kind === 'image' ? 200 * 1024 : 20 * 1024 * 1024) ||
    !mimes.includes(blob.type) ||
    (await hashAsset(blob)) !== id
  )
    throw new Error('Invalid asset bytes')
}
