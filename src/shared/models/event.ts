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
})

export const anniversaryEventSchema = z.object({
  yearsCount: z.number().int().min(1).max(100).default(1),
  date: z.string().max(80).default(''),
  timeline: z.array(timelineItemSchema).max(12).default([]),
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
