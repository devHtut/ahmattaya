import { z } from 'zod'

export const musicTrackSchema = z.enum([
  'none',
  'little-celebration',
  'soft-promise',
  'memory-evening',
])
export const musicSchema = z.object({
  trackId: musicTrackSchema,
  volume: z.number().finite().min(0).max(1),
  loop: z.boolean(),
})
export type MusicConfig = z.infer<typeof musicSchema>
export type MusicTrackId = Exclude<MusicConfig['trackId'], 'none'>
export function createMusic(): MusicConfig {
  return { trackId: 'none', volume: 0.35, loop: true }
}
