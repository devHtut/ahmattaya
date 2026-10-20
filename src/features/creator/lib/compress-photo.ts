import { MAX_PHOTO_BYTES } from '../../../shared/models/card.ts'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export function validatePhotoFile(
  file: Pick<File, 'type' | 'size'>,
): string | null {
  if (!ACCEPTED_TYPES.includes(file.type))
    return 'JPG၊ PNG သို့မဟုတ် WebP ပုံကို ရွေးပေးပါ။'
  if (file.size === 0 || file.size > 15 * 1024 * 1024)
    return 'ပုံတစ်ပုံကို 15 MB အောက် ရွေးပေးပါ။'
  return null
}
function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('ပုံကို ချုံ့မရပါ။ ပုံတစ်ပုံ ထပ်ရွေးကြည့်ပါ။')),
      'image/webp',
      quality,
    ),
  )
}
function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('ပုံကို ဖတ်မရပါ။ ထပ်ရွေးပေးပါ။'))
    reader.readAsDataURL(blob)
  })
}
export async function compressPhoto(
  file: File,
): Promise<{ src: string; ratio: number }> {
  const invalid = validatePhotoFile(file)
  if (invalid) throw new Error(invalid)
  const url = URL.createObjectURL(file)
  const image = new Image()
  try {
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error('ပုံကို ဖတ်မရပါ။')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('ဒီ browser မှာ ပုံချုံ့မရသေးပါ။')
    let edge = 1600
    let best: Blob | undefined
    for (let attempt = 0; attempt < 6; attempt++) {
      const scale = Math.min(
        1,
        edge / Math.max(image.naturalWidth, image.naturalHeight),
      )
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.82, 0.68, 0.5]) {
        const blob = await toBlob(canvas, quality)
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= 150 * 1024)
          return {
            src: await readDataUrl(blob),
            ratio: Math.min(
              5,
              Math.max(0.2, image.naturalWidth / image.naturalHeight),
            ),
          }
      }
      edge = Math.round(edge * 0.75)
    }
    if (best && best.size <= MAX_PHOTO_BYTES)
      return {
        src: await readDataUrl(best),
        ratio: Math.min(
          5,
          Math.max(0.2, image.naturalWidth / image.naturalHeight),
        ),
      }
    throw new Error('200 KB အောက် ချုံ့မရပါ။ ပိုသေးတဲ့ ပုံကို ရွေးပေးပါ။')
  } catch (error) {
    if (error instanceof Error && error.message.includes('ပုံ')) throw error
    throw new Error(
      'ဒီပုံကို ဖတ်မရပါ။ JPG၊ PNG သို့မဟုတ် WebP ပုံတစ်ပုံ ထပ်ရွေးပေးပါ။',
      { cause: error },
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
