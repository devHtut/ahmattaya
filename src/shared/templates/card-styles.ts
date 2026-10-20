import type { CardAppearance, CardConfig } from '../models/card'

export const palettes: {
  id: CardConfig['theme']
  name: string
  colors: CardAppearance['colors']
}[] = [
  {
    id: 'lavender',
    name: 'ခရမ်းနု အိပ်မက်',
    colors: {
      background: '#eee5fb',
      surface: '#fdfbff',
      text: '#493769',
      accent: '#8055c6',
    },
  },
  {
    id: 'rose',
    name: 'နှင်းဆီရောင်',
    colors: {
      background: '#fce5ed',
      surface: '#fffcfd',
      text: '#74324e',
      accent: '#ba4e79',
    },
  },
  {
    id: 'gold',
    name: 'ရွှေရောင် အမှတ်တရ',
    colors: {
      background: '#fcf0d1',
      surface: '#fffefa',
      text: '#76571b',
      accent: '#997020',
    },
  },
  {
    id: 'mint',
    name: 'စိမ်းနု လန်းဆန်း',
    colors: {
      background: '#dcf3e8',
      surface: '#f6fff9',
      text: '#245c49',
      accent: '#2d8063',
    },
  },
  {
    id: 'ocean',
    name: 'ကောင်းကင်ပြာ',
    colors: {
      background: '#dceefa',
      surface: '#f7fcff',
      text: '#284e70',
      accent: '#3377a8',
    },
  },
  {
    id: 'peach',
    name: 'မက်မွန် နွေးနွေး',
    colors: {
      background: '#fbe4d4',
      surface: '#fffbf6',
      text: '#714730',
      accent: '#a65d36',
    },
  },
]
export function createAppearance(theme: CardConfig['theme']): CardAppearance {
  const palette = palettes.find((item) => item.id === theme) ?? palettes[0]
  return {
    colors: { ...palette.colors },
    heading: {
      font: 'Noto Sans Myanmar',
      size: 24,
      bold: true,
      italic: false,
      align: 'center',
    },
    body: {
      font: 'Noto Sans Myanmar',
      size: 14,
      bold: false,
      italic: false,
      align: 'center',
    },
  }
}
