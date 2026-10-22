import type { CardConfig } from '../models/card.ts'
import type { Project } from '../../features/projects/project-storage.ts'
import { deleteImageAsset, listAllImageAssets } from './image-assets.ts'
import { deleteAudioAsset, listAllAudioAssets } from './audio-assets.ts'

export interface MediaAssetStore {
  listImages(): Promise<{ id: string; size: number }[]>
  deleteImage(id: string): Promise<void>
  listAudio(): Promise<{ id: string; size: number }[]>
  deleteAudio(id: string): Promise<void>
}

export const defaultMediaAssetStore: MediaAssetStore = {
  listImages: () => listAllImageAssets(),
  deleteImage: (id) => deleteImageAsset(id),
  listAudio: () => listAllAudioAssets(),
  deleteAudio: (id) => deleteAudioAsset(id),
}

export interface StorageSummary {
  quotaBytes: number
  usedBytes: number
  usagePercent: number
  images: {
    count: number
    totalBytes: number
  }
  audio: {
    count: number
    totalBytes: number
  }
  projects: {
    activeCount: number
    trashedCount: number
    approxBytes: number
  }
  unreferenced: {
    imageCount: number
    imageBytes: number
    audioCount: number
    audioBytes: number
    totalBytes: number
    unreferencedImageIds: string[]
    unreferencedAudioIds: string[]
  }
}

export interface CleanupResult {
  cleanedImageCount: number
  cleanedImageBytes: number
  cleanedAudioCount: number
  cleanedAudioBytes: number
  totalFreedBytes: number
}

/**
 * Format bytes into human-readable string (e.g. 1.5 MB, 450 KB)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Safely collects all media asset IDs referenced by any project card
 * (both active and trashed cards) or the current working draft.
 * Never excludes trashed cards so recoverable cards retain their media.
 */
export function collectReferencedMedia(
  projects: Pick<Project, 'card'>[],
  currentDraft?: CardConfig | null,
): {
  referencedImageIds: Set<string>
  referencedAudioIds: Set<string>
} {
  const referencedImageIds = new Set<string>()
  const referencedAudioIds = new Set<string>()

  const allCards = [
    ...projects.map((p) => p.card),
    ...(currentDraft ? [currentDraft] : []),
  ]

  for (const card of allCards) {
    if (!card) continue

    // Cover page background
    if (card.background?.assetId) {
      referencedImageIds.add(card.background.assetId)
    }

    // Inner pages backgrounds
    if (Array.isArray(card.pages)) {
      for (const page of card.pages) {
        if (page.background?.assetId) {
          referencedImageIds.add(page.background.assetId)
        }
      }
    }

    // Custom music track
    if (card.music?.custom?.assetId) {
      referencedAudioIds.add(card.music.custom.assetId)
    }
  }

  return { referencedImageIds, referencedAudioIds }
}

/**
 * Inspects navigator.storage quota and analyzes media usage and unreferenced assets.
 */
export async function getStorageSummary(
  projects: Project[],
  currentDraft?: CardConfig | null,
  store: MediaAssetStore = defaultMediaAssetStore,
): Promise<StorageSummary> {
  let quotaBytes = 100 * 1024 * 1024 // 100MB fallback
  let usedBytes = 0

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate()
      if (estimate.quota) quotaBytes = estimate.quota
      if (estimate.usage) usedBytes = estimate.usage
    } catch {
      // Ignore estimation errors
    }
  }

  const [images, audio] = await Promise.all([
    store.listImages(),
    store.listAudio(),
  ])

  const totalImageBytes = images.reduce((sum, img) => sum + img.size, 0)
  const totalAudioBytes = audio.reduce((sum, trk) => sum + trk.size, 0)

  const { referencedImageIds, referencedAudioIds } = collectReferencedMedia(
    projects,
    currentDraft,
  )

  const unreferencedImages = images.filter(
    (img) => !referencedImageIds.has(img.id),
  )
  const unreferencedAudio = audio.filter(
    (trk) => !referencedAudioIds.has(trk.id),
  )

  const unreferencedImageBytes = unreferencedImages.reduce(
    (sum, img) => sum + img.size,
    0,
  )
  const unreferencedAudioBytes = unreferencedAudio.reduce(
    (sum, trk) => sum + trk.size,
    0,
  )

  const activeCount = projects.filter((p) => !p.deleted).length
  const trashedCount = projects.filter((p) => p.deleted).length

  // Calculate project localStorage approximate bytes
  let approxProjectBytes = 0
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('ahmattaya.projects')
      if (raw) approxProjectBytes = raw.length * 2
    }
  } catch {
    // Ignore
  }

  const effectiveUsed =
    usedBytes || totalImageBytes + totalAudioBytes + approxProjectBytes
  const usagePercent = Math.min(
    100,
    Math.round((effectiveUsed / quotaBytes) * 1000) / 10,
  )

  return {
    quotaBytes,
    usedBytes: effectiveUsed,
    usagePercent,
    images: {
      count: images.length,
      totalBytes: totalImageBytes,
    },
    audio: {
      count: audio.length,
      totalBytes: totalAudioBytes,
    },
    projects: {
      activeCount,
      trashedCount,
      approxBytes: approxProjectBytes,
    },
    unreferenced: {
      imageCount: unreferencedImages.length,
      imageBytes: unreferencedImageBytes,
      audioCount: unreferencedAudio.length,
      audioBytes: unreferencedAudioBytes,
      totalBytes: unreferencedImageBytes + unreferencedAudioBytes,
      unreferencedImageIds: unreferencedImages.map((img) => img.id),
      unreferencedAudioIds: unreferencedAudio.map((trk) => trk.id),
    },
  }
}

/**
 * Safely removes unreferenced media assets without deleting files used
 * by any other drafts or trashed projects.
 */
export async function cleanupUnreferencedMedia(
  projects: Project[],
  currentDraft?: CardConfig | null,
  store: MediaAssetStore = defaultMediaAssetStore,
): Promise<CleanupResult> {
  const [images, audio] = await Promise.all([
    store.listImages(),
    store.listAudio(),
  ])

  const { referencedImageIds, referencedAudioIds } = collectReferencedMedia(
    projects,
    currentDraft,
  )

  let cleanedImageCount = 0
  let cleanedImageBytes = 0
  let cleanedAudioCount = 0
  let cleanedAudioBytes = 0

  // Delete only images that are NOT in referencedImageIds
  for (const img of images) {
    if (!referencedImageIds.has(img.id)) {
      try {
        await store.deleteImage(img.id)
        cleanedImageCount++
        cleanedImageBytes += img.size
      } catch {
        // Skip individual failure safely
      }
    }
  }

  // Delete only audio tracks that are NOT in referencedAudioIds
  for (const trk of audio) {
    if (!referencedAudioIds.has(trk.id)) {
      try {
        await store.deleteAudio(trk.id)
        cleanedAudioCount++
        cleanedAudioBytes += trk.size
      } catch {
        // Skip individual failure safely
      }
    }
  }

  return {
    cleanedImageCount,
    cleanedImageBytes,
    cleanedAudioCount,
    cleanedAudioBytes,
    totalFreedBytes: cleanedImageBytes + cleanedAudioBytes,
  }
}
