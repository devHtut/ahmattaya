import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cardSchema } from '../models/card.ts'
import type { Project } from '../../features/projects/project-storage.ts'
import { saveCloudDraft, type CloudReceipt } from './drafts.ts'
import {
  browserCache,
  checkedBlob,
  mediaPath,
  validateMediaManifest,
  mediaManifestSchema,
  type MediaOptions,
  type MediaAsset,
} from './media.ts'
export const PUBLISHED_BUCKET = 'published-media'
const summarySchema = z.object({
  id: z.uuid(),
  active: z.boolean(),
  revision: z.number().int().nonnegative(),
  source_revision: z.number().int().positive().nullable(),
  published_at: z.iso.datetime({ offset: true }).nullable(),
})
export type Publication = z.infer<typeof summarySchema>
const snapshotSchema = z.object({
  id: z.uuid(),
  revision: z.number().int().positive(),
  published_at: z.iso.datetime({ offset: true }),
  card: cardSchema,
  media: mediaManifestSchema,
})
export class PublishingError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}
function summary(input: unknown) {
  const p = summarySchema.safeParse(input)
  if (!p.success) throw new PublishingError('publication-invalid')
  return p.data
}
export function parsePublishedCard(input: unknown, id: string) {
  const p = snapshotSchema.safeParse(input)
  if (!p.success || p.data.id !== id)
    throw new PublishingError('publication-invalid')
  validateMediaManifest(p.data.card, p.data.media)
  return p.data
}
export function receiverUrl(id: string, base = 'https://ahmattaya.vercel.app') {
  if (!z.uuid().safeParse(id).success)
    throw new PublishingError('publication-invalid')
  const url = new URL(base)
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new PublishingError('publication-invalid')
  return new URL('/r/' + id, url.origin).href
}
export async function getPublication(
  client: SupabaseClient,
  projectId: string,
) {
  const { data, error } = await client
    .rpc('get_my_card_publication', { p_project_id: projectId })
    .abortSignal(AbortSignal.timeout(20_000))
  if (error) throw error
  return data === null ? null : summary(data)
}
export async function downloadPublishedMedia(
  client: SupabaseClient,
  id: string,
  asset: MediaAsset,
  signal?: AbortSignal,
) {
  const { data, error } = await client.storage.from(PUBLISHED_BUCKET).download(
    mediaPath(id, asset),
    { cacheNonce: crypto.randomUUID() },
    {
      cache: 'no-store',
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(120_000)])
        : AbortSignal.timeout(120_000),
    },
  )
  if (error || !data) throw new PublishingError('publication-media')
  return checkedBlob(asset, data)
}
export async function publishProject(
  client: SupabaseClient,
  ownerId: string,
  project: Project,
  options: MediaOptions & { onSaved?: (receipt: CloudReceipt) => void } = {},
) {
  const receipt = await saveCloudDraft(client, ownerId, project, options)
  // Preserve the CAS receipt even if publishing or copying files fails later.
  options.onSaved?.(receipt)
  const { data, error } = await client
    .rpc('begin_card_publication', {
      p_project_id: receipt.projectId,
      p_revision: receipt.revision,
    })
    .abortSignal(AbortSignal.timeout(20_000))
  if (error) throw error
  const build = z
    .object({
      build_id: z.uuid(),
      id: z.uuid(),
      source_revision: z.number().int().positive(),
      card: cardSchema,
      media: mediaManifestSchema,
    })
    .safeParse(data)
  if (!build.success || build.data.source_revision !== receipt.revision)
    throw new PublishingError('publication-invalid')
  const b = build.data,
    media = validateMediaManifest(b.card, b.media),
    cache = options.cache ?? browserCache
  options.onProgress?.({ phase: 'upload', completed: 0, total: media.length })
  for (const [index, asset] of media.entries()) {
    const blob = await cache.load(asset.kind, asset.id)
    if (!blob) throw new PublishingError('media-missing')
    await checkedBlob(asset, blob)
    const { error: uploadError } = await client.storage
      .from(PUBLISHED_BUCKET)
      .upload(mediaPath(b.id, asset), blob, {
        upsert: false,
        cacheControl: '0',
        contentType: asset.mime,
      })
    if (uploadError) {
      if (
        !('statusCode' in uploadError) ||
        String(uploadError.statusCode) !== '409'
      )
        throw new PublishingError('publication-media')
      await downloadPublishedMedia(client, b.id, asset)
    }
    options.onProgress?.({
      phase: 'upload',
      completed: index + 1,
      total: media.length,
    })
  }
  const finished = await client
    .rpc('finish_card_publication', { p_build_id: b.build_id })
    .abortSignal(AbortSignal.timeout(20_000))
  if (finished.error) throw finished.error
  const publication = summary(finished.data)
  if (
    publication.id !== b.id ||
    !publication.active ||
    publication.source_revision !== receipt.revision
  )
    throw new PublishingError('publication-invalid')
  return publication
}
export async function unpublish(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .rpc('unpublish_card', { p_id: id })
    .abortSignal(AbortSignal.timeout(20_000))
  if (error) throw error
  const p = summary(data)
  if (p.id !== id || p.active) throw new PublishingError('publication-invalid')
  return p
}
export async function loadPublishedCard(
  client: SupabaseClient,
  id: string,
  signal?: AbortSignal,
) {
  if (!z.uuid().safeParse(id).success)
    throw new PublishingError('publication-missing')
  const { data, error } = await client
    .rpc('get_published_card', { p_id: id })
    .abortSignal(
      signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000),
    )
  if (error) throw error
  if (!data) throw new PublishingError('publication-missing')
  return parsePublishedCard(data, id)
}
export function publishingMessage(error: unknown) {
  const code =
    error && typeof error === 'object' && 'code' in error ? error.code : ''
  if (code === 'PGRST202' || code === '42883')
    return 'Publish အတွက် database ပြင်ဆင်ဖို့ လိုပါသေးတယ်။'
  if (code === 'P0001')
    return 'တခြားနေရာမှာ ကတ်ကို ပြောင်းထားပါတယ်။ Cloud မိတ္တူကို ပြန်စစ်ပြီး ကြိုးစားပါ။'
  if (code === 'publication-media')
    return 'Receiver အတွက် ပုံ/သီချင်း တင်ခြင်း မပြီးသေးပါ။ Internet ကို စစ်ပြီး Publish ပြန်လုပ်ပါ။'
  return 'Publish မအောင်မြင်ပါ။ Draft ရှိနေဆဲပါ။ Cloud ချိတ်ဆက်မှုကို စစ်ပြီး ပြန်ကြိုးစားပါ။'
}
