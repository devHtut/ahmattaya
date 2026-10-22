import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { CardPhoto, PhotoFrame } from '../models/card'
import {
  constrainFrame,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  resizeFrame,
} from '../lib/photo-geometry'

interface PhotoCanvasProps {
  photos: CardPhoto[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onCommit?: (id: string, frame: PhotoFrame) => void
}
type Gesture = {
  id: string
  pointerId: number
  mode: 'move' | 'resize' | 'rotate'
  start: PhotoFrame
  rect: DOMRect
  x: number
  y: number
  angle: number
}
export function PhotoCanvas({
  photos,
  selectedId,
  onSelect,
  onCommit,
}: PhotoCanvasProps) {
  const layer = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const [live, setLive] = useState<{ id: string; frame: PhotoFrame } | null>(
    null,
  )
  const editable = Boolean(onCommit)
  function start(
    event: PointerEvent<HTMLElement>,
    photo: CardPhoto,
    mode: Gesture['mode'],
  ) {
    if (
      !editable ||
      !layer.current ||
      gesture.current ||
      !event.isPrimary ||
      event.button !== 0
    )
      return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    const rect = layer.current.getBoundingClientRect()
    onSelect?.(photo.id)
    const frame = constrainFrame(photo.frame)
    gesture.current = {
      id: photo.id,
      pointerId: event.pointerId,
      mode,
      start: frame,
      rect,
      x: event.clientX,
      y: event.clientY,
      angle: Math.atan2(
        event.clientY - rect.top - (frame.y / 100) * rect.height,
        event.clientX - rect.left - (frame.x / 100) * rect.width,
      ),
    }
  }
  function frameAt(
    event: PointerEvent<HTMLElement>,
    current: Gesture,
  ): PhotoFrame {
    const { rect, start: frame } = current
    if (current.mode === 'move')
      return constrainFrame({
        ...frame,
        x: frame.x + ((event.clientX - current.x) / rect.width) * 100,
        y: frame.y + ((event.clientY - current.y) / rect.height) * 100,
      })
    const dx =
      ((event.clientX - rect.left - (frame.x / 100) * rect.width) /
        rect.width) *
      PAGE_WIDTH
    const dy =
      ((event.clientY - rect.top - (frame.y / 100) * rect.height) /
        rect.height) *
      PAGE_HEIGHT
    if (current.mode === 'rotate')
      return constrainFrame({
        ...frame,
        rotation:
          frame.rotation +
          ((Math.atan2(dy, dx) - current.angle) * 180) / Math.PI,
      })
    const radians = (frame.rotation * Math.PI) / 180
    return resizeFrame(
      frame,
      dx * Math.cos(radians) + dy * Math.sin(radians),
      -dx * Math.sin(radians) + dy * Math.cos(radians),
    )
  }
  const move = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    setLive({ id: current.id, frame: frameAt(event, current) })
  }
  const finish = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    onCommit?.(current.id, frameAt(event, current))
    gesture.current = null
    setLive(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const cancel = () => {
    gesture.current = null
    setLive(null)
  }
  return (
    <div
      ref={layer}
      className={`photo-canvas-layer ${editable ? 'is-editable' : ''}`}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onSelect?.(null)
      }}
    >
      {photos.map((photo, index) => {
        const frame =
          live?.id === photo.id ? live.frame : constrainFrame(photo.frame)
        const selected = editable && selectedId === photo.id
        const style: CSSProperties = {
          left: `${frame.x}%`,
          top: `${frame.y}%`,
          width: `${frame.width}%`,
          aspectRatio: frame.ratio,
          transform: `translate(-50%, -50%) rotate(${frame.rotation}deg)`,
          zIndex: index + 1,
        }
        return (
          <div
            key={photo.id}
            className={`canvas-photo ${frame.shadow ? 'has-shadow' : ''} ${selected ? 'is-selected' : ''}`}
            style={style}
            tabIndex={editable ? 0 : undefined}
            role={editable ? 'group' : undefined}
            aria-label={
              editable ? `ပုံ ${index + 1} — ဆွဲရွှေ့နိုင်ပါတယ်` : undefined
            }
            onFocus={() => onSelect?.(photo.id)}
            onPointerDown={(e) => start(e, photo, 'move')}
            onPointerMove={move}
            onPointerUp={finish}
            onPointerCancel={cancel}
            onLostPointerCapture={cancel}
            onKeyDown={(e) => {
              if (!editable) return
              if (e.key === 'Escape') {
                cancel()
                onSelect?.(null)
                return
              }
              const delta = e.shiftKey ? 5 : 1
              const movement: Record<string, [number, number]> = {
                ArrowLeft: [-delta, 0],
                ArrowRight: [delta, 0],
                ArrowUp: [0, -delta],
                ArrowDown: [0, delta],
              }
              if (!movement[e.key]) return
              e.preventDefault()
              e.stopPropagation()
              const [dx, dy] = movement[e.key]
              onCommit?.(
                photo.id,
                constrainFrame({
                  ...frame,
                  x: frame.x + dx,
                  y: frame.y + dy,
                }),
              )
            }}
          >
            <img
              src={photo.src}
              alt={photo.caption || `အမှတ်တရ ဓာတ်ပုံ ${index + 1}`}
              draggable={false}
            />
            {photo.caption && (
              <div className="canvas-caption">{photo.caption}</div>
            )}
            {selected && (
              <>
                <button
                  className="canvas-handle rotate-handle"
                  aria-label={`ပုံ ${index + 1} လှည့်မယ်`}
                  onPointerDown={(e) => start(e, photo, 'rotate')}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      e.stopPropagation()
                      onCommit?.(
                        photo.id,
                        constrainFrame({
                          ...frame,
                          rotation:
                            frame.rotation + (e.key === 'ArrowRight' ? 5 : -5),
                        }),
                      )
                    }
                  }}
                >
                  ↻
                </button>
                <button
                  className="canvas-handle resize-handle"
                  aria-label={`ပုံ ${index + 1} အရွယ်ပြောင်းမယ်`}
                  onPointerDown={(e) => start(e, photo, 'resize')}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      e.stopPropagation()
                      onCommit?.(
                        photo.id,
                        constrainFrame({
                          ...frame,
                          width: frame.width + (e.key === 'ArrowUp' ? 2 : -2),
                        }),
                      )
                    }
                  }}
                >
                  ↘
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
