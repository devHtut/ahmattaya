import test from 'node:test'
import assert from 'node:assert/strict'
import {
  templateCatalog,
  createTemplateCard,
} from '../src/shared/templates/catalog.ts'
import { cardSchema } from '../src/shared/models/card.ts'
import { occasions } from '../src/shared/templates/templates.ts'
import {
  saveProjects,
  loadProjects,
} from '../src/features/projects/project-storage.ts'

test('every starter is valid, covers each occasion and contains no device-local asset dependencies', () => {
  assert.equal(
    new Set(templateCatalog.map((item) => item.id)).size,
    templateCatalog.length,
  )
  assert.deepEqual(
    new Set(templateCatalog.map((item) => item.occasion)),
    new Set(occasions.map((item) => item.id)),
  )
  for (const template of templateCatalog) {
    const card = createTemplateCard(template.id)
    assert.equal(cardSchema.safeParse(card).success, true, template.id)
    assert.equal(card.occasion, template.occasion)
    assert.equal(card.background, null)
    assert.equal(card.music.custom, null)
    assert.deepEqual(card.photos, [])
    assert.equal(
      card.pages.every((page) => page.background === null),
      true,
    )
    assert.equal(card.senderName, '')
    assert.equal(card.receiverName, '')
  }
  assert.equal(createTemplateCard('missing'), undefined)
})
test('editing a starter does not change the catalog or another project from the same template', () => {
  for (const template of templateCatalog) {
    const first = createTemplateCard(template.id)
    const second = createTemplateCard(template.id)
    const original = structuredClone(second)
    first.appearance.colors.text = '#123456'
    first.opening.title = 'Changed'
    first.music.volume = 0.9
    first.cake.candles.push({
      id: 'extra',
      design: 'heart',
      digit: 0,
      color: '#123456',
      position: { x: 0, z: 0 },
    })
    if (first.pages[0]) first.pages[0].title = 'Changed page'
    first.pages.push({
      id: 'extra-page',
      title: 'Extra',
      message: 'Test',
      paper: 'blank',
      background: null,
    })
    assert.deepEqual(second, original)
    assert.deepEqual(createTemplateCard(template.id), original)
  }
})
test('template projects roundtrip beside an existing custom project without replacing its content', () => {
  const card = createTemplateCard('quiet-memories')
  card.message = 'Keep my existing personal message'
  const prior = {
    id: 'existing',
    name: 'My existing project',
    updatedAt: new Date().toISOString(),
    deleted: false,
    card,
  }
  const snapshot = structuredClone(prior)
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const projects = templateCatalog.map((template) => ({
    id: template.id,
    name: template.name,
    updatedAt: new Date().toISOString(),
    deleted: false,
    card: createTemplateCard(template.id),
  }))
  const library = {
    version: 1,
    activeId: projects[0].id,
    projects: [prior, ...projects],
  }
  assert.equal(saveProjects(storage, library), true)
  const restored = loadProjects(storage)
  assert.equal(restored.status, 'restored')
  assert.deepEqual(restored.library.projects[0], snapshot)
  assert.deepEqual(restored.library, library)
})
