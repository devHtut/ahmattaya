import type { CardConfig, Occasion } from '../models/card'
import { createCake } from '../models/cake.ts'
import { createOpening } from '../models/opening.ts'
import { createMusic } from '../models/music.ts'
import { createAppearance } from './card-styles.ts'

export const occasions: {
  id: Occasion
  icon: string
  name: string
  description: string
}[] = [
  {
    id: 'birthday',
    icon: '🎂',
    name: 'မွေးနေ့ဆုတောင်း',
    description: 'သူ့ရဲ့နေ့လေးကို ပိုထူးခြားစေဖို့',
  },
  {
    id: 'wedding-invitation',
    icon: '💌',
    name: 'မင်္ဂလာဖိတ်စာ',
    description: 'အတူတူ စတင်မယ့် ဘဝခရီးအတွက်',
  },
  {
    id: 'wedding-wish',
    icon: '💐',
    name: 'မင်္ဂလာဆုတောင်း',
    description: 'မောင်နှံနှစ်ဦးအတွက် ဆုမွန်ကောင်း',
  },
  {
    id: 'anniversary',
    icon: '💖',
    name: 'နှစ်ပတ်လည်ဆုတောင်း',
    description: 'အတူဖြတ်သန်းခဲ့တဲ့ အမှတ်တရများ',
  },
]
const titles: Record<Occasion, string> = {
  birthday: 'Happy Birthday! 🎂',
  'wedding-invitation': 'ကျွန်တော်တို့ မင်္ဂလာပွဲကို ဖိတ်ခေါ်ပါတယ်',
  'wedding-wish': 'ပျော်ရွှင်ချမ်းမြေ့တဲ့ ဘဝခရီးလေး ဖြစ်ပါစေ',
  anniversary: 'Happy Anniversary! 💖',
}
export function createCard(occasion: Occasion): CardConfig {
  return {
    schemaVersion: 10,
    background: null,
    occasion,
    senderName: '',
    receiverName: '',
    title: titles[occasion],
    message: '',
    cake: createCake(),
    opening: createOpening(),
    music: createMusic(),
    pages: [],
    photos: [],
    theme: 'lavender',
    appearance: createAppearance('lavender'),
  }
}

// Preserve personal content when switching occasions. Only replace an untouched
// default title; a creator's custom title belongs to their draft.
export function changeOccasion(
  card: CardConfig,
  occasion: Occasion,
): CardConfig {
  return {
    ...card,
    occasion,
    title: card.title === titles[card.occasion] ? titles[occasion] : card.title,
  }
}
