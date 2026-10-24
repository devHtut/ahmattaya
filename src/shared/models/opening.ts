import { z } from 'zod'

export const openingStyles = [
  'envelope',
  'gift',
  'scroll',
  'heart',
  'ribbon',
  'gate',
] as const

export const openingAnimations = [
  'gentle',
  'sparkles',
  'confetti',
  'hearts',
  'bounce',
  'glow',
  'fade',
  'none',
] as const

export const openingEmojis = [
  '💌',
  '💖',
  '🎂',
  '🎁',
  '💍',
  '🌸',
  '✨',
  '🕊️',
  '💐',
  '🎉',
  '🧸',
  '🌹',
  '🥂',
  '🦋',
  '🎈',
  '🌟',
] as const

export const openingSchema = z.object({
  style: z.enum(openingStyles).default('envelope'),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#f4effb'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#b49bdc'),
  sealColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#8b5cf6'),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#453362'),
  emoji: z.string().max(20).default('💌'),
  kicker: z.string().max(100).default('A LITTLE SURPRISE FOR YOU'),
  showKicker: z.boolean().default(true),
  title: z.string().max(120).default('သင့်အတွက် အမှတ်တရလေး'),
  message: z.string().max(300).default('ချစ်ခြင်းတွေနဲ့ ဖန်တီးထားတဲ့ အံ့ဩစရာလေးတစ်ခု ရှိနေပါတယ်။'),
  buttonText: z.string().max(50).default('ဖွင့်ကြည့်မယ်'),
  titleFont: z.string().max(80).default(''),
  messageFont: z.string().max(80).default(''),
  buttonFont: z.string().max(80).default(''),
  animation: z.enum(openingAnimations).default('gentle'),
  musicOnOpen: z.boolean().default(true),
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
    kicker: 'A LITTLE SURPRISE FOR YOU',
    showKicker: true,
    title: 'သင့်အတွက် အမှတ်တရလေး',
    message: 'ချစ်ခြင်းတွေနဲ့ ဖန်တီးထားတဲ့ အံ့ဩစရာလေးတစ်ခု ရှိနေပါတယ်။',
    buttonText: 'ဖွင့်ကြည့်မယ်',
    titleFont: '',
    messageFont: '',
    buttonFont: '',
    animation: 'gentle',
    musicOnOpen: true,
  }
}
