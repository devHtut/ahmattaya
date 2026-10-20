import test from 'node:test'
import assert from 'node:assert/strict'
import {
  backgroundSchema,
  createBackground,
} from '../src/shared/models/background.ts'
import { cardSchema } from '../src/shared/models/card.ts'
import { createCard } from '../src/shared/templates/templates.ts'
import { createPage, removePage } from '../src/features/creator/lib/pages.ts'
import { setPageBackground } from '../src/features/creator/lib/backgrounds.ts'
import {
  loadProjects,
  saveProjects,
  PROJECTS_KEY,
} from '../src/features/projects/project-storage.ts'
import { saveImageAsset } from '../src/shared/media/image-assets.ts'
const id = 'a'.repeat(64)
function memory() {
  const data = new Map()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  }
}
test('background validates local asset identity and finite bounded settings', () => {
  const background = createBackground(id)
  assert.equal(backgroundSchema.safeParse(background).success, true)
  for (const change of [
    { assetId: 'https://example.com/image.png' },
    { zoom: 0 },
    { zoom: 4 },
    { opacity: NaN },
    { opacity: 2 },
    { positionX: -1 },
    { positionY: 101 },
    { overlayOpacity: Infinity },
    { overlayColor: 'red' },
  ])
    assert.equal(
      backgroundSchema.safeParse({ ...background, ...change }).success,
      false,
    )
})
test('cover and each extra page keep independent backgrounds and removal does not touch other pages', () => {
  let card = createCard('birthday')
  card.pages = [createPage('one'), createPage('two')]
  card = setPageBackground(card, 'cover', createBackground(id))
  card = setPageBackground(card, 'one', {
    ...createBackground('b'.repeat(64)),
    positionX: 25,
    overlayOpacity: 0.7,
  })
  assert.equal(card.pages[1].background, null)
  assert.equal(card.background.positionX, 50)
  const cleared = setPageBackground(card, 'one', null)
  assert.equal(cleared.pages[0].background, null)
  assert.deepEqual(cleared.background, card.background)
  assert.equal(removePage(card, 'one').background.assetId, id)
  assert.equal(cardSchema.safeParse(card).success, true)
})
test('v8 project libraries acquire empty backgrounds without overwriting originals', () => {
  const storage = memory()
  const card = createCard('birthday')
  delete card.background
  card.schemaVersion = 8
  card.pages = [
    { id: 'old', title: 'Keep me', message: 'Older page', paper: 'lined' },
  ]
  const library = {
    version: 1,
    activeId: 'p',
    projects: [
      {
        id: 'p',
        name: 'Original',
        updatedAt: new Date().toISOString(),
        deleted: false,
        card,
      },
    ],
  }
  const raw = JSON.stringify(library)
  storage.setItem(PROJECTS_KEY, raw)
  const loaded = loadProjects(storage)
  assert.equal(loaded.status, 'restored')
  assert.equal(loaded.library.projects[0].card.schemaVersion, 9)
  assert.equal(loaded.library.projects[0].card.background, null)
  assert.equal(loaded.library.projects[0].card.pages[0].background, null)
  assert.equal(storage.getItem(PROJECTS_KEY), raw)
})
test('duplicated project metadata shares immutable image identities and roundtrips settings without embedded bytes', () => {
  const card = setPageBackground(createCard('anniversary'), 'cover', {
    ...createBackground(id),
    zoom: 1.5,
    positionY: 20,
    opacity: 0.8,
  })
  const project = {
    id: 'one',
    name: 'First',
    updatedAt: new Date().toISOString(),
    deleted: false,
    card,
  }
  const library = {
    version: 1,
    activeId: 'two',
    projects: [project, { ...project, id: 'two', card: structuredClone(card) }],
  }
  const storage = memory()
  assert.equal(saveProjects(storage, library), true)
  assert.deepEqual(loadProjects(storage).library, library)
  assert.equal(storage.getItem(PROJECTS_KEY).includes('data:image'), false)
})
test('asset writer rejects unsupported data and oversized images before opening storage', async () => {
  await assert.rejects(saveImageAsset('data:image/svg+xml;base64,YWJj'))
  await assert.rejects(saveImageAsset('https://example.com/image.png'))
  await assert.rejects(
    saveImageAsset(
      'data:image/png;base64,' + Buffer.alloc(201 * 1024).toString('base64'),
    ),
  )
})
