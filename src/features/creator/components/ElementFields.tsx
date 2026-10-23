import {
  type CardConfig,
  type CardElement,
  type ElementShape,
  MAX_ELEMENTS,
} from '../../../shared/models/card'
import {
  COLOR_PALETTE,
  ELEMENT_SHAPES,
  TEXT_BACKGROUNDS,
  TEXT_FONTS,
} from '../../../shared/ui/ElementShapes'
import { Copy, Trash2 } from 'lucide-react'

export function ElementFields({
  card,
  pageId,
  onChange,
  selectedElementId,
  onSelectElement,
}: {
  card: CardConfig
  pageId: string
  onChange: (card: CardConfig) => void
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
}) {
  const allElements = card.elements ?? []
  const pageElements = allElements.filter((el) => el.pageId === pageId)
  const selectedElement = pageElements.find((el) => el.id === selectedElementId)

  function addElement(shape: ElementShape) {
    if (allElements.length >= MAX_ELEMENTS) {
      alert(`ကတ်တစ်ခုလုံးတွင် elements အများဆုံး ${MAX_ELEMENTS} ခုသာ ထည့်နိုင်ပါသည်`)
      return
    }

    const shapeDef = ELEMENT_SHAPES.find((s) => s.id === shape)
    const defaultWidth = shapeDef?.defaultWidth ?? 20
    const defaultRatio = shapeDef?.defaultRatio ?? 1
    const isText = shape === 'text'

    // Scatter slightly based on how many elements exist on this page
    const offset = (pageElements.length % 5) * 6
    const newElement: CardElement = {
      id: crypto.randomUUID(),
      pageId,
      shape,
      color: isText ? 'theme' : shape === 'washi-tape' ? '#fb7185' : 'theme',
      text: isText ? 'ချစ်ခြင်းများစွာဖြင့်' : '',
      fontSize: 16,
      fontFamily: 'handwriting',
      bg: isText ? 'sticky-yellow' : 'transparent',
      frame: {
        x: Math.min(85, Math.max(15, 50 + (pageElements.length % 2 === 0 ? offset : -offset))),
        y: Math.min(85, Math.max(15, 50 + (pageElements.length % 3 === 0 ? -offset : offset))),
        width: defaultWidth,
        ratio: defaultRatio,
        rotation: isText ? -3 : shape === 'washi-tape' ? -12 : 0,
        opacity: shape === 'washi-tape' ? 0.85 : 1,
      },
    }

    onChange({
      ...card,
      elements: [...allElements, newElement],
    })
    onSelectElement(newElement.id)
  }

  function updateSelected(changes: Partial<CardElement> | { frame: Partial<CardElement['frame']> }) {
    if (!selectedElement) return
    const nextElements = allElements.map((el) => {
      if (el.id !== selectedElement.id) return el
      if ('frame' in changes) {
        return {
          ...el,
          ...changes,
          frame: { ...el.frame, ...changes.frame },
        }
      }
      return { ...el, ...changes }
    })
    onChange({ ...card, elements: nextElements })
  }

  function duplicateSelected() {
    if (!selectedElement) return
    if (allElements.length >= MAX_ELEMENTS) return
    const duplicated: CardElement = {
      ...selectedElement,
      id: crypto.randomUUID(),
      frame: {
        ...selectedElement.frame,
        x: Math.min(90, selectedElement.frame.x + 5),
        y: Math.min(90, selectedElement.frame.y + 5),
      },
    }
    onChange({
      ...card,
      elements: [...allElements, duplicated],
    })
    onSelectElement(duplicated.id)
  }

  function deleteSelected() {
    if (!selectedElement) return
    onChange({
      ...card,
      elements: allElements.filter((el) => el.id !== selectedElement.id),
    })
    onSelectElement(null)
  }

  return (
    <div className="elements-editor-section">
      <div className="elements-section-header">
        <div>
          <h3 className="elements-section-title">အလှဆင် သင်္ကေတများ (Elements)</h3>
          <p className="field-hint" style={{ margin: 0 }}>
            စာမျက်နှာပေါ်တွင် ပုံလေးများ၊ စက်ဝိုင်း၊ tape အလှများကို လွတ်လပ်စွာ ထည့်သွင်းနိုင်ပါသည်
          </p>
        </div>
        <span className="elements-count-badge">
          {pageElements.length} ခု
        </span>
      </div>

      <div className="elements-picker-grid" role="group" aria-label="Elements ရွေးချယ်ရန်">
        {ELEMENT_SHAPES.map((shape) => (
          <button
            key={shape.id}
            type="button"
            className="element-picker-item"
            title={`${shape.label} ထည့်မယ်`}
            onClick={() => addElement(shape.id)}
          >
            <span className="element-picker-icon">{shape.icon}</span>
            <span className="element-picker-label">{shape.label}</span>
          </button>
        ))}
      </div>

      {pageElements.length > 0 && (
        <div className="page-elements-list" role="tablist" aria-label="ထည့်ထားသော Elements">
          <span className="elements-list-caption">ထည့်ထားသည့် သင်္ကေတများ:</span>
          <div className="elements-chips-wrap">
            {pageElements.map((el, index) => {
              const def = ELEMENT_SHAPES.find((s) => s.id === el.shape)
              const isSelected = selectedElementId === el.id
              return (
                <button
                  key={el.id}
                  type="button"
                  className={`element-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectElement(isSelected ? null : el.id)}
                >
                  <span>{def?.icon ?? '✨'}</span>
                  <span>{def?.label ?? 'Element'} {index + 1}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selectedElement && (
        <div className="element-inspector-card">
          <div className="element-inspector-header">
            <div className="inspector-title-group">
              <span className="inspector-icon">
                {ELEMENT_SHAPES.find((s) => s.id === selectedElement.shape)?.icon}
              </span>
              <strong>
                {ELEMENT_SHAPES.find((s) => s.id === selectedElement.shape)?.label} အပြင်အဆင်
              </strong>
            </div>
            <div className="inspector-actions">
              <button
                type="button"
                className="icon-button"
                title="မိတ္တူပွားမယ်"
                onClick={duplicateSelected}
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                className="icon-button danger"
                title="ဖျက်မယ်"
                onClick={deleteSelected}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="inspector-controls">
            {selectedElement.shape === 'text' && (
              <>
                <div className="control-row">
                  <span className="control-label">စာသား (Text)</span>
                  <textarea
                    rows={2}
                    maxLength={200}
                    placeholder="ဒီနေရာမှာ စာတို ရေးပါ..."
                    value={selectedElement.text ?? ''}
                    onChange={(e) => updateSelected({ text: e.target.value })}
                  />
                </div>

                <div className="control-row">
                  <span className="control-label">ဖောင့်စတိုင်</span>
                  <div className="font-choices-grid">
                    {TEXT_FONTS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`button ghost ${selectedElement.fontFamily === f.id ? 'active' : ''}`}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => updateSelected({ fontFamily: f.id as CardElement['fontFamily'] })}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-row">
                  <span className="control-label">နောက်ခံပုံစံ (Background)</span>
                  <div className="bg-choices-wrap">
                    {TEXT_BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        className={`bg-choice-chip ${selectedElement.bg === bg.id ? 'active' : ''}`}
                        onClick={() => updateSelected({ bg: bg.id })}
                      >
                        <span
                          className="bg-preview-dot"
                          style={{ backgroundColor: bg.color, borderColor: bg.border }}
                        />
                        <span>{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-row">
                  <span className="control-label">
                    စာလုံးအရွယ်အစား ({selectedElement.fontSize ?? 16}px)
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={32}
                    value={selectedElement.fontSize ?? 16}
                    onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                  />
                </div>
              </>
            )}

            <div className="control-row">
              <span className="control-label">
                {selectedElement.shape === 'text' ? 'စာလုံးအရောင်' : 'အရောင်'}
              </span>
              <div className="color-swatches-row">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-swatch-btn ${selectedElement.color === c.id ? 'active' : ''}`}
                    style={{ backgroundColor: c.id === 'theme' ? 'var(--card-accent, #7c3aed)' : c.hex }}
                    title={c.label}
                    onClick={() => updateSelected({ color: c.id })}
                  />
                ))}
              </div>
            </div>

            <div className="control-row">
              <span className="control-label">အရွယ်အစား ({Math.round(selectedElement.frame.width)}%)</span>
              <input
                type="range"
                min={8}
                max={60}
                value={selectedElement.frame.width}
                onChange={(e) =>
                  updateSelected({
                    frame: { width: Number(e.target.value) },
                  })
                }
              />
            </div>

            <div className="control-row">
              <span className="control-label">စောင်းခြင်း ({Math.round(selectedElement.frame.rotation)}°)</span>
              <div className="rotation-quick-buttons">
                {[-15, 0, 15, 45].map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    className={`button ghost ${Math.round(selectedElement.frame.rotation) === angle ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={() => updateSelected({ frame: { rotation: angle } })}
                  >
                    {angle === 0 ? 'တည့်တည့်' : `${angle > 0 ? '+' : ''}${angle}°`}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-row">
              <span className="control-label">ကြည်လင်မှု ({Math.round(selectedElement.frame.opacity * 100)}%)</span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={selectedElement.frame.opacity}
                onChange={(e) =>
                  updateSelected({
                    frame: { opacity: Number(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
