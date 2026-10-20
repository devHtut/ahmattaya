import test from 'node:test'
import assert from 'node:assert/strict'
import {
  loadProjects,
  saveProjects,
  PROJECTS_KEY,
} from '../src/features/projects/project-storage.ts'
import { createCard } from '../src/shared/templates/templates.ts'
import {
  saveDraft,
  DRAFT_STORAGE_KEY,
} from '../src/features/creator/lib/draft-storage.ts'
function memory() {
  const data = new Map()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  }
}
test('legacy draft migrates without changing or removing its original data', () => {
  const storage = memory()
  const card = createCard('anniversary')
  card.message = 'Keep this memory'
  saveDraft(storage, card)
  const original = storage.getItem(DRAFT_STORAGE_KEY)
  const loaded = loadProjects(storage)
  assert.equal(loaded.status, 'restored')
  assert.deepEqual(loaded.library.projects[0].card, card)
  assert.equal(saveProjects(storage, loaded.library), true)
  assert.equal(storage.getItem(DRAFT_STORAGE_KEY), original)
  assert.deepEqual(loadProjects(storage), loaded)
})
test('multiple projects, active selection and recoverable trash survive roundtrip', () => {
  const storage = memory()
  const now = new Date().toISOString()
  const library = {
    version: 1,
    activeId: 'b',
    projects: [
      {
        id: 'a',
        name: 'First',
        updatedAt: now,
        deleted: true,
        card: createCard('birthday'),
      },
      {
        id: 'b',
        name: 'Second',
        updatedAt: now,
        deleted: false,
        card: createCard('anniversary'),
      },
    ],
  }
  assert.equal(saveProjects(storage, library), true)
  assert.deepEqual(loadProjects(storage).library, library)
  library.projects[0].deleted = false
  assert.equal(saveProjects(storage, library), true)
  assert.equal(loadProjects(storage).library.projects[0].deleted, false)
})
test('invalid or future libraries never fall back to an older draft', () => {
  const storage = memory()
  saveDraft(storage, createCard('birthday'))
  storage.setItem(PROJECTS_KEY, JSON.stringify({ version: 99 }))
  assert.equal(loadProjects(storage).status, 'invalid')
  assert.equal(storage.getItem(PROJECTS_KEY), '{"version":99}')
})
test('library rejects duplicate ids, missing active project and quota failures', () => {
  const p = {
    id: 'a',
    name: 'A',
    updatedAt: new Date().toISOString(),
    deleted: false,
    card: createCard('birthday'),
  }
  assert.equal(
    saveProjects(memory(), { version: 1, activeId: 'a', projects: [p, p] }),
    false,
  )
  assert.equal(
    saveProjects(memory(), { version: 1, activeId: 'missing', projects: [p] }),
    false,
  )
  assert.equal(
    saveProjects(
      {
        setItem() {
          throw Error('quota')
        },
      },
      { version: 1, activeId: 'a', projects: [p] },
    ),
    false,
  )
})
