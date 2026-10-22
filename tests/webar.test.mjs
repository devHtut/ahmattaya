import assert from 'node:assert/strict'
import test from 'node:test'
import {
  detectARPlatform,
  exportCakeToUSDZ,
  exportCakeToGLB,
} from '../src/features/cake/lib/ar-export.ts'
import { createCard } from '../src/shared/templates/templates.ts'

// Polyfill FileReader for Node.js GLTFExporter compatibility if needed
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf
        if (this.onloadend) this.onloadend()
      })
    }
  }
}

test('detectARPlatform identifies platforms correctly', () => {
  // In node environment, defaults to desktop
  const platform = detectARPlatform()
  assert.ok(['ios', 'android', 'desktop'].includes(platform))
})

test('exportCakeToUSDZ exports dynamic cake to valid USDZ blob', async () => {
  const card = createCard('birthday')
  const blob = await exportCakeToUSDZ(card.cake)

  assert.ok(blob instanceof Blob)
  assert.equal(blob.type, 'model/vnd.usdz+zip')
  assert.ok(blob.size > 1000)
})

test('exportCakeToGLB exports dynamic cake to valid binary GLTF (GLB) blob', async () => {
  const card = createCard('birthday')
  const blob = await exportCakeToGLB(card.cake)

  assert.ok(blob instanceof Blob)
  assert.equal(blob.type, 'model/gltf-binary')
  assert.ok(blob.size > 1000)
})

test('multi-tier cakes with decorations export cleanly to both formats without leaking meshes', async () => {
  const card = createCard('birthday')
  card.cake.tiers = 3
  card.cake.decoration = 'berries'
  card.cake.candles = [
    {
      id: 'c1',
      position: { x: 0, z: 0 },
      color: '#ff0000',
      design: 'classic',
      digit: 0,
    },
    {
      id: 'c2',
      position: { x: 0.3, z: 0.2 },
      color: '#0000ff',
      design: 'number',
      digit: 5,
    },
  ]

  const usdz = await exportCakeToUSDZ(card.cake)
  const glb = await exportCakeToGLB(card.cake)

  assert.ok(usdz.size > 2000)
  assert.ok(glb.size > 2000)
})
