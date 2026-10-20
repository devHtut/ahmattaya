import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import {
  cakeSchema,
  createCake,
  MAX_CANDLES,
  MAX_CREAM_STROKES,
  MAX_STROKE_POINTS,
} from '../src/shared/models/cake.ts'
import {
  appendPoint,
  constrainPoint,
  insideSurface,
} from '../src/features/cake/lib/surface.ts'
import { buildCake, disposeCake } from '../src/features/cake/lib/build-cake.ts'
import { createCard } from '../src/shared/templates/templates.ts'
import {
  loadDraft,
  saveDraft,
} from '../src/features/creator/lib/draft-storage.ts'
import { cakeFromPreset } from '../src/features/cake/lib/presets.ts'

const stroke = {
  id: 's',
  color: '#e8548b',
  width: 0.04,
  points: [
    { x: -0.3, z: 0 },
    { x: 0, z: 0.2 },
    { x: 0.3, z: 0 },
  ],
}
const candle = {
  id: 'c',
  design: 'classic',
  color: '#8b5cf6',
  digit: 2,
  position: { x: 0.2, z: 0.3 },
}

test('surface limits are circular and stroke sampling is bounded', () => {
  assert.equal(insideSurface({ x: 0.7, z: 0.7 }), false)
  const point = constrainPoint({ x: 1, z: 1 })
  assert.ok(
    insideSurface(point) ||
      Math.abs(Math.hypot(point.x, point.z) - 0.84) < 1e-10,
  )
  let points = []
  for (let i = 0; i < 500; i++)
    points = appendPoint(points, { x: i % 2 ? 0.3 : -0.3, z: 0 })
  assert.equal(points.length, MAX_STROKE_POINTS)
  assert.equal(appendPoint(points, { x: 100, z: 100 }), points)
  const first = [{ x: 0, z: 0 }]
  assert.equal(appendPoint(first, { x: 0.001, z: 0 }), first)
})
test('recipe validation rejects unbounded drawing/candles and invalid locations', () => {
  const recipe = createCake()
  for (const change of [
    { strokes: [{ ...stroke, points: [] }] },
    {
      strokes: [
        {
          ...stroke,
          points: Array.from({ length: MAX_STROKE_POINTS + 1 }, () => ({
            x: 0,
            z: 0,
          })),
        },
      ],
    },
    { strokes: [{ ...stroke, points: [{ x: 0.8, z: 0.8 }] }] },
    { strokes: [{ ...stroke, width: 0 }] },
    { candles: [{ ...candle, digit: 10 }] },
    { candles: [{ ...candle, position: { x: NaN, z: 0 } }] },
    { candles: [candle, candle] },
    {
      strokes: Array.from({ length: MAX_CREAM_STROKES + 1 }, (_, i) => ({
        ...stroke,
        id: `s${i}`,
      })),
    },
    {
      candles: Array.from({ length: MAX_CANDLES + 1 }, (_, i) => ({
        ...candle,
        id: `c${i}`,
      })),
    },
  ])
    assert.equal(cakeSchema.safeParse({ ...recipe, ...change }).success, false)
})
test('every candle style/digit and both dot/line cream build finite geometry', () => {
  for (const design of ['classic', 'spiral', 'heart', 'star', 'number'])
    for (const digit of design === 'number'
      ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      : [0]) {
      const recipe = {
        ...createCake(),
        enabled: true,
        strokes: [stroke, { ...stroke, id: 'dot', points: [{ x: 0, z: 0 }] }],
        candles: [{ ...candle, design, digit }],
      }
      const cake = buildCake(recipe)
      assert.ok(cake.getObjectByName('candle:c'))
      cake.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          item.geometry.computeBoundingSphere()
          assert.ok(Number.isFinite(item.geometry.boundingSphere.radius))
        }
      })
      disposeCake(cake)
    }
})
test('v7 migration retains the base recipe and decorations round-trip after editing', () => {
  const { cake: _cake, ...old } = createCard('birthday')
  const { strokes: _strokes, candles: _candles, ...base } = createCake()
  const card = {
    ...old,
    schemaVersion: 7,
    cake: { ...base, enabled: true, flavor: 'chocolate' },
  }
  let raw = JSON.stringify({
    storageVersion: 1,
    savedAt: '2026-10-20T00:00:00.000Z',
    card,
  })
  const original = raw,
    storage = {
      getItem: () => raw,
      setItem: (_key, value) => {
        raw = value
      },
    }
  const loaded = loadDraft(storage)
  assert.equal(loaded.status, 'restored')
  assert.equal(loaded.card.cake.flavor, 'chocolate')
  assert.deepEqual(loaded.card.cake.strokes, [])
  assert.deepEqual(loaded.card.cake.candles, [])
  assert.equal(raw, original)
  loaded.card.cake.strokes = [stroke]
  loaded.card.cake.candles = [candle]
  assert.equal(saveDraft(storage, loaded.card), true)
  assert.deepEqual(loadDraft(storage).card.cake, loaded.card.cake)
})
test('starter recipes have independent decoration arrays', () => {
  const first = cakeFromPreset('vanilla-cloud')
  first.strokes.push(stroke)
  first.candles.push(candle)
  const second = cakeFromPreset('vanilla-cloud')
  assert.deepEqual(second.strokes, [])
  assert.deepEqual(second.candles, [])
})
