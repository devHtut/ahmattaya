import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { cakeSchema, createCake } from '../src/shared/models/cake.ts'
import {
  cakeFromPreset,
  cakePresets,
} from '../src/features/cake/lib/presets.ts'
import { buildCake, disposeCake } from '../src/features/cake/lib/build-cake.ts'
import { createCard } from '../src/shared/templates/templates.ts'
import {
  loadDraft,
  saveDraft,
} from '../src/features/creator/lib/draft-storage.ts'

test('cake is optional and all presets/blank recipes are valid independent values', () => {
  assert.equal(createCake().enabled, false)
  for (const id of [...cakePresets.map((item) => item.id), 'blank']) {
    const recipe = cakeFromPreset(id)
    assert.equal(cakeSchema.safeParse(recipe).success, true)
    recipe.creamColor = '#000000'
    assert.notEqual(cakeFromPreset(id).creamColor, '#000000')
  }
})
test('invalid flavors, tier counts, colors and decorations are rejected', () => {
  for (const change of [
    { flavor: 'unknown' },
    { tiers: 0 },
    { tiers: 4 },
    { tiers: 1.5 },
    { creamColor: 'url(x)' },
    { decoration: 'unknown' },
    { enabled: 'yes' },
  ])
    assert.equal(
      cakeSchema.safeParse({ ...createCake(), ...change }).success,
      false,
    )
})
test('every flavor/tier/decor combination builds finite geometry with correct tier count', () => {
  for (const flavor of ['vanilla', 'chocolate', 'strawberry'])
    for (const tiers of [1, 2, 3])
      for (const decoration of ['plain', 'pearls', 'berries']) {
        const group = buildCake({
          ...createCake(),
          enabled: true,
          flavor,
          tiers,
          decoration,
        })
        let actualTiers = 0
        group.traverse((item) => {
          if (item.name.startsWith('tier-')) actualTiers++
          if (item instanceof THREE.Mesh) {
            item.geometry.computeBoundingSphere()
            assert.ok(Number.isFinite(item.geometry.boundingSphere.radius))
          }
        })
        assert.equal(actualTiers, tiers)
        const box = new THREE.Box3().setFromObject(group)
        assert.ok(box.max.y > tiers * 0.6)
        disposeCake(group)
      }
})
test('cleanup disposes every shared geometry/material exactly once', () => {
  const group = buildCake(createCake())
  const resources = new Map()
  group.traverse((item) => {
    if (item instanceof THREE.Mesh) {
      for (const resource of [
        item.geometry,
        ...(Array.isArray(item.material) ? item.material : [item.material]),
      ]) {
        if (!resources.has(resource)) {
          resources.set(resource, 0)
          resource.addEventListener('dispose', () =>
            resources.set(resource, resources.get(resource) + 1),
          )
        }
      }
    }
  })
  disposeCake(group)
  assert.ok(resources.size > 5)
  for (const count of resources.values()) assert.equal(count, 1)
})
test('v6 migration preserves content and introduces a disabled cake; recipes round-trip', () => {
  const { cake: _cake, ...old } = createCard('birthday')
  let raw = JSON.stringify({
    storageVersion: 1,
    savedAt: '2026-10-20T00:00:00.000Z',
    card: { ...old, schemaVersion: 6 },
  })
  const original = raw
  const storage = {
    getItem: () => raw,
    setItem: (_key, value) => {
      raw = value
    },
  }
  const loaded = loadDraft(storage)
  assert.equal(loaded.status, 'restored')
  assert.equal(loaded.card.cake.enabled, false)
  assert.equal(loaded.card.schemaVersion, 10)
  assert.equal(raw, original)
  loaded.card.cake = {
    ...cakeFromPreset('strawberry-blush'),
    creamColor: '#c5abe8',
  }
  assert.equal(saveDraft(storage, loaded.card), true)
  assert.deepEqual(loadDraft(storage).card.cake, loaded.card.cake)
})
test('cake placement supports end, cover and page ids and rejects oversized strings', () => {
  const cake = createCake()
  assert.equal(
    cakeSchema.safeParse({ ...cake, placement: 'end' }).success,
    true,
  )
  assert.equal(
    cakeSchema.safeParse({ ...cake, placement: 'cover' }).success,
    true,
  )
  assert.equal(
    cakeSchema.safeParse({ ...cake, placement: 'page-123' }).success,
    true,
  )
  assert.equal(
    cakeSchema.safeParse({ ...cake, placement: undefined }).success,
    true,
  )
  assert.equal(
    cakeSchema.safeParse({ ...cake, placement: 'x'.repeat(81) }).success,
    false,
  )
})
