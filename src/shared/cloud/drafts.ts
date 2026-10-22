import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cardSchema } from '../models/card.ts'
import type { Project } from '../../features/projects/project-storage.ts'

export const cloudReceiptSchema = z.object({
  ownerId: z.uuid(),
  projectId: z.string().min(1).max(100),
  revision: z.number().int().positive().max(2147483647),
  savedAt: z.iso.datetime(),
})
export type CloudReceipt = z.infer<typeof cloudReceiptSchema>
const summarySchema = z.object({
  id: z.string().min(1).max(100),
  owner_id: z.uuid(),
  name: z.string().trim().min(1).max(100),
  revision: z.number().int().positive().max(2147483647),
  updated_at: z.iso.datetime({ offset: true }),
})
export const cloudDraftSchema = summarySchema.extend({ card: cardSchema })
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
  if (code === 'PGRST205' || code === '42P01')
    return 'Cloud သိမ်းဆည်းမှုအတွက် database ပြင်ဆင်ဖို့ လိုပါသေးတယ်။'
  if (code === 'conflict' || code === '23505')
    return 'Cloud ကတ်မှာ ပိုသစ်တဲ့ပြင်ဆင်မှု ရှိနေပါတယ်။ လက်ရှိကတ်ကို မပြောင်းထားပါ။ Cloud ကတ်ကို မိတ္တူအဖြစ် ပြန်ယူပြီး နှိုင်းယှဉ်ပါ။'
  if (code === 'local-media')
    return 'နောက်ခံပုံ သို့မဟုတ် ကိုယ်တိုင်ထည့်ထားတဲ့ သီချင်း ပါနေပါတယ်။ အဲဒီဖိုင်တွေအတွက် Cloud upload ဆက်ထည့်ဖို့ လိုသေးလို့ ဒီကတ်ကို browser ထဲမှာပဲ ဆက်သိမ်းထားပါတယ်။'
  if (code === 'too-large')
    return 'ဒီကတ်က Cloud သိမ်းဆည်းမှုအတွက် အရွယ်အစားကြီးနေပါတယ်။ ပုံအချို့ကို လျှော့ပြီး ပြန်ကြိုးစားပါ။'
  if (code === 'invalid')
    return 'ကတ်အချက်အလက်ကို အတည်ပြုမရလို့ မဖွင့်ထားပါ။ လက်ရှိကတ်ကို မပြောင်းထားပါ။'
  return 'Cloud သိမ်းဆည်းမှု မအောင်မြင်ပါ။ လက်ရှိကတ်က browser ထဲမှာ ရှိနေဆဲပါ။ Internet နဲ့ Guest ချိတ်ဆက်မှုကို စစ်ပြီး ပြန်ကြိုးစားပါ။'
}
// No browser-only asset IDs may silently masquerade as a complete cloud backup.
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
  if (
    card.background ||
    card.pages.some((page) => page.background) ||
    card.music.custom
  )
    throw new CloudDraftError('local-media')
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
export function receiptFor(row: CloudDraftSummary): CloudReceipt {
  return {
    ownerId: row.owner_id,
    projectId: row.id,
    revision: row.revision,
    savedAt: new Date(row.updated_at).toISOString(),
  }
}
export async function saveCloudDraft(
  client: SupabaseClient,
  ownerId: string,
  project: Project,
) {
  const payload = prepareCloudDraft(project)
  const previous =
    project.cloud?.ownerId === ownerId ? project.cloud : undefined
  const id = previous?.projectId ?? project.id
  // Compare-and-swap: a stale tab cannot overwrite a newer server revision.
  const query = previous
    ? client
        .from('private_drafts')
        .update(payload)
        .eq('owner_id', ownerId)
        .eq('id', id)
        .eq('revision', previous.revision)
    : client
        .from('private_drafts')
        .insert({ ...payload, owner_id: ownerId, id })
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
): Promise<CloudDraft> {
  const { data, error } = await client
    .from('private_drafts')
    .select(`${columns},card`)
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
  // Reject unsupported device-local media even if it was inserted outside the app.
  prepareCloudDraft({
    id,
    name: parsed.data.name,
    card: parsed.data.card,
    deleted: false,
    updatedAt: new Date().toISOString(),
  })
  return parsed.data
}
