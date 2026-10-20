import { z } from 'zod'

export const occasionSchema = z.enum([
  'birthday',
  'wedding-invitation',
  'wedding-wish',
  'anniversary',
])
export type Occasion = z.infer<typeof occasionSchema>
export const cardSchema = z.object({
  schemaVersion: z.literal(1),
  occasion: occasionSchema,
  senderName: z.string().trim().max(80),
  receiverName: z.string().trim().max(80),
  title: z.string().trim().max(160),
  message: z.string().max(2000),
  theme: z.enum(['lavender', 'rose', 'gold']),
})
export type CardConfig = z.infer<typeof cardSchema>
