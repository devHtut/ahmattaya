import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatBytes,
  collectReferencedMedia,
  getStorageSummary,
  cleanupUnreferencedMedia,
} from '../src/shared/media/storage-manager.ts'
import { createCard } from '../src/shared/templates/templates.ts'

function createMockMediaStore(initialImages = [], initialAudio = []) {
  const images = new Map(initialImages.map((i) => [i.id, i.size]))
  const audio = new Map(initialAudio.map((a) => [a.id, a.size]))

  const store = {
    listImages: async () =>
      Array.from(images.entries()).map(([id, size]) => ({ id, size })),
    deleteImage: async (id) => {
      images.delete(id)
    },
    listAudio: async () =>
      Array.from(audio.entries()).map(([id, size]) => ({ id, size })),
    deleteAudio: async (id) => {
      audio.delete(id)
    },
  }

  return { store, images, audio }
}

test('formatBytes formats binary magnitudes accurately', () => {
  assert.equal(formatBytes(0), '0 B')
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(1024), '1.0 KB')
  assert.equal(formatBytes(1.5 * 1024 * 1024), '1.5 MB')
  assert.equal(formatBytes(20 * 1024 * 1024), '20.0 MB')
  assert.equal(formatBytes(2.5 * 1024 * 1024 * 1024), '2.5 GB')
})

test('collectReferencedMedia extracts all backgrounds and audio from active, trashed, and draft cards', () => {
  const imgHash1 = 'a'.repeat(64)
  const imgHash2 = 'b'.repeat(64)
  const imgHash3 = 'c'.repeat(64)
  const audioHash1 = 'd'.repeat(64)
  const audioHash2 = 'e'.repeat(64)

  const activeCard = createCard('birthday')
  activeCard.background = {
    assetId: imgHash1,
    positionX: 50,
    positionY: 50,
    zoom: 1,
    opacity: 1,
    overlayColor: '#ffffff',
    overlayOpacity: 0.5,
  }
  activeCard.music = {
    trackId: 'custom',
    volume: 0.5,
    loop: true,
    custom: {
      assetId: audioHash1,
      revision: 1,
      name: 'Song 1',
      seconds: 120,
      bytes: 2000000,
    },
  }

  const trashedCard = createCard('wedding-invitation')
  trashedCard.pages.push({
    id: 'page-2',
    title: 'Page 2',
    message: 'Hello',
    paper: 'blank',
    background: {
      assetId: imgHash2,
      positionX: 50,
      positionY: 50,
      zoom: 1,
      opacity: 1,
      overlayColor: '#ffffff',
      overlayOpacity: 0.5,
    },
  })

  const draftCard = createCard('anniversary')
  draftCard.background = {
    assetId: imgHash3,
    positionX: 50,
    positionY: 50,
    zoom: 1,
    opacity: 1,
    overlayColor: '#ffffff',
    overlayOpacity: 0.5,
  }
  draftCard.music = {
    trackId: 'custom',
    volume: 0.5,
    loop: true,
    custom: {
      assetId: audioHash2,
      revision: 1,
      name: 'Song 2',
      seconds: 60,
      bytes: 1000000,
    },
  }

  const projects = [
    {
      id: 'proj-1',
      name: 'Active Project',
      updatedAt: new Date().toISOString(),
      deleted: false,
      card: activeCard,
    },
    {
      id: 'proj-2',
      name: 'Trashed Project',
      updatedAt: new Date().toISOString(),
      deleted: true,
      card: trashedCard,
    },
  ]

  const { referencedImageIds, referencedAudioIds } = collectReferencedMedia(
    projects,
    draftCard,
  )

  // Must contain active project media
  assert.equal(referencedImageIds.has(imgHash1), true)
  assert.equal(referencedAudioIds.has(audioHash1), true)

  // CRITICAL: Must preserve trashed project media so restored cards are intact
  assert.equal(referencedImageIds.has(imgHash2), true)

  // Must preserve current working draft media
  assert.equal(referencedImageIds.has(imgHash3), true)
  assert.equal(referencedAudioIds.has(audioHash2), true)
})

