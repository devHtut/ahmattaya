import { z } from 'zod'
import {
  cardSchema,
  legacyCardSchema,
  v2CardSchema,
  v3CardSchema,
  v4CardSchema,
  v5CardSchema,
  v6CardSchema,
  v7CardSchema,
  v8CardSchema,
  type CardConfig,
} from '../../../shared/models/card.ts'

import { createCake } from '../../../shared/models/cake.ts'
import { createOpening } from '../../../shared/models/opening.ts'
import { createMusic } from '../../../shared/models/music.ts'
import { defaultPhotoFrame } from '../../../shared/lib/photo-geometry.ts'
import { createAppearance } from '../../../shared/templates/card-styles.ts'

export const storedCardSchema = z
  .union([
    cardSchema,
    v8CardSchema.transform((card) => ({
      ...card,
      schemaVersion: 9 as const,
      background: null,
    })),
    v7CardSchema.transform((card) => ({
      ...card,
      schemaVersion: 9 as const,
      cake: { ...card.cake, strokes: [], candles: [] },
    })),
    v6CardSchema.transform((card) => ({
      ...card,
      schemaVersion: 9 as const,
      cake: createCake(),
    })),
    v5CardSchema.transform((card) => ({
      ...card,
      schemaVersion: 9 as const,
      cake: createCake(),
      opening: createOpening(),
    })),
    v4CardSchema.transform((card) => ({
      ...card,
      schemaVersion: 9 as const,
      cake: createCake(),
      opening: createOpening(),
      music: createMusic(),
    })),
    v3CardSchema.transform((card) => ({
      ...card,
      schemaVersion: 9 as const,
      cake: createCake(),
      opening: createOpening(),
      music: createMusic(),
      photos: card.photos.map((photo, index) => ({
        ...photo,
        frame: defaultPhotoFrame(index),
      })),
    })),
    v2CardSchema.transform((card) => ({
      ...card,
      schemaVersion: 9 as const,
      cake: createCake(),
      opening: createOpening(),
      music: createMusic(),
      pages: [],
      photos: [],
    })),
    legacyCardSchema.transform((card) => ({
      ...card,
      schemaVersion: 9 as const,
      cake: createCake(),
      opening: createOpening(),
      music: createMusic(),
      pages: [],
      photos: [],
      appearance: createAppearance(card.theme),
    })),
  ])
  .pipe(z.preprocess((card) => card, cardSchema))

export const DRAFT_STORAGE_KEY = 'ahmattaya.creator-draft'
const draftEnvelopeSchema = z.object({
  storageVersion: z.literal(1),
  savedAt: z.iso.datetime(),
  card: storedCardSchema,
})
export interface DraftStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export type LoadDraftResult =
  | { status: 'empty' }
  | { status: 'restored'; card: CardConfig; savedAt: string }
  | { status: 'invalid' | 'unavailable' }

export function loadDraft(storage: DraftStorage): LoadDraftResult {
  let raw: string | null
  try {
    raw = storage.getItem(DRAFT_STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }
  if (raw === null) return { status: 'empty' }
  try {
    const result = draftEnvelopeSchema.safeParse(JSON.parse(raw))
    if (!result.success) return { status: 'invalid' }
    return {
      status: 'restored',
      card: result.data.card,
      savedAt: result.data.savedAt,
    }
  } catch {
    return { status: 'invalid' }
  }
}

export function saveDraft(storage: DraftStorage, card: CardConfig): boolean {
  const validated = cardSchema.safeParse(card)
  if (!validated.success) return false
  try {
    storage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        storageVersion: 1,
        savedAt: new Date().toISOString(),
        card: validated.data,
      }),
    )
    return true
  } catch {
    return false
  }
}

// Accessing localStorage itself can throw in restricted browser environments.
export const browserDraftStorage: DraftStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
}
