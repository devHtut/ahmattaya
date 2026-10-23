import { z } from 'zod'

export const cakeFlavors = ['vanilla', 'chocolate', 'strawberry'] as const
export const MAX_CREAM_STROKES = 60
export const MAX_STROKE_POINTS = 160
export const MAX_CANDLES = 12
export const SURFACE_LIMIT = 0.84
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const cakePointSchema = z
  .object({ x: z.number().finite(), z: z.number().finite() })
  .refine(
    (point) => point.x ** 2 + point.z ** 2 <= SURFACE_LIMIT ** 2 + 1e-6,
    'Outside the cake surface',
  )
export type CakePoint = z.infer<typeof cakePointSchema>
export const creamStrokeSchema = z.object({
  id: z.string().min(1).max(80),
  color,
  width: z.number().finite().min(0.015).max(0.09),
  points: z.array(cakePointSchema).min(1).max(MAX_STROKE_POINTS),
})
export type CreamStroke = z.infer<typeof creamStrokeSchema>
export const candleDesigns = [
  'classic',
  'spiral',
  'heart',
  'star',
  'number',
] as const
export const candleSchema = z.object({
  id: z.string().min(1).max(80),
  design: z.enum(candleDesigns),
  digit: z.number().int().min(0).max(9),
  color,
  position: cakePointSchema,
})
export type CakeCandle = z.infer<typeof candleSchema>
export const legacyCakeSchema = z.object({
  enabled: z.boolean(),
  flavor: z.enum(cakeFlavors),
  tiers: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  creamColor: color,
  accentColor: color,
  decoration: z.enum(['plain', 'pearls', 'berries']),
  placement: z.string().max(80).optional(),
})
export const cakeSchema = legacyCakeSchema
  .extend({
    strokes: z.array(creamStrokeSchema).max(MAX_CREAM_STROKES),
    candles: z.array(candleSchema).max(MAX_CANDLES),
  })
  .superRefine((cake, ctx) => {
    for (const items of [cake.strokes, cake.candles])
      if (new Set(items.map((item) => item.id)).size !== items.length)
        ctx.addIssue({
          code: 'custom',
          message: 'Duplicate decoration identity',
        })
  })
export type CakeRecipe = z.infer<typeof cakeSchema>
export const flavorColors: Record<CakeRecipe['flavor'], string> = {
  vanilla: '#ebca91',
  chocolate: '#623a27',
  strawberry: '#e5a1ad',
}
export function createCake(): CakeRecipe {
  return {
    enabled: false,
    flavor: 'vanilla',
    tiers: 2,
    creamColor: '#fff5e5',
    accentColor: '#e7aac7',
    decoration: 'pearls',
    strokes: [],
    candles: [],
  }
}
