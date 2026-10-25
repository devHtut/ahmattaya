import { z } from 'zod'

export const weddingEventSchema = z.object({
  date: z.string().max(80).default(''),
  time: z.string().max(80).default(''),
  venue: z.string().max(160).default(''),
  location: z.string().max(160).default(''),
  mapUrl: z.string().max(500).default(''),
  rsvpDeadline: z.string().max(80).default(''),
  rsvpPhone: z.string().max(60).default(''),
  rsvpEnabled: z.boolean().default(true),
})

export const timelineItemSchema = z.object({
  id: z.string().min(1).max(80),
  year: z.string().max(40),
  title: z.string().max(100),
  description: z.string().max(500),
  photo: z.string().max(300000).optional(),
})

const colorHexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const eventColorsSchema = z.object({
  background: colorHexSchema,
  surface: colorHexSchema,
  text: colorHexSchema,
  accent: colorHexSchema,
})
export type EventColors = z.infer<typeof eventColorsSchema>

export const eventHeadingStyleSchema = z.object({
  font: z.string().min(1).max(100).optional(),
  size: z.number().int().min(12).max(64).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
})

export const eventBodyStyleSchema = z.object({
  font: z.string().min(1).max(100).optional(),
  size: z.number().int().min(10).max(40).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
})

export type EventHeadingStyle = z.infer<typeof eventHeadingStyleSchema>
export type EventBodyStyle = z.infer<typeof eventBodyStyleSchema>

export const anniversaryEventSchema = z.object({
  yearsCount: z.number().int().min(0).max(100).default(1),
  durationText: z.string().max(80).optional(),
  date: z.string().max(80).default(''),
  timeline: z.array(timelineItemSchema).max(12).default([]),
  displayMode: z.enum(['years-months', 'days']).optional(),
  yearsValue: z.number().int().min(0).max(100).optional(),
  monthsValue: z.number().int().min(0).max(11).optional(),
  daysValue: z.number().int().min(0).max(36500).optional(),
  rawDate: z.string().max(40).optional(),
  enabled: z.boolean().optional(),
  colors: eventColorsSchema.optional(),
  heading: eventHeadingStyleSchema.optional(),
  body: eventBodyStyleSchema.optional(),
})

export const eventSchema = z.object({
  wedding: weddingEventSchema.optional(),
  anniversary: anniversaryEventSchema.optional(),
})

export type WeddingEvent = z.infer<typeof weddingEventSchema>
export type TimelineItem = z.infer<typeof timelineItemSchema>
export type AnniversaryEvent = z.infer<typeof anniversaryEventSchema>
export type CardEvent = z.infer<typeof eventSchema>

export function createWeddingEvent(): WeddingEvent {
  return {
    date: '၂၀၂၆ ခုနှစ်၊ နိုဝင်ဘာလ ၂၈ ရက်',
    time: 'နံနက် ၉:၀၀ နာရီ မှ ၁၁:၀၀ နာရီထိ',
    venue: 'သုဝဏ္ဏဘူမိ Event Park',
    location: 'ရန်ကုန်မြို့',
    mapUrl: 'https://maps.google.com',
    rsvpDeadline: 'နိုဝင်ဘာလ ၂၀ ရက်မတိုင်မီ',
    rsvpPhone: '၀၉-၁၂၃၄၅၆၇၈၉',
    rsvpEnabled: true,
  }
}

export function createAnniversaryEvent(): AnniversaryEvent {
  return {
    yearsCount: 1,
    date: '၂၀၂၆ ခုနှစ်၊ ဒီဇင်ဘာလ',
    timeline: [
      {
        id: 't-1',
        year: 'စတင်ဆုံတွေ့ချိန်',
        title: 'ပထမဆုံး တွေ့ဆုံခြင်း',
        description: 'မိုးရေထဲမှာ ထီးလေးတစ်လက်နဲ့ စတင်ဆုံတွေ့ခဲ့ကြတယ်…',
      },
      {
        id: 't-2',
        year: '၁ နှစ်ပြည့်',
        title: 'လက်တွဲခရီး ၁ နှစ်ပြည့်',
        description:
          'အမှတ်တရများစွာနဲ့အတူ တစ်ယောက်လက်ကိုတစ်ယောက် ခိုင်မြဲစွာ တွဲလျက်…',
      },
    ],
  }
}

export function createBirthdayTimelineItems(): TimelineItem[] {
  return [
    {
      id: 'b-1',
      year: '၁ နှစ်ပြည့်',
      title: 'ပထမဆုံး မွေးနေ့အမှတ်တရ',
      description: 'ချစ်စရာ ကိတ်မုန့်လေးနဲ့ မိသားစုရဲ့ ပထမဆုံး မွေးနေ့ အမှတ်တရ…',
    },
    {
      id: 'b-2',
      year: 'အမှတ်တရ',
      title: 'ပျော်ရွှင်စရာ မွေးနေ့ပါတီ',
      description:
        'သူငယ်ချင်းများ၊ ချစ်ခင်ရသူများနှင့် အတူတူ ပျော်ရွှင်စွာ ဖြတ်သန်းခဲ့သော အမှတ်တရ…',
    },
  ]
}

export function createBirthdayAnniversaryEvent(): AnniversaryEvent {
  return {
    yearsCount: 1,
    yearsValue: 1,
    durationText: '၁ နှစ်ပြည့်',
    date: '',
    rawDate: '',
    enabled: true,
    timeline: createBirthdayTimelineItems(),
  }
}

