import * as THREE from 'three'
import type {
  CakeCandle,
  CakeRecipe,
  CreamStroke,
} from '../../../shared/models/cake.ts'
import { tierRadii } from './surface.ts'

export function buildCreamStroke(
  stroke: CreamStroke,
  recipe: CakeRecipe,
): THREE.Object3D {
  const radius = tierRadii[recipe.tiers - 1]
  const y = recipe.tiers * 0.67 + 0.015
  const points = stroke.points
    .filter(
      (point, index) =>
        index === 0 ||
        Math.hypot(
          point.x - stroke.points[index - 1].x,
          point.z - stroke.points[index - 1].z,
        ) > 1e-6,
    )
    .map((point) => new THREE.Vector3(point.x * radius, y, point.z * radius))
  const material = new THREE.MeshStandardMaterial({
    color: stroke.color,
    roughness: 0.48,
  })
  const size = (stroke.width * radius) / 2
  if (points.length === 1) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), material)
    dot.position.copy(points[0])
    return dot
  }
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal')
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      curve,
      Math.min(320, Math.max(12, points.length * 2)),
      size,
      6,
      false,
    ),
    material,
  )
  mesh.castShadow = true
  return mesh
}
function badgeShape(kind: 'heart' | 'star'): THREE.Shape {
  const shape = new THREE.Shape()
  if (kind === 'heart') {
    shape.moveTo(0, -0.12)
    shape.bezierCurveTo(-0.2, 0.02, -0.15, 0.2, 0, 0.1)
    shape.bezierCurveTo(0.15, 0.2, 0.2, 0.02, 0, -0.12)
  } else {
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + (i * Math.PI) / 5,
        radius = i % 2 ? 0.055 : 0.14
      if (i === 0)
        shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
      else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }
    shape.closePath()
  }
  return shape
}
export function buildCandle(
  candle: CakeCandle,
  recipe: CakeRecipe,
): THREE.Group {
  const group = new THREE.Group()
  group.name = `candle:${candle.id}`
  const radius = tierRadii[recipe.tiers - 1]
  group.position.set(
    candle.position.x * radius,
    recipe.tiers * 0.67,
    candle.position.z * radius,
  )
  const color = new THREE.MeshStandardMaterial({
    color: candle.color,
    roughness: 0.45,
  })
  const light = new THREE.MeshStandardMaterial({ color: '#fff4d9' })
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.34, 12),
    color,
  )
  stem.position.y = 0.17
  group.add(stem)
  let flameHeight = 0.41
  if (candle.design === 'spiral') {
    const points = Array.from({ length: 65 }, (_, i) => {
      const t = i / 64
      return new THREE.Vector3(
        Math.cos(t * Math.PI * 8) * 0.038,
        0.02 + t * 0.3,
        Math.sin(t * Math.PI * 8) * 0.038,
      )
    })
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          64,
          0.008,
          5,
          false,
        ),
        light,
      ),
    )
  }
  if (candle.design === 'heart' || candle.design === 'star') {
    const badge = new THREE.Mesh(
      new THREE.ExtrudeGeometry(badgeShape(candle.design), {
        depth: 0.035,
        bevelEnabled: true,
        bevelSize: 0.005,
        bevelThickness: 0.005,
        bevelSegments: 1,
        steps: 1,
      }),
      color,
    )
    badge.position.set(0, 0.3, 0)
    group.add(badge)
    flameHeight = 0.53
  }
  if (candle.design === 'number') {
    const digits = [
      'abcdef',
      'bc',
      'abdeg',
      'abcdg',
      'bcfg',
      'acdfg',
      'acdefg',
      'abc',
      'abcdefg',
      'abcdfg',
    ]
    const coordinates: Record<string, [number, number, boolean]> = {
      a: [0, 0.15, true],
      b: [0.075, 0.075, false],
      c: [0.075, -0.075, false],
      d: [0, -0.15, true],
      e: [-0.075, -0.075, false],
      f: [-0.075, 0.075, false],
      g: [0, 0, true],
    }
    for (const segment of digits[candle.digit]) {
      const [x, y, horizontal] = coordinates[segment]
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? 0.15 : 0.028,
          horizontal ? 0.028 : 0.15,
          0.04,
        ),
        color,
      )
      bar.position.set(x, y + 0.3, 0.025)
      group.add(bar)
    }
    flameHeight = 0.55
  }
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.045, 6),
    new THREE.MeshBasicMaterial({ color: '#3c2932' }),
  )
  wick.position.y = flameHeight - 0.035
  group.add(wick)
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 10, 10),
    new THREE.MeshBasicMaterial({ color: '#ffc66b' }),
  )
  flame.position.y = flameHeight + 0.015
  flame.scale.set(1, 1.8, 1)
  group.add(flame)
  group.traverse((item) => {
    item.userData.candleId = candle.id
    if (item instanceof THREE.Mesh) item.castShadow = true
  })
  return group
}
