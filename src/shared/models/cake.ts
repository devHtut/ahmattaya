import { z } from 'zod'

export const cakeFlavors = ['vanilla', 'chocolate', 'strawberry'] as const
export const cakeSchema = z.object({
  enabled: z.boolean(),
  flavor: z.enum(cakeFlavors),
  tiers: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  creamColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  decoration: z.enum(['plain', 'pearls', 'berries']),
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
  }
}
