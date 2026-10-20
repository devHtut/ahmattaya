import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS } from '../models/music.ts'
const formats: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
}
const accepted = new Set([
  ...Object.values(formats),
  'audio/mp3',
  'audio/x-m4a',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
])
export function validateAudioFile(
  file: Pick<File, 'name' | 'type' | 'size'>,
): string | null {
  if (!file.size || file.size > MAX_AUDIO_BYTES)
    return 'သီချင်းဖိုင်ကို 20 MB အောက် ရွေးပေးပါ။'
  const extension = file.name.split('.').at(-1)?.toLowerCase() ?? ''
  if (
    !formats[extension] ||
    (file.type &&
      file.type !== 'application/octet-stream' &&
      !accepted.has(file.type))
  )
    return 'MP3၊ M4A၊ WAV၊ OGG သို့မဟုတ် WebM သီချင်းဖိုင်ကို ရွေးပေးပါ။'
  return null
}
export function readAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(blob)
    const cleanup = () => {
      clearTimeout(timer)
      audio.removeAttribute('src')
      audio.load()
      URL.revokeObjectURL(url)
    }
    const fail = () => {
      audio.onloadedmetadata = null
      audio.onerror = null
      cleanup()
      reject(
        new Error(
          'ဒီသီချင်းကို browser က ဖွင့်မရပါ။ MP3 သို့မဟုတ် M4A ဖိုင်တစ်ခု ထပ်ရွေးပေးပါ။',
        ),
      )
    }
    const timer = setTimeout(fail, 15000)
    audio.preload = 'metadata'
    audio.onerror = fail
    audio.onloadedmetadata = () => {
      const duration = audio.duration
      audio.onloadedmetadata = null
      audio.onerror = null
      cleanup()
      if (
        !Number.isFinite(duration) ||
        duration <= 0 ||
        duration > MAX_AUDIO_SECONDS
      )
        reject(
          new Error(
            'သီချင်းကို 15 မိနစ်အောက်၊ ကြာချိန်ဖတ်လို့ရတဲ့ ဖိုင် ရွေးပေးပါ။',
          ),
        )
      else resolve(duration)
    }
    audio.src = url
  })
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let abandoned = false
    const request = indexedDB.open('ahmattaya.audio', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('tracks')
    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      abandoned = true
      reject(new Error('Audio storage is busy'))
    }
    request.onsuccess = () => {
      const db = request.result
      if (abandoned) {
        db.close()
        return
      }
      db.onversionchange = () => db.close()
      resolve(db)
    }
  })
}
export async function saveAudioAsset(
  file: File,
): Promise<{ assetId: string; seconds: number }> {
  const invalid = validateAudioFile(file)
  if (invalid) throw new Error(invalid)
  const type = formats[file.name.split('.').at(-1)!.toLowerCase()]
  const blob = new Blob([file], { type })
  const seconds = await readAudioDuration(blob)
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  const assetId = Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
  const db = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('tracks', 'readwrite')
      tx.objectStore('tracks').put(blob, assetId)
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error ?? new Error('Audio write aborted'))
      tx.onerror = () => reject(tx.error)
    })
    return { assetId, seconds }
  } finally {
    db.close()
  }
}
export async function loadAudioAsset(id: string): Promise<Blob | null> {
  const db = await openDatabase()
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction('tracks', 'readonly')
      const request = tx.objectStore('tracks').get(id)
      let result: Blob | null = null
      request.onsuccess = () => {
        result = request.result instanceof Blob ? request.result : null
      }
      tx.oncomplete = () => resolve(result)
      tx.onabort = () => reject(tx.error ?? new Error('Audio read aborted'))
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
