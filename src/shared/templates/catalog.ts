import type { CardConfig, Occasion } from '../models/card.ts'
import { createCard } from './templates.ts'
import { createAppearance } from './card-styles.ts'

type Starter = {
  id: string
  name: string
  description: string
  occasion: Occasion
  theme: CardConfig['theme']
  title: string
  message: string
  opening: {
    style: 'gift' | 'envelope'
    emoji: CardConfig['opening']['emoji']
    title: string
    kicker?: string
    message?: string
    buttonText?: string
  }
  pages: { title: string; message: string; paper: 'blank' | 'lined' }[]
  track: Exclude<CardConfig['music']['trackId'], 'custom'>
  cake?: {
    flavor: CardConfig['cake']['flavor']
    tiers: CardConfig['cake']['tiers']
  }
  typography?: 'letter' | 'serif'
}
export const templateCatalog: readonly Starter[] = [
  {
    id: 'golden-birthday',
    name: 'ရွှေရောင် မွေးနေ့',
    description: 'လက်ဆောင်ဖွင့်သလို အစပြုပြီး Vanilla cake လေးနဲ့ ဆုတောင်းပါ။',
    occasion: 'birthday',
    theme: 'gold',
    title: 'Happy Birthday! ✨',
    message:
      'ဒီနေ့ကစပြီး နေ့ရက်တိုင်းမှာ ပျော်ရွှင်မှုနဲ့ ချစ်ခြင်းတွေ ပြည့်နေပါစေ။ မင်းရဲ့ အိပ်မက်လေးတွေ တစ်ခုပြီးတစ်ခု အကောင်အထည်ပေါ်လာပါစေ။',
    opening: { style: 'gift', emoji: '🎁', title: 'ဒီနေ့က မင်းအတွက်ပါ' },
    pages: [
      {
        title: 'မင်းအတွက် ဆုတောင်းလေး',
        message:
          'အမြဲပြုံးပျော်နိုင်ပါစေ။ မင်းကို ချစ်တဲ့သူတွေနဲ့အတူ နွေးထွေးတဲ့ အမှတ်တရတွေ အများကြီး ဖန်တီးနိုင်ပါစေ။',
        paper: 'blank',
      },
    ],
    track: 'little-celebration',
    cake: { flavor: 'vanilla', tiers: 2 },
    typography: 'serif',
  },
  {
    id: 'sweet-birthday',
    name: 'ချိုမြိန်တဲ့ မွေးနေ့',
    description: 'မက်မွန်ရောင် စာအိတ်၊ ရင်ထဲကစာနဲ့ Chocolate cake လေး။',
    occasion: 'birthday',
    theme: 'peach',
    title: 'မင်းရဲ့ နေ့လေး 🎂',
    message:
      'ရိုးရိုးလေးပဲ ပြောချင်တယ်။ မင်းရှိနေလို့ နေ့ရက်တွေ ပိုလှလာတယ်။ ချိုမြိန်ပြီး ပျော်ရွှင်စရာ မွေးနေ့လေး ဖြစ်ပါစေ။',
    opening: {
      style: 'envelope',
      emoji: '🎂',
      title: 'မွေးနေ့အတွက် စာလေးတစ်စောင်',
    },
    pages: [
      {
        title: 'ပြောချင်တဲ့ စကားလေးတွေ',
        message:
          'ကိုယ့်အတွက် တန်ဖိုးရှိတဲ့ မင်းအကြောင်းတွေကို ဒီစာမျက်နှာလေးမှာ ဆက်ရေးလိုက်ပါ။',
        paper: 'lined',
      },
    ],
    track: 'none',
    cake: { flavor: 'chocolate', tiers: 1 },
    typography: 'letter',
  },
  {
    id: 'rose-anniversary',
    name: 'တို့နှစ်ယောက်ရဲ့ နေ့လေး',
    description:
      'နှင်းဆီရောင်နဲ့ အတူဖြတ်သန်းခဲ့တဲ့ အခိုက်အတန့်တွေကို ပြန်ကြည့်ပါ။',
    occasion: 'anniversary',
    theme: 'rose',
    title: 'Happy Anniversary 💖',
    message:
      'အတူရှိခဲ့တဲ့ နေ့ရက်တိုင်းအတွက် ကျေးဇူးတင်တယ်။ ရှေ့က ခရီးရှည်ကြီးကိုလည်း လက်တွဲမဖြုတ်ဘဲ ဆက်လျှောက်သွားချင်တယ်။',
    opening: {
      style: 'envelope',
      emoji: '💖',
      title: 'တို့နှစ်ယောက်အတွက် အမှတ်တရ',
    },
    pages: [
      {
        title: 'စတင်တွေ့ဆုံခဲ့တဲ့ နေ့လေး',
        message:
          'ပထမဆုံး အမှတ်တရလေးကို ဒီမှာ ရေးထားလိုက်ပါ။ ချစ်ရတဲ့ ပုံလေးတွေကိုလည်း ထပ်ထည့်နိုင်ပါတယ်။',
        paper: 'lined',
      },
      {
        title: 'ရှေ့ဆက်မယ့် နေ့ရက်များ',
        message: 'အတူတူ လုပ်ချင်တဲ့ အရာလေးတွေ၊ သွားချင်တဲ့ နေရာလေးတွေ…',
        paper: 'blank',
      },
    ],
    track: 'soft-promise',
    typography: 'letter',
  },
  {
    id: 'quiet-memories',
    name: 'အေးချမ်းတဲ့ အမှတ်တရ',
    description:
      'စိမ်းနုရောင်နဲ့ ရိုးရှင်းတဲ့ စာမျက်နှာတွေမှာ ကိုယ့်ပုံနဲ့ စကားလေးတွေ ထည့်ပါ။',
    occasion: 'anniversary',
    theme: 'mint',
    title: 'အတူရှိနေပေးလို့ ကျေးဇူးတင်ပါတယ်',
    message:
      'ထူးခြားတဲ့ နေ့ရက်တွေတင်မကဘူး၊ သာမန် နေ့လေးတွေကိုပါ လှပစေခဲ့တဲ့ မင်းကို ကျေးဇူးတင်ပါတယ်။',
    opening: { style: 'envelope', emoji: '🌸', title: 'သတိရစရာ စာလေးတစ်စောင်' },
    pages: [
      {
        title: 'တို့ရဲ့ အမှတ်တရပုံများ',
        message:
          'ဒီနေရာမှာ ချစ်ရတဲ့ ပုံလေးတွေ ထည့်ပြီး စိတ်ကြိုက် နေရာချထားနိုင်ပါတယ်။',
        paper: 'blank',
      },
    ],
    track: 'memory-evening',
    typography: 'letter',
  },
  {
    id: 'wedding-letter',
    name: 'နွေးထွေးတဲ့ မင်္ဂလာဖိတ်စာ',
    description:
      'ပန်းနုရောင် စာအိတ်နဲ့ ပွဲနေ့၊ အချိန်၊ နေရာအတွက် သီးသန့်စာမျက်နှာ။',
    occasion: 'wedding-invitation',
    theme: 'rose',
    title: 'ကျွန်တော်တို့ မင်္ဂလာပွဲကို ဖိတ်ခေါ်ပါတယ်',
    message:
      'ချစ်ခြင်းနဲ့ စတင်မယ့် ဘဝခရီးရဲ့ ပထမနေ့လေးမှာ လူကြီးမင်းတို့နဲ့အတူ ပျော်ရွှင်စွာ ဆင်နွှဲချင်ပါတယ်။ ကြွရောက်ချီးမြှင့်ပေးပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါတယ်။',
    opening: {
      style: 'envelope',
      emoji: '💍',
      kicker: 'WEDDING INVITATION',
      title: 'မင်္ဂလာပွဲလေးကို လာခဲ့ပါနော်',
      message: 'မင်္ဂလာလက်ထပ်ပွဲသို့ ကြွရောက်ချီးမြှင့်ပေးပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်။',
      buttonText: 'ဖိတ်စာဖွင့်ကြည့်မယ်',
    },
    pages: [
      {
        title: 'ပွဲနေ့ အစီအစဉ်',
        message:
          'နေ့ရက် — ဒီနေရာမှာ ရေးပါ\nအချိန် — ဒီနေရာမှာ ရေးပါ\nနေရာ — ဒီနေရာမှာ ရေးပါ\n\nအတူဆင်နွှဲဖို့ စောင့်မျှော်နေပါတယ်။',
        paper: 'blank',
      },
    ],
    track: 'soft-promise',
    typography: 'serif',
  },
  {
    id: 'wedding-wishes',
    name: 'ရွှေရောင် ဆုမွန်ကောင်း',
    description: 'မောင်နှံနှစ်ဦးအတွက် နူးညံ့တဲ့ ဆုတောင်းစာနဲ့ သုံးထပ် cake။',
    occasion: 'wedding-wish',
    theme: 'gold',
    title: 'ပျော်ရွှင်ချမ်းမြေ့တဲ့ ဘဝခရီးလေး ဖြစ်ပါစေ',
    message:
      'နားလည်မှု၊ ယုံကြည်မှုနဲ့ ချစ်ခြင်းတွေကို အခြေခံပြီး သာယာတဲ့ အိမ်ကလေးကို အတူတူ တည်ဆောက်နိုင်ပါစေ။ ရိုးမြေကျ လက်တွဲသွားနိုင်ကြပါစေ။',
    opening: {
      style: 'gift',
      emoji: '🕊️',
      title: 'မောင်နှံနှစ်ဦးအတွက် ဆုမွန်ကောင်း',
    },
    pages: [],
    track: 'soft-promise',
    cake: { flavor: 'vanilla', tiers: 3 },
    typography: 'serif',
  },
]
export function createTemplateCard(id: string): CardConfig | undefined {
  const template = templateCatalog.find((item) => item.id === id)
  if (!template) return undefined
  const card = createCard(template.occasion)
  card.theme = template.theme
  card.appearance = createAppearance(template.theme)
  card.title = template.title
  card.message = template.message
  card.appearance.heading.size = template.typography === 'serif' ? 30 : 26
  card.appearance.heading.font =
    template.typography === 'serif' ? 'Playfair Display' : 'Padauk'
  card.appearance.body.font = 'Padauk'
  card.appearance.body.size = 16
  card.appearance.body.align =
    template.typography === 'letter' ? 'left' : 'center'
  card.opening = {
    ...card.opening,
    ...template.opening,
    background: card.appearance.colors.surface,
    color: card.appearance.colors.background,
    sealColor: card.appearance.colors.accent,
    textColor: card.appearance.colors.text,
    animation: template.opening.style === 'gift' ? 'sparkles' : 'gentle',
  }
  card.pages = template.pages.map((page, index) => ({
    ...page,
    id: `starter-page-${index + 1}`,
    background: null,
  }))
  card.music.trackId = template.track
  if (template.cake) {
    card.cake = {
      ...card.cake,
      ...template.cake,
      enabled: true,
      creamColor: template.cake.flavor === 'chocolate' ? '#694131' : '#fff5e5',
      accentColor: card.appearance.colors.accent,
    }
    if (template.occasion === 'birthday')
      card.cake.candles = [-0.3, 0, 0.3].map((x, index) => ({
        id: `starter-candle-${index}`,
        design: 'classic',
        digit: 0,
        color: card.appearance.colors.accent,
        position: { x, z: index === 1 ? -0.2 : 0.2 },
      }))
  }
  return card
}