test('getStorageSummary detects unreferenced media assets accurately', async () => {
  const usedImg = '1'.repeat(64)
  const orphanImg = '2'.repeat(64)
  const usedAudio = '3'.repeat(64)
  const orphanAudio = '4'.repeat(64)

  const card = createCard('birthday')
  card.background = {
    assetId: usedImg,
    positionX: 50,
    positionY: 50,
    zoom: 1,
    opacity: 1,
    overlayColor: '#ffffff',
    overlayOpacity: 0.5,
  }
  card.music = {
    trackId: 'custom',
    volume: 0.5,
    loop: true,
    custom: {
      assetId: usedAudio,
      revision: 1,
      name: 'Track',
      seconds: 100,
      bytes: 50000,
    },
  }

  const projects = [
    {
      id: 'proj-1',
      name: 'Test Project',
      updatedAt: new Date().toISOString(),
      deleted: false,
      card,
    },
  ]

  const { store } = createMockMediaStore(
    [
      { id: usedImg, size: 50000 },
      { id: orphanImg, size: 30000 },
    ],
    [
      { id: usedAudio, size: 2000000 },
      { id: orphanAudio, size: 4000000 },
    ],
  )

  const summary = await getStorageSummary(projects, null, store)

  assert.equal(summary.images.count, 2)
  assert.equal(summary.images.totalBytes, 80000)
  assert.equal(summary.audio.count, 2)
  assert.equal(summary.audio.totalBytes, 6000000)

  // Unreferenced calculation
  assert.equal(summary.unreferenced.imageCount, 1)
  assert.equal(summary.unreferenced.imageBytes, 30000)
  assert.equal(summary.unreferenced.audioCount, 1)
  assert.equal(summary.unreferenced.audioBytes, 4000000)
  assert.equal(summary.unreferenced.totalBytes, 4030000)
  assert.deepEqual(summary.unreferenced.unreferencedImageIds, [orphanImg])
  assert.deepEqual(summary.unreferenced.unreferencedAudioIds, [orphanAudio])
})

test('cleanupUnreferencedMedia purges only unreferenced media and never deletes active or trashed files', async () => {
  const activeImg = 'a'.repeat(64)
  const trashedImg = 'b'.repeat(64)
  const orphanImg1 = 'c'.repeat(64)
  const orphanImg2 = 'd'.repeat(64)

  const activeAudio = 'e'.repeat(64)
  const orphanAudio = 'f'.repeat(64)

  const card1 = createCard('birthday')
  card1.background = {
    assetId: activeImg,
    positionX: 50,
    positionY: 50,
    zoom: 1,
    opacity: 1,
    overlayColor: '#ffffff',
    overlayOpacity: 0.5,
  }
  card1.music = {
    trackId: 'custom',
    volume: 0.5,
    loop: true,
    custom: {
      assetId: activeAudio,
      revision: 1,
      name: 'Active Audio',
      seconds: 50,
      bytes: 1500000,
    },
  }

  const card2 = createCard('wedding-invitation')
  card2.background = {
    assetId: trashedImg,
    positionX: 50,
    positionY: 50,
    zoom: 1,
    opacity: 1,
    overlayColor: '#ffffff',
    overlayOpacity: 0.5,
  }

  const projects = [
    {
      id: 'p1',
      name: 'Active Card',
      updatedAt: new Date().toISOString(),
      deleted: false,
      card: card1,
    },
    {
      id: 'p2',
      name: 'Trashed Card',
      updatedAt: new Date().toISOString(),
      deleted: true,
      card: card2,
    },
  ]

  const { store, images, audio } = createMockMediaStore(
    [
      { id: activeImg, size: 40000 },
      { id: trashedImg, size: 60000 },
      { id: orphanImg1, size: 25000 },
      { id: orphanImg2, size: 35000 },
    ],
    [
      { id: activeAudio, size: 1500000 },
      { id: orphanAudio, size: 3000000 },
    ],
  )

  const cleanupResult = await cleanupUnreferencedMedia(projects, null, store)

  // Verify freed counts and bytes
  assert.equal(cleanupResult.cleanedImageCount, 2)
  assert.equal(cleanupResult.cleanedImageBytes, 60000)
  assert.equal(cleanupResult.cleanedAudioCount, 1)
  assert.equal(cleanupResult.cleanedAudioBytes, 3000000)
  assert.equal(cleanupResult.totalFreedBytes, 3060000)

  // CRITICAL VERIFICATION: Active & Trashed media MUST remain untouched!
  assert.equal(images.has(activeImg), true)
  assert.equal(images.has(trashedImg), true)
  assert.equal(audio.has(activeAudio), true)

  // Orphaned media MUST be purged
  assert.equal(images.has(orphanImg1), false)
  assert.equal(images.has(orphanImg2), false)
  assert.equal(audio.has(orphanAudio), false)

  // Subsequent check shows 0 unreferenced
  const summaryAfter = await getStorageSummary(projects, null, store)
  assert.equal(summaryAfter.unreferenced.totalBytes, 0)
  assert.equal(summaryAfter.unreferenced.imageCount, 0)
  assert.equal(summaryAfter.unreferenced.audioCount, 0)
})
