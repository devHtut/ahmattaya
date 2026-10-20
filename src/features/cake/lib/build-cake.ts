import * as THREE from 'three'
import { buildCreamStroke, buildCandle } from './build-decorations.ts'
import { flavorColors, type CakeRecipe } from '../../../shared/models/cake.ts'

export function disposeCake(group: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry)
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(material)
    }
    if (object instanceof THREE.InstancedMesh) object.dispose()
  })
  geometries.forEach((item) => item.dispose())
  materials.forEach((item) => item.dispose())
}
export function buildCake(recipe: CakeRecipe): THREE.Group {
  const group = new THREE.Group()
  group.name = 'procedural-cake'
  const material = (color: string, roughness = 0.72) =>
    new THREE.MeshStandardMaterial({ color, roughness })
  const sponge = material(flavorColors[recipe.flavor])
  const cream = material(recipe.creamColor)
  const accent = material(recipe.accentColor, 0.45)
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.62, 1.65, 0.09, 64),
    material('#f4eeee', 0.3),
  )
  plate.name = 'cake-plate'
  plate.position.y = -0.06
  plate.receiveShadow = true
  group.add(plate)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.4, 0.32, 32),
    material('#dfd7db', 0.35),
  )
  base.position.y = -0.26
  group.add(base)
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.74, 0.8, 0.07, 48),
    material('#f4eeee', 0.3),
  )
  foot.position.y = -0.45
  group.add(foot)
  const beadGeometry =
    recipe.decoration === 'pearls'
      ? new THREE.SphereGeometry(0.065, 10, 8)
      : null
  for (let tier = 0; tier < recipe.tiers; tier++) {
    const radius = [1.28, 0.94, 0.62][tier]
    const bottom = tier * 0.67
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.59, 64),
      sponge,
    )
    body.name = `tier-${tier + 1}`
    body.position.y = bottom + 0.295
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)
    const filling = new THREE.Mesh(
      new THREE.CylinderGeometry(radius + 0.007, radius + 0.007, 0.045, 64),
      cream,
    )
    filling.position.y = bottom + 0.28
    group.add(filling)
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(radius + 0.025, radius + 0.025, 0.11, 64),
      cream,
    )
    cap.position.y = bottom + 0.605
    cap.castShadow = true
    cap.receiveShadow = true
    group.add(cap)
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(radius + 0.015, 0.025, 8, 64),
      accent,
    )
    trim.rotation.x = Math.PI / 2
    trim.position.y = bottom + 0.03
    group.add(trim)
    if (beadGeometry) {
      const count = Math.round(radius * 34)
      const beads = new THREE.InstancedMesh(beadGeometry, accent, count)
      const matrix = new THREE.Matrix4()
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        matrix.makeTranslation(
          Math.cos(angle) * radius,
          bottom + 0.66,
          Math.sin(angle) * radius,
        )
        beads.setMatrixAt(i, matrix)
      }
      beads.instanceMatrix.needsUpdate = true
      beads.castShadow = true
      group.add(beads)
    }
  }
  if (recipe.decoration === 'berries') {
    const top = recipe.tiers * 0.67
    const radius = [1.28, 0.94, 0.62][recipe.tiers - 1]
    const geometry = new THREE.SphereGeometry(0.11, 16, 12)
    for (let i = 0; i < 7; i++) {
      const berry = new THREE.Mesh(geometry, accent)
      const angle = (i / 7) * Math.PI * 2
      berry.position.set(
        Math.cos(angle) * radius * 0.65,
        top + 0.09,
        Math.sin(angle) * radius * 0.65,
      )
      berry.scale.y = 1.25
      berry.castShadow = true
      group.add(berry)
    }
  }
  for (const stroke of recipe.strokes)
    group.add(buildCreamStroke(stroke, recipe))
  for (const candle of recipe.candles) group.add(buildCandle(candle, recipe))
  return group
}
