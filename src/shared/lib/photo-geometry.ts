import type { PhotoFrame } from '../models/card'

// Logical page canvas — matches the 16 / 10 storybook aspect of .card-page-frame
export const PAGE_WIDTH = 640
export const PAGE_HEIGHT = 400
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
export function normalizeAngle(angle: number): number {
  return ((((angle + 180) % 360) + 360) % 360) - 180
}
export function constrainFrame(frame: PhotoFrame): PhotoFrame {
  const rotation = normalizeAngle(frame.rotation)
  const radians = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  const ratio = clamp(frame.ratio, 0.2, 5)
  const maxWidth =
    (Math.min(
      (PAGE_WIDTH * 0.98) / (cos + sin / ratio),
      (PAGE_HEIGHT * 0.98) / (sin + cos / ratio),
    ) /
      PAGE_WIDTH) *
    100
  const width = clamp(frame.width, 10, Math.min(85, maxWidth))
  const pixelWidth = (width / 100) * PAGE_WIDTH
  const pixelHeight = pixelWidth / ratio
  const halfX = ((pixelWidth * cos + pixelHeight * sin) / 2 / PAGE_WIDTH) * 100
  const halfY = ((pixelWidth * sin + pixelHeight * cos) / 2 / PAGE_HEIGHT) * 100
  return {
    ...frame,
    rotation,
    ratio,
    width,
    x: clamp(frame.x, halfX, 100 - halfX),
    y: clamp(frame.y, halfY, 100 - halfY),
  }
}
export function defaultPhotoFrame(index: number, ratio = 4 / 3): PhotoFrame {
  return constrainFrame({
    x: 78 - (index % 3) * 9,
    y: 42 + (index % 3) * 13,
    width: 26,
    ratio,
    rotation: index % 2 ? 7 : -6,
    shadow: true,
  })
}
export function resizeFrame(
  frame: PhotoFrame,
  localX: number,
  localY: number,
): PhotoFrame {
  const halfW = ((frame.width / 100) * PAGE_WIDTH) / 2
  const halfH = halfW / frame.ratio
  const scale = (localX * halfW + localY * halfH) / (halfW ** 2 + halfH ** 2)
  return constrainFrame({ ...frame, width: frame.width * scale })
}
