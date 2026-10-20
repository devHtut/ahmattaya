import { z } from 'zod'
import { cakeSchema, legacyCakeSchema } from './cake.ts'
import { openingSchema } from './opening.ts'
import { musicSchema } from './music.ts'
import { backgroundSchema } from './background.ts'

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
export const v2CardSchema = z.object({
  ...baseFields,
  schemaVersion: z.literal(2),
  theme: z.enum(['lavender', 'rose', 'gold', 'mint', 'ocean', 'peach']),
  appearance: appearanceSchema,
})
export const MAX_PHOTOS = 5
export const MAX_PAGES = 8
export const MAX_PHOTO_BYTES = 200 * 1024
const imageDataSchema = z
  .string()
  .max(Math.ceil(MAX_PHOTO_BYTES / 3) * 4 + 40)
  .regex(
    /^data:image\/(webp|jpeg|png);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  )
  .refine((value) => {
    const encoded = value.split(',')[1] ?? ''
    const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0
    return (
      encoded.length > 0 &&
      (encoded.length / 4) * 3 - padding <= MAX_PHOTO_BYTES
    )
  }, 'Photo exceeds 200 KB')
export const pageSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(80)
    .refine((id) => id !== 'cover'),
  title: z.string().max(160),
  message: z.string().max(2000),
  paper: z.enum(['blank', 'lined']),
  background: backgroundSchema.nullable().default(null),
})
export type CardPage = z.infer<typeof pageSchema>
export const v3PhotoSchema = z.object({
  id: z.string().min(1).max(80),
  pageId: z.string().min(1).max(80),
  src: imageDataSchema,
  caption: z.string().max(120),
})
export const photoFrameSchema = z.object({
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100),
  width: z.number().finite().min(10).max(85),
  ratio: z.number().finite().min(0.2).max(5),
  rotation: z.number().finite().min(-180).max(180),
  shadow: z.boolean(),
})
export type PhotoFrame = z.infer<typeof photoFrameSchema>
export const photoSchema = v3PhotoSchema.extend({ frame: photoFrameSchema })
export type CardPhoto = z.infer<typeof photoSchema>
const v3CardFields = v2CardSchema.extend({
  schemaVersion: z.literal(3),
  pages: z.array(pageSchema).max(MAX_PAGES),
  photos: z.array(v3PhotoSchema).max(MAX_PHOTOS),
})
export const v3CardSchema = v3CardFields
const v4CardFields = v2CardSchema.extend({
  schemaVersion: z.literal(4),
  pages: z.array(pageSchema).max(MAX_PAGES),
  photos: z.array(photoSchema).max(MAX_PHOTOS),
})

function validateCardReferences(
  card: Pick<z.infer<typeof v4CardFields>, 'pages' | 'photos'>,
  ctx: z.RefinementCtx,
) {
  const pageIds = new Set(card.pages.map((page) => page.id))
  if (
    pageIds.size !== card.pages.length ||
    new Set(card.photos.map((photo) => photo.id)).size !== card.photos.length
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Duplicate page or photo identity',
    })
  }
  for (const photo of card.photos) {
    if (photo.pageId !== 'cover' && !pageIds.has(photo.pageId))
      ctx.addIssue({ code: 'custom', message: 'Photo page is missing' })
  }
}
export const v4CardSchema = v4CardFields.superRefine(validateCardReferences)
const v5CardFields = v4CardFields.extend({
  schemaVersion: z.literal(5),
  music: musicSchema,
})
export const v5CardSchema = v5CardFields.superRefine(validateCardReferences)
const v6CardFields = v5CardFields.extend({
  schemaVersion: z.literal(6),
  opening: openingSchema,
})
export const v6CardSchema = v6CardFields.superRefine(validateCardReferences)
export const v7CardSchema = v6CardFields
  .extend({ schemaVersion: z.literal(7), cake: legacyCakeSchema })
  .superRefine(validateCardReferences)
export const v8CardSchema = v6CardFields
  .extend({ schemaVersion: z.literal(8), cake: cakeSchema })
  .superRefine(validateCardReferences)
export const cardSchema = v6CardFields
  .extend({
    schemaVersion: z.literal(9),
    cake: cakeSchema,
    background: backgroundSchema.nullable().default(null),
  })
  .superRefine(validateCardReferences)
export type CardConfig = z.infer<typeof cardSchema>
