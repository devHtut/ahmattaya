import { z } from 'zod'
import { cakeSchema, legacyCakeSchema } from './cake.ts'
import { openingSchema } from './opening.ts'
import { musicSchema, legacyMusicSchema } from './music.ts'
import { backgroundSchema } from './background.ts'
import { eventSchema } from './event.ts'

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
export const fontOptions = [
  'Noto Sans Myanmar',
  'Padauk',
  'Plus Jakarta Sans',
  'Playfair Display',
  'Fraunces',
  'handwriting',
  'serif',
  'sans',
  'AJ 02',
  'AJ 04',
  'Aka02 Regular',
  'Aka03 Regular',
  'Aka05 Regular',
  'Aka06 Regular',
  'Aka07 Bold',
  'Aka08 Regular',
  'Aka09 Regular',
  'Aka 007',
] as const

export const fontSchema = Object.assign(
  z
    .string()
    .min(1)
    .max(100)
    .refine((val) => val !== 'unknown', { message: 'Invalid font' }),
  { options: fontOptions },
)
const textStyleFields = {
  font: fontSchema,
  bold: z.boolean(),
  italic: z.boolean(),
  align: z.enum(['left', 'center', 'right']),
}
export const cardColorsSchema = z.object({
  background: colorSchema,
  surface: colorSchema,
  text: colorSchema,
  accent: colorSchema,
})
export type CardColors = z.infer<typeof cardColorsSchema>

export const appearanceSchema = z.object({
  colors: cardColorsSchema,
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
export const pageHeadingStyleSchema = z.object({
  font: fontSchema.optional(),
  size: z.number().int().min(18).max(48).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
})
export type PageHeadingStyle = z.infer<typeof pageHeadingStyleSchema>

export const pageBodyStyleSchema = z.object({
  font: fontSchema.optional(),
  size: z.number().int().min(12).max(24).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
})
export type PageBodyStyle = z.infer<typeof pageBodyStyleSchema>

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
  heading: pageHeadingStyleSchema.optional(),
  body: pageBodyStyleSchema.optional(),
  colors: cardColorsSchema.optional(),
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

export const elementShapeSchema = z.enum([
  'text',
  'heart',
  'star',
  'sparkle',
  'circle',
  'rect',
  'washi-tape',
  'ribbon',
  'flower',
  'stamp',
  'sticker',
])
export type ElementShape = z.infer<typeof elementShapeSchema>

export const elementFrameSchema = z.object({
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100),
  width: z.number().finite().min(5).max(80),
  ratio: z.number().finite().min(0.1).max(10).default(1),
  rotation: z.number().finite().min(-180).max(180).default(0),
  opacity: z.number().finite().min(0.1).max(1).default(1),
})
export type ElementFrame = z.infer<typeof elementFrameSchema>

export const cardElementSchema = z.object({
  id: z.string().min(1).max(80),
  pageId: z.string().min(1).max(80),
  shape: elementShapeSchema,
  color: z.string().max(40).default('theme'),
  text: z.string().max(300).default(''),
  fontSize: z.number().min(8).max(36).default(14),
  fontFamily: z.string().max(80).default('handwriting'),
  bg: z.string().max(40).default('transparent'),
  stickerSrc: z.string().max(250).optional(),
  frame: elementFrameSchema,
})
export type CardElement = z.infer<typeof cardElementSchema>

export const MAX_ELEMENTS = 30

function validateCardReferences(
  card: Pick<z.infer<typeof v4CardFields>, 'pages' | 'photos'> & {
    elements?: CardElement[]
  },
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
  if (card.elements) {
    const elIds = new Set(card.elements.map((el) => el.id))
    if (elIds.size !== card.elements.length) {
      ctx.addIssue({ code: 'custom', message: 'Duplicate element identity' })
    }
    for (const el of card.elements) {
      if (el.pageId !== 'cover' && !pageIds.has(el.pageId)) {
        ctx.addIssue({ code: 'custom', message: 'Element page is missing' })
      }
    }
  }
}
export const v4CardSchema = v4CardFields.superRefine(validateCardReferences)
const v5CardFields = v4CardFields.extend({
  schemaVersion: z.literal(5),
  music: legacyMusicSchema,
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
export const v9CardSchema = v6CardFields
  .extend({
    schemaVersion: z.literal(9),
    cake: cakeSchema,
    background: backgroundSchema.nullable().default(null),
  })
  .superRefine(validateCardReferences)
export const cardSchema = v6CardFields
  .extend({
    schemaVersion: z.literal(10),
    cake: cakeSchema,
    background: backgroundSchema.nullable().default(null),
    music: musicSchema,
    event: eventSchema.default({}),
    elements: z.array(cardElementSchema).max(MAX_ELEMENTS).default([]),
  })
  .superRefine(validateCardReferences)
export type CardConfig = z.infer<typeof cardSchema>
