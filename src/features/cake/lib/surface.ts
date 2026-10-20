import {
  SURFACE_LIMIT,
  MAX_STROKE_POINTS,
  type CakePoint,
} from '../../../shared/models/cake.ts'
export const tierRadii = [1.28, 0.94, 0.62] as const
export function insideSurface(point: CakePoint): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.z) &&
    point.x ** 2 + point.z ** 2 <= SURFACE_LIMIT ** 2
  )
}
export function constrainPoint(point: CakePoint): CakePoint {
  const length = Math.hypot(point.x, point.z)
  if (length <= SURFACE_LIMIT) return { ...point }
  return {
    x: (point.x / length) * SURFACE_LIMIT,
    z: (point.z / length) * SURFACE_LIMIT,
  }
}
export function appendPoint(
  points: CakePoint[],
  point: CakePoint,
): CakePoint[] {
  if (!insideSurface(point) || points.length >= MAX_STROKE_POINTS) return points
  const last = points[points.length - 1]
  if (last && Math.hypot(last.x - point.x, last.z - point.z) < 0.012)
    return points
  return [...points, { ...point }]
}
