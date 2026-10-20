import { z } from 'zod'

export const openingEmojis = [
  '💌',
  '💖',
  '🎂',
  '🎁',
  '💍',
  '🌸',
  '✨',
  '🕊️',
] as const
export const openingSchema = z.object({
  style: z.enum(['envelope', 'gift']),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sealColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  emoji: z.enum(openingEmojis),
  title: z.string().max(120),
  message: z.string().max(300),
  buttonText: z.string().max(50),
  animation: z.enum(['gentle', 'sparkles', 'fade', 'none']),
  musicOnOpen: z.boolean(),
})
export type OpeningConfig = z.infer<typeof openingSchema>
export function createOpening(): OpeningConfig {
  return {
    style: 'envelope',
    background: '#f4effb',
    color: '#b49bdc',
    sealColor: '#8b5cf6',
    textColor: '#453362',
    emoji: '💌',
    title: 'သင့်အတွက် အမှတ်တရလေး',
    message: 'ချစ်ခြင်းတွေနဲ့ ဖန်တီးထားတဲ့ အံ့ဩစရာလေးတစ်ခု ရှိနေပါတယ်။',
    buttonText: 'ဖွင့်ကြည့်မယ်',
    animation: 'gentle',
    musicOnOpen: true,
  }
}
