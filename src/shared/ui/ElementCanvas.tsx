import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { CardElement, ElementFrame } from '../models/card'
import { renderElementSvg } from './ElementShapes'

interface ElementCanvasProps {
  elements: CardElement[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onCommit?: (id: string, frame: ElementFrame) => void
}

type Gesture = {
  id: string
  pointerId: number
  mode: 'move' | 'resize' | 'rotate'
  start: ElementFrame
  rect: DOMRect
  x: number
  y: number
  angle: number
}

export function ElementCanvas({
  elements,
  selectedId,
  onSelect,
  onCommit,
}: ElementCanvasProps) {
  const layer = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const [live, setLive] = useState<{ id: string; frame: ElementFrame } | null>(
    null,
  )
  const editable = Boolean(onCommit)

  function start(
    event: PointerEvent<HTMLElement>,
    el: CardElement,
    mode: Gesture['mode'],
  ) {
    if (
      !editable ||
      !layer.current ||
      gesture.current ||
      !event.isPrimary ||
      event.button !== 0
    ) {
      return
    }
    const rect = layer.current.getBoundingClientRect()
    const current =
      live && live.id === el.id ? live.frame : el.frame
    const cx = rect.left + (current.x / 100) * rect.width
    const cy = rect.top + (current.y / 100) * rect.height

    gesture.current = {
      id: el.id,
      pointerId: event.pointerId,
      mode,
      start: current,
      rect,
      x: event.clientX,
      y: event.clientY,
      angle: Math.atan2(event.clientY - cy, event.clientX - cx),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.stopPropagation()
    onSelect?.(el.id)
  }

  function frameAt(event: PointerEvent<HTMLElement>, current: Gesture): ElementFrame {
    const { start: s, rect } = current
    if (current.mode === 'move') {
      const dx = ((event.clientX - current.x) / rect.width) * 100
      const dy = ((event.clientY - current.y) / rect.height) * 100
      return {
        ...s,
        x: Math.max(0, Math.min(100, s.x + dx)),
        y: Math.max(0, Math.min(100, s.y + dy)),
      }
    }
    if (current.mode === 'resize') {
      const scale = 1 + ((event.clientX - current.x) / rect.width) * 1.5
      return {
        ...s,
        width: Math.max(5, Math.min(80, s.width * scale)),
      }
    }
    if (current.mode === 'rotate') {
      const cx = rect.left + (s.x / 100) * rect.width
      const cy = rect.top + (s.y / 100) * rect.height
      const now = Math.atan2(event.clientY - cy, event.clientX - cx)
      const diffDeg = ((now - current.angle) * 180) / Math.PI
      let rotation = (s.rotation + diffDeg) % 360
      if (rotation > 180) rotation -= 360
      if (rotation < -180) rotation += 360
      return {
        ...s,
        rotation,
      }
    }
    return s
  }

  function move(event: PointerEvent<HTMLElement>) {
    const current = gesture.current
    if (!current || event.pointerId !== current.pointerId) return
    const next = frameAt(event, current)
    setLive({ id: current.id, frame: next })
  }

  function end(event: PointerEvent<HTMLElement>) {
    const current = gesture.current
    if (!current || event.pointerId !== current.pointerId) return
    const finalFrame = frameAt(event, current)
    gesture.current = null
    setLive(null)
    onCommit?.(current.id, finalFrame)
  }

  return (
    <div
      ref={layer}
      className={`element-canvas-layer ${editable ? 'is-editable' : ''}`}
      onPointerDown={(e) => {
        if (!editable) return
        if (e.target === layer.current) {
          onSelect?.(null)
        }
      }}
    >
      {elements.map((el) => {
        const frame = live && live.id === el.id ? live.frame : el.frame
        const selected = selectedId === el.id
        const style: CSSProperties = {
          left: `${frame.x}%`,
          top: `${frame.y}%`,
          width: `${frame.width}%`,
          aspectRatio: `${1 / frame.ratio}`,
          transform: `translate(-50%, -50%) rotate(${frame.rotation}deg)`,
          opacity: frame.opacity,
          zIndex: selected ? 20 : 10,
        }

        return (
          <div
            key={el.id}
            className={`element-frame ${selected ? 'is-selected' : ''}`}
            style={style}
            onPointerDown={(e) => {
              if (!editable) return
              start(e, el, 'move')
            }}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onLostPointerCapture={end}
          >
            {el.shape === 'text' ? (
              <div
                className={`element-textbox-content bg-${el.bg ?? 'transparent'}`}
                style={{
                  fontFamily:
                    el.fontFamily === 'serif'
                      ? "'Fraunces', 'Cinzel', 'Noto Serif Myanmar', serif"
                      : el.fontFamily === 'sans'
                        ? "'Padauk', 'Noto Sans Myanmar', sans-serif"
                        : "'Caveat', 'Segoe Print', 'Noto Sans Myanmar', cursive",
                  fontSize: `max(10px, ${((el.fontSize ?? 14) / 8).toFixed(1)}cqw)`,
                  color: el.color === 'theme' ? 'inherit' : el.color,
                }}
              >
                {el.text || 'စာတိုလေး ရေးပါ...'}
              </div>
            ) : (
              <div className="element-inner" style={{ color: el.color === 'theme' ? 'inherit' : el.color }}>
                {renderElementSvg(el.shape, el.color)}
              </div>
            )}

            {selected && editable && (
              <>
                <button
                  type="button"
                  className="element-rotate-handle"
                  aria-label="လှည့်မယ်"
                  title="လှည့်မယ်"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    start(e, el, 'rotate')
                  }}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={end}
                  onLostPointerCapture={end}
                >
                  ↻
                </button>
                <button
                  type="button"
                  className="element-resize-handle"
                  aria-label="အရွယ်ပြောင်းမယ်"
                  title="အရွယ်ပြောင်းမယ်"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    start(e, el, 'resize')
                  }}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={end}
                  onLostPointerCapture={end}
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
