import * as THREE from 'three'
import type { CakeRecipe } from '../../../shared/models/cake.ts'
import { buildCake, disposeCake } from './build-cake.ts'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'

export type ARPlatform = 'ios' | 'android' | 'desktop'

export function detectARPlatform(): ARPlatform {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

/**
 * Scale factor to convert the ~3.3m procedural cake units into realistic tabletop size (~33cm).
 */
export const AR_CAKE_SCALE = 0.1

/**
 * Prepares the cake hierarchy for AR:
 * 1. Shifts the cake up so the stand foot rests exactly at y = 0 (detected table surface).
 * 2. Scales the cake to realistic life-size tabletop dimensions (~33cm diameter).
 * 3. Updates all matrices and world matrices for reliable export across USDZ & GLTF.
 */
export function buildCakeForAR(recipe: CakeRecipe): THREE.Group {
  const cake = buildCake(recipe)
  // Cake foot bottom is at y = -0.485; lift cake up by 0.485 so the base touches y = 0
  cake.position.y = 0.485

  const arRoot = new THREE.Group()
  arRoot.name = 'ar-cake'
  arRoot.add(cake)

  arRoot.scale.set(AR_CAKE_SCALE, AR_CAKE_SCALE, AR_CAKE_SCALE)
  arRoot.updateMatrixWorld(true)

  return arRoot
}

/**
 * Exports the 3D Cake into Apple's USDZ format for iOS AR Quick Look.
 */
export async function exportCakeToUSDZ(recipe: CakeRecipe): Promise<Blob> {
  const group = buildCakeForAR(recipe)
  try {
    const exporter = new USDZExporter()
    const arrayBuffer = await exporter.parseAsync(group)
    return new Blob([arrayBuffer], { type: 'model/vnd.usdz+zip' })
  } finally {
    disposeCake(group)
  }
}

/**
 * Exports the 3D Cake into standard binary GLTF (.glb) for Android Scene Viewer and 3D web engines.
 */
export async function exportCakeToGLB(recipe: CakeRecipe): Promise<Blob> {
  const group = buildCakeForAR(recipe)
  try {
    const exporter = new GLTFExporter()
    return await new Promise<Blob>((resolve, reject) => {
      exporter.parse(
        group,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(new Blob([result], { type: 'model/gltf-binary' }))
          } else {
            const jsonString = JSON.stringify(result)
            resolve(new Blob([jsonString], { type: 'model/gltf+json' }))
          }
        },
        (error) => reject(error),
        { binary: true },
      )
    })
  } finally {
    disposeCake(group)
  }
}

/**
 * Launches native AR Quick Look on iOS devices using an in-memory USDZ blob.
 */
export function triggerIOSQuickLook(
  usdzBlob: Blob,
  filename = 'cake.usdz',
): void {
  const url = URL.createObjectURL(usdzBlob)
  const anchor = document.createElement('a')
  anchor.setAttribute('rel', 'ar')
  anchor.setAttribute('href', url)
  anchor.setAttribute('download', filename)

  // iOS AR Quick Look specification requires an <img> child element inside the anchor
  const img = document.createElement('img')
  img.alt = 'Cake 3D AR'
  img.style.display = 'none'
  anchor.appendChild(img)

  document.body.appendChild(anchor)
  anchor.click()

  setTimeout(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, 120000)
}

/**
 * Downloads the GLB or triggers Android 3D/AR viewing.
 */
export function triggerGLBDownload(glbBlob: Blob, filename = 'cake.glb'): void {
  const url = URL.createObjectURL(glbBlob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()

  setTimeout(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, 60000)
}
