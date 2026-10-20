import { z } from 'zod'
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024
export const MAX_AUDIO_SECONDS = 15 * 60
export const musicTrackSchema = z.enum([
  'none',
  'little-celebration',
  'soft-promise',
  'memory-evening',
])
export const legacyMusicSchema = z.object({
  trackId: musicTrackSchema,
  volume: z.number().finite().min(0).max(1),
  loop: z.boolean(),
})
export const customMusicSchema = z.object({
  assetId: z.string().regex(/^[a-f0-9]{64}$/),
  revision: z.number().int().nonnegative().default(0),
  name: z.string().trim().min(1).max(120),
  seconds: z.number().finite().positive().max(MAX_AUDIO_SECONDS),
  bytes: z.number().int().positive().max(MAX_AUDIO_BYTES),
})
export const musicSchema = legacyMusicSchema
  .extend({
    trackId: z.enum([...musicTrackSchema.options, 'custom']),
    custom: customMusicSchema.nullable().default(null),
  })
  .refine((music) => music.trackId !== 'custom' || music.custom !== null, {
    message: 'Custom music asset is required',
  })
export type MusicConfig = z.infer<typeof musicSchema>
export type MusicTrackId = Exclude<z.infer<typeof musicTrackSchema>, 'none'>
export function createMusic(): MusicConfig {
  return { trackId: 'none', volume: 0.35, loop: true, custom: null }
}
