import { z } from 'zod'

export const backgroundSchema = z.object({
  assetId: z.string().regex(/^[a-f0-9]{64}$/),
  positionX: z.number().finite().min(0).max(100),
  positionY: z.number().finite().min(0).max(100),
  zoom: z.number().finite().min(1).max(3),
  opacity: z.number().finite().min(0).max(1),
  overlayColor: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  overlayOpacity: z.number().finite().min(0).max(1),
})
export type PageBackground = z.infer<typeof backgroundSchema>
export function createBackground(assetId: string): PageBackground {
  return {
    assetId,
    positionX: 50,
    positionY: 50,
    zoom: 1,
    opacity: 1,
    overlayColor: '#ffffff',
    overlayOpacity: 0.45,
  }
}
