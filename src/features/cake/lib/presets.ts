import { createCake, type CakeRecipe } from '../../../shared/models/cake.ts'

export const cakePresets: {
  id: string
  name: string
  description: string
  recipe: CakeRecipe
}[] = [
  {
    id: 'vanilla-cloud',
    name: 'Vanilla Cloud',
    description: 'Vanilla နှစ်ထပ်နဲ့ ပုလဲ cream လေးတွေ',
    recipe: { ...createCake(), enabled: true },
  },
  {
    id: 'chocolate-joy',
    name: 'Chocolate Joy',
    description: 'Chocolate တစ်ထပ်နဲ့ berry အလှဆင်',
    recipe: {
      strokes: [],
      candles: [],
      enabled: true,
      flavor: 'chocolate',
      tiers: 1,
      creamColor: '#694131',
      accentColor: '#be3455',
      decoration: 'berries',
    },
  },
  {
    id: 'strawberry-blush',
    name: 'Strawberry Blush',
    description: 'Strawberry သုံးထပ်နဲ့ ပန်းရောင် cream',
    recipe: {
      strokes: [],
      candles: [],
      enabled: true,
      flavor: 'strawberry',
      tiers: 3,
      creamColor: '#f4bacf',
      accentColor: '#fff3e4',
      decoration: 'pearls',
    },
  },
]
export function cakeFromPreset(id: string): CakeRecipe {
  const preset = cakePresets.find((item) => item.id === id)
  return preset
    ? structuredClone(preset.recipe)
    : { ...createCake(), enabled: true, tiers: 1, decoration: 'plain' }
}
