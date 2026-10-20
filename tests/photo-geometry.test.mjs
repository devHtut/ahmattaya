import assert from 'node:assert/strict'
import test from 'node:test'
import {
  constrainFrame,
  defaultPhotoFrame,
  normalizeAngle,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  resizeFrame,
} from '../src/shared/lib/photo-geometry.ts'
import { cardSchema } from '../src/shared/models/card.ts'
import { createCard } from '../src/shared/templates/templates.ts'

test('rotated photo bounds stay inside the page for wide and tall images', () => {
  for (const ratio of [0.2, 0.5, 1, 4 / 3, 5]) {
    for (const rotation of [-180, -95, -45, 0, 45, 95, 180]) {
      const frame = constrainFrame({
        ...defaultPhotoFrame(0),
        x: -200,
        y: 300,
        width: 100,
        ratio,
        rotation,
      })
      const angle = (rotation * Math.PI) / 180
      const width = (frame.width / 100) * PAGE_WIDTH
      const height = width / ratio
      const halfW =
        (Math.abs(Math.cos(angle)) * width +
          Math.abs(Math.sin(angle)) * height) /
        2
      const halfH =
        (Math.abs(Math.sin(angle)) * width +
          Math.abs(Math.cos(angle)) * height) /
        2
      const x = (frame.x / 100) * PAGE_WIDTH,
        y = (frame.y / 100) * PAGE_HEIGHT
      assert.ok(x - halfW >= -1e-8 && x + halfW <= PAGE_WIDTH + 1e-8)
      assert.ok(y - halfH >= -1e-8 && y + halfH <= PAGE_HEIGHT + 1e-8)
      assert.ok(frame.width >= 10 && frame.width <= 85)
    }
  }
})
test('resize preserves photo ratio and does not flip through the minimum size', () => {
  const frame = { ...defaultPhotoFrame(0), rotation: 0, x: 50, y: 50 }
  const resized = resizeFrame(
    frame,
    (frame.width / 100) * PAGE_WIDTH,
    ((frame.width / 100) * PAGE_WIDTH) / frame.ratio,
  )
  assert.ok(resized.width > frame.width)
  assert.equal(resized.ratio, frame.ratio)
  assert.equal(resizeFrame(frame, -100, -100).width, 10)
})
test('angles normalize across the +/-180 degree boundary', () => {
  assert.equal(normalizeAngle(190), -170)
  assert.equal(normalizeAngle(-190), 170)
})
test('rejects invalid spatial settings in saved cards', () => {
  const card = createCard('birthday')
  const photo = {
    id: 'p',
    pageId: 'cover',
    src: 'data:image/webp;base64,YWJj',
    caption: '',
    frame: defaultPhotoFrame(0),
  }
  for (const change of [
    { x: NaN },
    { width: 0 },
    { rotation: 181 },
    { ratio: 0 },
    { shadow: 'true' },
  ]) {
    assert.equal(
      cardSchema.safeParse({
        ...card,
        photos: [{ ...photo, frame: { ...photo.frame, ...change } }],
      }).success,
      false,
    )
  }
})
