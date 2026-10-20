import { useRef, useState, type PointerEvent } from 'react'
import {
  MAX_CREAM_STROKES,
  type CakePoint,
  type CakeRecipe,
} from '../../../shared/models/cake'
import type { CakeEditorSession } from '../lib/useCakeEditor'
import { appendPoint, insideSurface } from '../lib/surface'

export function CakeTopPad({
  recipe,
  editor,
}: {
  recipe: CakeRecipe
  editor: CakeEditorSession
}) {
  const gesture = useRef<{
    pointer: number
    points: CakePoint[]
    id?: string
  } | null>(null)
  const [live, setLive] = useState<CakePoint[]>([])
  const [moving, setMoving] = useState<{ id: string; point: CakePoint } | null>(
    null,
  )
  function pointAt(event: PointerEvent<SVGSVGElement>): CakePoint | null {
    const rect = event.currentTarget.getBoundingClientRect()
    const point = {
      x: (((event.clientX - rect.left) / rect.width) * 200 - 100) / 90,
      z: (((event.clientY - rect.top) / rect.height) * 200 - 100) / 90,
    }
    return insideSurface(point) ? point : null
  }
  function cancel() {
    gesture.current = null
    setLive([])
    setMoving(null)
  }
  function finish(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current
    if (!current || current.pointer !== event.pointerId) return
    const point = pointAt(event) ?? current.points.at(-1)!
    if (editor.tools.mode === 'cream')
      editor.actions.onStroke({
        id: crypto.randomUUID(),
        color: editor.tools.brushColor,
        width: editor.tools.brushWidth,
        points: current.points,
      })
    else if (current.id) editor.actions.onMoveCandle(current.id, point)
    else editor.actions.onAddCandle(point)
    cancel()
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return (
    <div className="cake-top-pad">
      <p className="field-hint">
        အပေါ်မျက်နှာပြင် Pad — ဒီနေရာမှာလည်း ဆွဲ/စိုက်နိုင်ပါတယ်။
      </p>
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label="Cream ဆွဲရန်နှင့် Candle စိုက်ရန် အပေါ်မျက်နှာပြင်"
        onPointerDown={(event) => {
          if (
            editor.tools.mode === 'cream' &&
            recipe.strokes.length >= MAX_CREAM_STROKES
          )
            return
          if (!event.isPrimary || event.button !== 0 || gesture.current) return
          const point = pointAt(event)
          if (!point) return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          const target = event.target as Element
          const id =
            editor.tools.mode === 'candles'
              ? (target
                  .closest('[data-candle-id]')
                  ?.getAttribute('data-candle-id') ?? undefined)
              : undefined
          editor.actions.onSelectCandle(id ?? null)
          gesture.current = { pointer: event.pointerId, points: [point], id }
          if (editor.tools.mode === 'cream') setLive([point])
        }}
        onPointerMove={(event) => {
          const current = gesture.current
          if (!current || current.pointer !== event.pointerId) return
          const point = pointAt(event)
          if (!point) return
          if (editor.tools.mode === 'cream') {
            current.points = appendPoint(current.points, point)
            setLive(current.points)
          } else {
            current.points = [point]
            if (current.id) setMoving({ id: current.id, point })
          }
        }}
        onPointerUp={finish}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          fill={recipe.creamColor}
          stroke={recipe.accentColor}
          strokeWidth="3"
        />
        <circle
          cx="100"
          cy="100"
          r="75.6"
          fill="none"
          stroke="#8b5cf650"
          strokeDasharray="3 4"
        />
        {recipe.strokes.map((stroke) =>
          stroke.points.length === 1 ? (
            <circle
              key={stroke.id}
              cx={100 + stroke.points[0].x * 90}
              cy={100 + stroke.points[0].z * 90}
              r={stroke.width * 45}
              fill={stroke.color}
            />
          ) : (
            <polyline
              key={stroke.id}
              points={stroke.points
                .map((point) => `${100 + point.x * 90},${100 + point.z * 90}`)
                .join(' ')}
              stroke={stroke.color}
              strokeWidth={stroke.width * 90}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ),
        )}
        {live.length > 0 && (
          <polyline
            points={live
              .map((point) => `${100 + point.x * 90},${100 + point.z * 90}`)
              .join(' ')}
            stroke={editor.tools.brushColor}
            strokeWidth={editor.tools.brushWidth * 90}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {recipe.candles.map((candle) => {
          const point =
            moving?.id === candle.id ? moving.point : candle.position
          return (
            <g key={candle.id} data-candle-id={candle.id}>
              <circle
                cx={100 + point.x * 90}
                cy={100 + point.z * 90}
                r="10"
                fill={candle.color}
                stroke={
                  editor.tools.selectedId === candle.id ? '#8b5cf6' : '#fff'
                }
                strokeWidth="2"
              />
              <text
                x={100 + point.x * 90}
                y={104 + point.z * 90}
                textAnchor="middle"
                fontSize="11"
                fill="#fff"
                pointerEvents="none"
              >
                {candle.design === 'number'
                  ? candle.digit
                  : candle.design === 'heart'
                    ? '♥'
                    : candle.design === 'star'
                      ? '★'
                      : '●'}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
