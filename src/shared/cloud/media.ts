import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CardConfig } from '../models/card.ts'
import { AUDIO_MIMES, IMAGE_MIMES, verifyAsset } from '../media/asset-bytes.ts'
import { cacheImageAsset, loadImageAsset } from '../media/image-assets.ts'
import { cacheAudioAsset, loadAudioAsset } from '../media/audio-assets.ts'

export const MEDIA_BUCKET = 'draft-media'
const identity = z.string().regex(/^[a-f0-9]{64}$/)
export const mediaManifestSchema = z
  .array(
    z.discriminatedUnion('kind', [
      z
        .object({
          kind: z.literal('image'),
          id: identity,
          bytes: z
            .number()
            .int()
            .positive()
            .max(200 * 1024),
          mime: z.enum(IMAGE_MIMES),
        })
        .strict(),
      z
        .object({
          kind: z.literal('audio'),
          id: identity,
          bytes: z
            .number()
            .int()
            .positive()
            .max(20 * 1024 * 1024),
          mime: z.enum(AUDIO_MIMES),
        })
        .strict(),
    ]),
  )
  .max(10)
export type MediaAsset = z.infer<typeof mediaManifestSchema>[number]
export interface MediaCache {
  load: (kind: MediaAsset['kind'], id: string) => Promise<Blob | null>
  put: (asset: MediaAsset, blob: Blob) => Promise<void>
}
export interface TransferProgress {
  phase: 'upload' | 'download'
  completed: number
  total: number
}
export interface MediaOptions {
  cache?: MediaCache
  onProgress?: (progress: TransferProgress) => void
}
export class CloudMediaError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}
export const browserCache: MediaCache = {
  load: (kind, id) =>
    kind === 'image' ? loadImageAsset(id) : loadAudioAsset(id),
  put: (asset, blob) =>
    asset.kind === 'image'
      ? cacheImageAsset(asset.id, blob)
      : cacheAudioAsset(asset.id, blob),
}
export function mediaReferences(card: CardConfig) {
  const images = new Set(
    [card.background, ...card.pages.map((p) => p.background)].flatMap((bg) =>
      bg ? [bg.assetId] : [],
    ),
  )
  const refs: { kind: MediaAsset['kind']; id: string; bytes?: number }[] = [
    ...images,
  ].map((id) => ({ kind: 'image', id }))
  if (card.music.custom)
    refs.push({
      kind: 'audio',
      id: card.music.custom.assetId,
      bytes: card.music.custom.bytes,
    })
  return refs
}
export function validateMediaManifest(
  card: CardConfig,
  input: unknown,
): MediaAsset[] {
  const parsed = mediaManifestSchema.safeParse(input)
  if (!parsed.success) throw new CloudMediaError('media-invalid')
  const refs = mediaReferences(card)
  const seen = new Set<string>()
  for (const item of parsed.data) {
    const key = `${item.kind}:${item.id}`
    const ref = refs.find((r) => r.kind === item.kind && r.id === item.id)
    if (
      !ref ||
      seen.has(key) ||
      (ref.bytes !== undefined && ref.bytes !== item.bytes)
    )
      throw new CloudMediaError('media-invalid')
    seen.add(key)
  }
  if (seen.size !== refs.length) throw new CloudMediaError('media-invalid')
  return parsed.data
}
export function mediaPath(
  ownerId: string,
  asset: Pick<MediaAsset, 'kind' | 'id'>,
) {
  if (
    !z.uuid().safeParse(ownerId).success ||
    !identity.safeParse(asset.id).success ||
    !['image', 'audio'].includes(asset.kind)
  )
    throw new CloudMediaError('media-invalid')
  return `${ownerId}/${asset.kind}/${asset.id}`
}
export async function checkedBlob(asset: MediaAsset, blob: Blob) {
  if (blob.size !== asset.bytes || blob.type !== asset.mime)
    throw new CloudMediaError('media-corrupt')
  try {
    await verifyAsset(asset.id, blob, asset.kind)
  } catch {
    throw new CloudMediaError('media-corrupt')
  }
  return blob
}
async function download(
  client: SupabaseClient,
  ownerId: string,
  asset: MediaAsset,
) {
  const { data, error } = await client.storage
    .from(MEDIA_BUCKET)
    .download(
      mediaPath(ownerId, asset),
      {},
      { signal: AbortSignal.timeout(120_000) },
    )
  if (error || !data) throw new CloudMediaError('media-download')
  return checkedBlob(asset, data)
}
// Only cache server confirmation in memory, scoped to the SDK client and owner
// path. After a reload existing immutable bytes are downloaded and re-verified.
const confirmed = new WeakMap<SupabaseClient, Set<string>>()
export async function uploadDraftMedia(
  client: SupabaseClient,
  ownerId: string,
  card: CardConfig,
  options: MediaOptions = {},
) {
  const cache = options.cache ?? browserCache
  const refs = mediaReferences(card)
  const assets: { asset: MediaAsset; blob: Blob }[] = []
  // Validate every local dependency before starting any upload.
  for (const ref of refs) {
    let blob: Blob | null
    try {
      blob = await cache.load(ref.kind, ref.id)
    } catch {
      throw new CloudMediaError('media-local')
    }
    if (!blob) throw new CloudMediaError('media-missing')
    const parsed = mediaManifestSchema.safeParse([
      { ...ref, bytes: blob.size, mime: blob.type },
    ])
    if (!parsed.success || (ref.bytes !== undefined && ref.bytes !== blob.size))
      throw new CloudMediaError('media-corrupt')
    const asset = parsed.data[0]
    assets.push({ asset, blob: await checkedBlob(asset, blob) })
  }
  const manifest = validateMediaManifest(
    card,
    assets.map(({ asset }) => asset),
  )
  let verified = confirmed.get(client)
  if (!verified) {
    verified = new Set()
    confirmed.set(client, verified)
  }
  options.onProgress?.({ phase: 'upload', completed: 0, total: assets.length })
  for (const [index, { asset, blob }] of assets.entries()) {
    const path = mediaPath(ownerId, asset)
    if (!verified.has(path)) {
      const { error } = await client.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, {
          contentType: asset.mime,
          upsert: false,
          cacheControl: '3600',
        })
      if (error) {
        if (
          String(error.statusCode) !== '409' &&
          error.message !== 'The resource already exists'
        )
          throw new CloudMediaError('media-upload')
        await download(client, ownerId, asset)
      }
      verified.add(path)
    }
    options.onProgress?.({
      phase: 'upload',
      completed: index + 1,
      total: assets.length,
    })
  }
  return manifest
}
export async function restoreDraftMedia(
  client: SupabaseClient,
  ownerId: string,
  card: CardConfig,
  input: unknown,
  options: MediaOptions = {},
) {
  const manifest = validateMediaManifest(card, input)
  const cache = options.cache ?? browserCache
  options.onProgress?.({
    phase: 'download',
    completed: 0,
    total: manifest.length,
  })
  for (const [index, asset] of manifest.entries()) {
    let local: Blob | null
    try {
      local = await cache.load(asset.kind, asset.id)
    } catch {
      throw new CloudMediaError('media-local')
    }
    let valid = false
    if (local) {
      try {
        await checkedBlob(asset, local)
        valid = true
      } catch {
        /* Repair from verified remote bytes below. */
      }
    }
    if (!valid) {
      const blob = await download(client, ownerId, asset)
      try {
        await cache.put(asset, blob)
      } catch {
        throw new CloudMediaError('media-local')
      }
    }
    options.onProgress?.({
      phase: 'download',
      completed: index + 1,
      total: manifest.length,
    })
  }
}
