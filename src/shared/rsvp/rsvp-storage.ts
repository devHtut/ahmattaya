export interface RsvpResponse {
  id: string
  cardId: string
  guestName: string
  attending: boolean
  guestCount: number
  phone?: string
  notes?: string
  wishes?: string
  createdAt: string
}

export interface SimpleStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const memoryMap = new Map<string, string>()

export const memoryStorage: SimpleStorage = {
  getItem: (k: string) => memoryMap.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memoryMap.set(k, v)
  },
  removeItem: (k: string) => {
    memoryMap.delete(k)
  },
}

export function getStorage(): SimpleStorage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // restricted storage fallback
  }
  try {
    if (
      typeof globalThis !== 'undefined' &&
      'localStorage' in globalThis &&
      globalThis.localStorage
    ) {
      return globalThis.localStorage as SimpleStorage
    }
  } catch {
    // fallback
  }
  return memoryStorage
}

const STORAGE_PREFIX = 'ahmattaya_rsvp:'

function storageKey(cardId: string): string {
  return `${STORAGE_PREFIX}${cardId}`
}

export function listRsvpResponses(
  cardId: string,
  storage: SimpleStorage = getStorage(),
): RsvpResponse[] {
  try {
    const raw = storage.getItem(storageKey(cardId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRsvpResponse(
  cardId: string,
  input: Omit<RsvpResponse, 'id' | 'cardId' | 'createdAt'>,
  storage: SimpleStorage = getStorage(),
): RsvpResponse {
  const existing = listRsvpResponses(cardId, storage)
  const wishesOrNotes = input.wishes?.trim() || input.notes?.trim() || undefined
  const item: RsvpResponse = {
    id: crypto.randomUUID(),
    cardId,
    guestName: input.guestName.trim(),
    attending: input.attending,
    guestCount: input.attending
      ? Math.max(1, Math.min(20, input.guestCount || 1))
      : 0,
    phone: input.phone?.trim() || undefined,
    notes: wishesOrNotes,
    wishes: wishesOrNotes,
    createdAt: new Date().toISOString(),
  }

  const updated = [item, ...existing]
  try {
    storage.setItem(storageKey(cardId), JSON.stringify(updated))
  } catch {
    // Ignore quota errors gracefully
  }
  return item
}

export function deleteRsvpResponse(
  cardId: string,
  id: string,
  storage: SimpleStorage = getStorage(),
): boolean {
  const existing = listRsvpResponses(cardId, storage)
  const updated = existing.filter((item) => item.id !== id)
  try {
    storage.setItem(storageKey(cardId), JSON.stringify(updated))
    return true
  } catch {
    return false
  }
}

export function clearRsvpResponses(
  cardId: string,
  storage: SimpleStorage = getStorage(),
): void {
  try {
    storage.removeItem(storageKey(cardId))
  } catch {
    // Ignore storage errors gracefully
  }
}

export function exportRsvpCsv(responses: RsvpResponse[]): string {
  const headers = [
    'ဧည့်သည်အမည်',
    'တက်ရောက်မှု',
    'လူဦးရေ',
    'ဖုန်း',
    'ဆုမွန်စကား',
    'ရက်စွဲ',
  ]
  const rows = responses.map((r) => [
    `"${r.guestName.replace(/"/g, '""')}"`,
    r.attending ? '"တက်ရောက်ပါမည်"' : '"မတက်ရောက်နိုင်ပါ"',
    r.guestCount,
    `"${(r.phone || '').replace(/"/g, '""')}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
    `"${new Date(r.createdAt).toISOString()}"`,
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}
