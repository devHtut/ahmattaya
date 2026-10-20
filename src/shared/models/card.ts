import { z } from 'zod'

export const occasionSchema = z.enum([
  'birthday',
  'wedding-invitation',
  'wedding-wish',
  'anniversary',
])
export type Occasion = z.infer<typeof occasionSchema>
const baseFields = {
  occasion: occasionSchema,
  senderName: z.string().max(80),
  receiverName: z.string().max(80),
  title: z.string().max(160),
  message: z.string().max(2000),
}
export const legacyCardSchema = z.object({
  ...baseFields,
  schemaVersion: z.literal(1),
  theme: z.enum(['lavender', 'rose', 'gold']),
})
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const fontSchema = z.enum([
  'Noto Sans Myanmar',
  'Padauk',
  'Plus Jakarta Sans',
  'Playfair Display',
])
const textStyleFields = {
  font: fontSchema,
  bold: z.boolean(),
  italic: z.boolean(),
  align: z.enum(['left', 'center', 'right']),
}
export const appearanceSchema = z.object({
  colors: z.object({
    background: colorSchema,
    surface: colorSchema,
    text: colorSchema,
    accent: colorSchema,
  }),
  heading: z.object({
    ...textStyleFields,
    size: z.number().int().min(18).max(48),
  }),
  body: z.object({
    ...textStyleFields,
    size: z.number().int().min(12).max(24),
  }),
})
export type CardAppearance = z.infer<typeof appearanceSchema>
export const cardSchema = z.object({
  ...baseFields,
  schemaVersion: z.literal(2),
  theme: z.enum(['lavender', 'rose', 'gold', 'mint', 'ocean', 'peach']),
  appearance: appearanceSchema,
})
export type CardConfig = z.infer<typeof cardSchema>
