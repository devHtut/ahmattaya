import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cardSchema } from '../models/card.ts'
import type { Project } from '../../features/projects/project-storage.ts'
import {
  mediaManifestSchema,
  uploadDraftMedia,
  restoreDraftMedia,
  type MediaOptions,
} from './media.ts'

import { receiptFor } from './receipts.ts'
export {
  cloudReceiptSchema,
  receiptFor,
  type CloudReceipt,
} from './receipts.ts'
const summarySchema = z.object({
  id: z.string().min(1).max(100),
  owner_id: z.uuid(),
  name: z.string().trim().min(1).max(100),
  revision: z.number().int().positive().max(2147483647),
  updated_at: z.iso.datetime({ offset: true }),
})
export const cloudDraftSchema = summarySchema.extend({
  card: cardSchema,
  media: mediaManifestSchema.default([]),
})
export type CloudDraft = z.infer<typeof cloudDraftSchema>
export type CloudDraftSummary = z.infer<typeof summarySchema>
export class CloudDraftError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}
export function cloudDraftMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error ? error.code : ''
  if (
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === '42P01' ||
    code === '42703'
  )
    return 'Cloud သိမ်းဆည်းမှုအတွက် database ပြင်ဆင်ဖို့ လိုပါသေးတယ်။'
  if (code === 'conflict' || code === '23505')
    return 'Cloud ကတ်မှာ ပိုသစ်တဲ့ပြင်ဆင်မှု ရှိနေပါတယ်။ လက်ရှိကတ်ကို မပြောင်းထားပါ။ Cloud ကတ်ကို မိတ္တူအဖြစ် ပြန်ယူပြီး နှိုင်းယှဉ်ပါ။'
  if (code === 'media-missing')
    return 'နောက်ခံပုံ သို့မဟုတ် သီချင်းဖိုင်ကို ဒီ browser မှာ ရှာမတွေ့ပါ။ Cloud ကတ်ကို ပြန်ယူပါ သို့မဟုတ် ဖိုင်ပြန်ရွေးပြီး သိမ်းပါ။'
  if (code === 'media-corrupt' || code === 'media-invalid')
    return 'ပုံ/သီချင်းဖိုင်ရဲ့ အချက်အလက်ကို အတည်ပြုမရပါ။ ကတ်ကို မပြောင်းထားပါ။ ဖိုင်ပြန်ရွေးပြီး ကြိုးစားပါ။'
  if (code === 'media-local')
    return 'ပုံ/သီချင်းဖိုင်တွေကို ဒီ browser မှာ သိမ်းမရပါ။ Browser storage ကို စစ်ပြီး ပြန်ကြိုးစားပါ။ လက်ရှိကတ်ကို မပြောင်းထားပါ။'
  if (code === 'media-upload')
    return 'ပုံ/သီချင်းတင်ခြင်း မအောင်မြင်လို့ Cloud ကတ်ကို မသိမ်းထားပါ။ Internet နဲ့ Storage setup ကို စစ်ပြီး ပြန်ကြိုးစားပါ။'
  if (code === 'media-download')
    return 'Cloud ပေါ်က ပုံ/သီချင်းဖိုင်တွေကို ပြန်ယူမရပါ။ Internet နဲ့ ဖိုင်အသုံးပြုခွင့်ကို စစ်ပြီး ပြန်ကြိုးစားပါ။ လက်ရှိကတ်ကို မပြောင်းထားပါ။'
  if (code === 'too-large')
    return 'ဒီကတ်က Cloud သိမ်းဆည်းမှုအတွက် အရွယ်အစားကြီးနေပါတယ်။ ပုံအချို့ကို လျှော့ပြီး ပြန်ကြိုးစားပါ။'
  if (code === 'invalid')
    return 'ကတ်အချက်အလက်ကို အတည်ပြုမရလို့ မဖွင့်ထားပါ။ လက်ရှိကတ်ကို မပြောင်းထားပါ။'
  return 'Cloud သိမ်းဆည်းမှု မအောင်မြင်ပါ။ လက်ရှိကတ်က browser ထဲမှာ ရှိနေဆဲပါ။ Internet နဲ့ Guest ချိတ်ဆက်မှုကို စစ်ပြီး ပြန်ကြိုးစားပါ။'
}
// File dependencies are uploaded separately before committing this payload.
export function prepareCloudDraft(project: Project) {
  const parsed = cardSchema.safeParse(project.card)
  if (
    !parsed.success ||
    !project.id ||
    project.id.length > 100 ||
    !project.name.trim() ||
    project.name.trim().length > 100
  )
    throw new CloudDraftError('invalid')
  const card = parsed.data
  if (new TextEncoder().encode(JSON.stringify(card)).byteLength > 1800 * 1024)
    throw new CloudDraftError('too-large')
  return { name: project.name.trim(), card }
}
const columns = 'id,owner_id,name,revision,updated_at'
export const CLOUD_PAGE_SIZE = 20
export async function listCloudDrafts(
  client: SupabaseClient,
  ownerId: string,
  offset = 0,
) {
  const { data, error } = await client
    .from('private_drafts')
    .select(columns)
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false })
    .order('id')
    .range(offset, offset + CLOUD_PAGE_SIZE - 1)
    .abortSignal(AbortSignal.timeout(20_000))
  if (error) throw error
  const parsed = z.array(summarySchema).safeParse(data)
  if (!parsed.success || parsed.data.some((row) => row.owner_id !== ownerId))
    throw new CloudDraftError('invalid')
  return parsed.data
}
export async function saveCloudDraft(
  client: SupabaseClient,
  ownerId: string,
  project: Project,
  options: MediaOptions = {},
) {
  const payload = prepareCloudDraft(project)
  const media = await uploadDraftMedia(client, ownerId, payload.card, options)
  const snapshot = { ...payload, media }
  const previous =
    project.cloud?.ownerId === ownerId ? project.cloud : undefined
  const id = previous?.projectId ?? project.id
  // Compare-and-swap: a stale tab cannot overwrite a newer server revision.
  const query = previous
    ? client
        .from('private_drafts')
        .update(snapshot)
        .eq('owner_id', ownerId)
        .eq('id', id)
        .eq('revision', previous.revision)
    : client
        .from('private_drafts')
        .insert({ ...snapshot, owner_id: ownerId, id })
  const { data, error } = await query
    .select(columns)
    .abortSignal(AbortSignal.timeout(20_000))
    .maybeSingle()
  if (error) throw error
  if (!data) throw new CloudDraftError('conflict')
  const parsed = summarySchema.safeParse(data)
  if (
    !parsed.success ||
    parsed.data.owner_id !== ownerId ||
    parsed.data.id !== id
  )
    throw new CloudDraftError('invalid')
  return receiptFor(parsed.data)
}
export async function readCloudDraft(
  client: SupabaseClient,
  ownerId: string,
  id: string,
  options: MediaOptions = {},
): Promise<CloudDraft> {
  const { data, error } = await client
    .from('private_drafts')
    .select(`${columns},card,media`)
    .eq('owner_id', ownerId)
    .eq('id', id)
    .abortSignal(AbortSignal.timeout(20_000))
    .single()
  if (error) throw error
  const parsed = cloudDraftSchema.safeParse(data)
  if (
    !parsed.success ||
    parsed.data.owner_id !== ownerId ||
    parsed.data.id !== id
  )
    throw new CloudDraftError('invalid')
  prepareCloudDraft({
    id,
    name: parsed.data.name,
    card: parsed.data.card,
    deleted: false,
    updatedAt: new Date().toISOString(),
  })
  await restoreDraftMedia(
    client,
    ownerId,
    parsed.data.card,
    parsed.data.media,
    options,
  )
  return parsed.data
}
