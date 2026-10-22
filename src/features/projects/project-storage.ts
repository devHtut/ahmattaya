import { z } from 'zod'
import {
  cloudReceiptSchema,
  receiptFor,
  type CloudDraft,
  type CloudReceipt,
} from '../../shared/cloud/drafts.ts'
import {
  loadDraft,
  storedCardSchema,
  type DraftStorage,
} from '../creator/lib/draft-storage.ts'

export const PROJECTS_KEY = 'ahmattaya.projects'
export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  updatedAt: z.iso.datetime(),
  deleted: z.boolean().default(false),
  card: storedCardSchema,
  cloud: cloudReceiptSchema.optional(),
})
export type Project = z.infer<typeof projectSchema>
export const librarySchema = z
  .object({
    version: z.literal(1),
    activeId: z.string(),
    projects: z
      .array(projectSchema)
      .refine((items) => new Set(items.map((p) => p.id)).size === items.length),
  })
  .refine((data) =>
    data.projects.some((p) => p.id === data.activeId && !p.deleted),
  )
export type Library = z.infer<typeof librarySchema>
export function attachCloudReceipt(
  library: Library,
  id: string,
  receipt: CloudReceipt,
): Library {
  return {
    ...library,
    projects: library.projects.map((p) =>
      p.id === id ? { ...p, cloud: cloudReceiptSchema.parse(receipt) } : p,
    ),
  }
}
export function cloudProjectCopy(row: CloudDraft): Project {
  return projectSchema.parse({
    id: crypto.randomUUID(),
    name: row.name,
    updatedAt: new Date().toISOString(),
    deleted: false,
    card: structuredClone(row.card),
    cloud: receiptFor(row),
  })
}
export function loadProjects(
  storage: DraftStorage,
):
  | { status: 'restored'; library: Library }
  | { status: 'empty' | 'invalid' | 'unavailable' } {
  let raw: string | null
  try {
    raw = storage.getItem(PROJECTS_KEY)
  } catch {
    return { status: 'unavailable' }
  }
  if (raw !== null) {
    try {
      const parsed = librarySchema.safeParse(JSON.parse(raw))
      return parsed.success
        ? { status: 'restored', library: parsed.data }
        : { status: 'invalid' }
    } catch {
      return { status: 'invalid' }
    }
  }
  const legacy = loadDraft(storage)
  if (legacy.status !== 'restored') return legacy
  const project: Project = {
    id: crypto.randomUUID(),
    name: 'ကျွန်တော့် အမှတ်တရ',
    updatedAt: legacy.savedAt,
    deleted: false,
    card: legacy.card,
  }
  return {
    status: 'restored',
    library: { version: 1, activeId: project.id, projects: [project] },
  }
}
export function saveProjects(storage: DraftStorage, library: Library): boolean {
  const parsed = librarySchema.safeParse(library)
  if (!parsed.success) return false
  try {
    storage.setItem(PROJECTS_KEY, JSON.stringify(parsed.data))
    return true
  } catch {
    return false
  }
}
