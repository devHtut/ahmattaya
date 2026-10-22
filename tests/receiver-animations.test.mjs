import assert from 'node:assert/strict'
import test from 'node:test'
import { createCard } from '../src/shared/templates/templates.ts'
import { buildCake } from '../src/features/cake/lib/build-cake.ts'

test('candle flame mesh is named and can be toggled without mutating recipe', () => {
  const card = createCard('birthday')
  card.cake.enabled = true
  card.cake.candles = [
    {
      id: 'candle-1',
      design: 'classic',
      color: '#ff6b8b',
      digit: 1,
      position: { x: 0, z: 0 },
    },
    {
      id: 'candle-2',
      design: 'spiral',
      color: '#fbbf24',
      digit: 2,
      position: { x: 0.2, z: 0.1 },
    },
  ]

  const cakeGroup = buildCake(card.cake)
  const firstCandleId = card.cake.candles[0].id
  const candleObj = cakeGroup.getObjectByName(`candle:${firstCandleId}`)

  assert.ok(candleObj, 'candle object exists in 3D cake')
  const flame = candleObj.getObjectByName('flame')
  assert.ok(flame, 'candle flame object exists and is named flame')
  assert.equal(flame.visible, true, 'flame is initially visible')

  // Extinguishing flame hides it
  flame.visible = false
  assert.equal(flame.visible, false, 'flame can be extinguished')
})

test('every candle style has valid geometry and named toggleable flame', () => {
  const designs = ['classic', 'spiral', 'heart', 'star', 'number']
  const card = createCard('birthday')
  card.cake.enabled = true
  card.cake.candles = designs.map((design, i) => ({
    id: `c-${i}`,
    design,
    color: '#ff6b8b',
    digit: (i % 9) + 1,
    position: { x: (i - 2) * 0.15, z: 0 },
  }))

  const cakeGroup = buildCake(card.cake)
  for (const candle of card.cake.candles) {
    const obj = cakeGroup.getObjectByName(`candle:${candle.id}`)
    assert.ok(obj, `candle object exists for design ${candle.design}`)
    const flame = obj.getObjectByName('flame')
    assert.ok(flame, `flame exists for design ${candle.design}`)
    assert.equal(flame.visible, true)
    flame.visible = false
    assert.equal(flame.visible, false)
  }
})

test('toggle candle extinguishing set tracks state properly', () => {
  const candleIds = ['c1', 'c2', 'c3']
  let extinguished = []

  const toggle = (id) => {
    extinguished = extinguished.includes(id)
      ? extinguished.filter((item) => item !== id)
      : [...extinguished, id]
  }

  toggle('c1')
  assert.deepEqual(extinguished, ['c1'])
  toggle('c2')
  assert.deepEqual(extinguished, ['c1', 'c2'])
  toggle('c1')
  assert.deepEqual(extinguished, ['c2'])

  // Extinguishing all
  extinguished = [...candleIds]
  assert.equal(
    candleIds.every((id) => extinguished.includes(id)),
    true,
  )
})
