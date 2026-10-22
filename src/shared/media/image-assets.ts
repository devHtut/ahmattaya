// Image bytes stay outside localStorage project metadata. Immutable content IDs
// allow project duplicates and undo history to share one durable Blob.
import { verifyAsset } from './asset-bytes.ts'
const DB_NAME = 'ahmattaya.media'
const STORE = 'images'
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let abandoned = false
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      abandoned = true
      reject(new Error('Media storage is busy'))
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
export async function saveImageAsset(dataUrl: string): Promise<string> {
  const match =
    /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new Error('Invalid image')
  const binary = atob(match[2])
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  if (!bytes.length || bytes.length > 200 * 1024)
    throw new Error('Image too large')
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const id = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
  const blob = new Blob([bytes], { type: match[1] })
  await cacheImageAsset(id, blob)
  return id
}
export async function cacheImageAsset(id: string, blob: Blob): Promise<void> {
  await verifyAsset(id, blob, 'image')
  const db = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, id)
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error ?? new Error('Media write aborted'))
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
export async function loadImageAsset(id: string): Promise<Blob | null> {
  if (typeof indexedDB === 'undefined') return null
  const db = await openDatabase()
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(id)
      let result: Blob | null = null
      request.onsuccess = () => {
        result = request.result instanceof Blob ? request.result : null
      }
      tx.oncomplete = () => resolve(result)
      tx.onabort = () => reject(tx.error ?? new Error('Media read aborted'))
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function listAllImageAssets(): Promise<
  { id: string; size: number }[]
> {
  if (typeof indexedDB === 'undefined') return []
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      const results: { id: string; size: number }[] = []
      const request = store.openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const blob = cursor.value instanceof Blob ? cursor.value : null
          results.push({
            id: String(cursor.key),
            size: blob ? blob.size : 0,
          })
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
      tx.onabort = () => reject(tx.error ?? new Error('Cursor aborted'))
    })
  } finally {
    db.close()
  }
}

export async function deleteImageAsset(id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const db = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error ?? new Error('Delete aborted'))
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
