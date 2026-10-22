import { z } from 'zod'
export const cloudReceiptSchema = z.object({
  ownerId: z.uuid(),
  projectId: z.string().min(1).max(100),
  revision: z.number().int().positive().max(2147483647),
  savedAt: z.iso.datetime(),
})
export type CloudReceipt = z.infer<typeof cloudReceiptSchema>
export function receiptFor(row: {
  owner_id: string
  id: string
  revision: number
  updated_at: string
}): CloudReceipt {
  return {
    ownerId: row.owner_id,
    projectId: row.id,
    revision: row.revision,
    savedAt: new Date(row.updated_at).toISOString(),
  }
}
