import { useState } from 'react'
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
import {
  STICKER_CATEGORIES,
  type StickerItem,
} from '../../../shared/stickers/stickers-catalog'
import { Copy, Trash2, Sparkles, Shapes } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<'stickers' | 'shapes'>('stickers')
  const [selectedCatId, setSelectedCatId] = useState<string>(
    STICKER_CATEGORIES[0]?.id ?? '',
  )

  const allElements = card.elements ?? []
  const pageElements = allElements.filter((el) => el.pageId === pageId)
  const selectedElement = pageElements.find((el) => el.id === selectedElementId)

  const currentCategory =
    STICKER_CATEGORIES.find((c) => c.id === selectedCatId) ??
    STICKER_CATEGORIES[0]

  function addSticker(sticker: StickerItem) {
    if (allElements.length >= MAX_ELEMENTS) {
      alert(`ကတ်တစ်ခုလုံးတွင် elements အများဆုံး ${MAX_ELEMENTS} ခုသာ ထည့်နိုင်ပါသည်`)
      return
    }

    const offset = (pageElements.length % 5) * 6
    const newElement: CardElement = {
      id: crypto.randomUUID(),
      pageId,
      shape: 'sticker',
      stickerSrc: sticker.src,
      color: '#ffffff',
      text: sticker.name,
      fontSize: 14,
      fontFamily: 'handwriting',
      bg: 'transparent',
      frame: {
        x: Math.min(85, Math.max(15, 50 + (pageElements.length % 2 === 0 ? offset : -offset))),
        y: Math.min(85, Math.max(15, 50 + (pageElements.length % 3 === 0 ? -offset : offset))),
        width: 22,
        ratio: 1,
        rotation: (pageElements.length % 4 - 2) * 3,
        opacity: 1,
      },
    }

    onChange({
      ...card,
      elements: [...allElements, newElement],
    })
    onSelectElement(newElement.id)
  }

  function addShape(shape: ElementShape) {
    if (allElements.length >= MAX_ELEMENTS) {
      alert(`ကတ်တစ်ခုလုံးတွင် elements အများဆုံး ${MAX_ELEMENTS} ခုသာ ထည့်နိုင်ပါသည်`)
      return
    }

    const shapeDef = ELEMENT_SHAPES.find((s) => s.id === shape)
    const defaultWidth = shapeDef?.defaultWidth ?? 20
    const defaultRatio = shapeDef?.defaultRatio ?? 1
    const isText = shape === 'text'

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

  function updateSelected(
    changes:
      | Partial<CardElement>
      | { frame: Partial<CardElement['frame']> },
  ) {
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
          <h3 className="elements-section-title">
            အလှဆင် Stickers နှင့် သင်္ကေတများ
          </h3>
          <p className="field-hint" style={{ margin: 0 }}>
            ကတ်ပေါ်တွင် စတစ်ကာများ၊ စာတို (Text Box) များနှင့် သင်္ကေတများကို
            လွတ်လပ်စွာ နေရာချနိုင်ပါသည်
          </p>
        </div>
        <span className="elements-count-badge">{pageElements.length} ခု</span>
      </div>

      {/* Main Switcher: Stickers vs Shapes */}
      <div className="elements-category-tabs" role="tablist">
        <button
          type="button"
          className={`elements-category-tab ${activeTab === 'stickers' ? 'active' : ''}`}
          onClick={() => setActiveTab('stickers')}
        >
          <Sparkles size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Stickers များ (၂၁၀ ပုံ)
        </button>
        <button
          type="button"
          className={`elements-category-tab ${activeTab === 'shapes' ? 'active' : ''}`}
          onClick={() => setActiveTab('shapes')}
        >
          <Shapes size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Text Box & Shapes
        </button>
      </div>

      {/* Stickers Tab Content */}
      {activeTab === 'stickers' && (
        <div className="stickers-tab-container">
          {/* Subcategory horizontal chips */}
          <div
            className="sticker-subcategories-chips"
            role="tablist"
            aria-label="Stickers အမျိုးအစားများ"
          >
            {STICKER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`sticker-subcat-chip ${selectedCatId === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCatId(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <small style={{ opacity: 0.6 }}>({cat.stickers.length})</small>
              </button>
            ))}
          </div>

          {/* Sticker Images Grid */}
          <div
            className="stickers-picker-grid"
            role="group"
            aria-label={`${currentCategory.name} Stickers`}
          >
            {currentCategory.stickers.map((stk) => (
              <button
                key={stk.id}
                type="button"
                className="sticker-picker-btn"
                title={`${stk.name} ထည့်မယ်`}
                onClick={() => addSticker(stk)}
              >
                <img src={stk.src} alt={stk.name} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shapes & Text Box Tab Content */}
      {activeTab === 'shapes' && (
        <div
          className="elements-picker-grid"
          role="group"
          aria-label="Shapes ရွေးချယ်ရန်"
        >
          {ELEMENT_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              className="element-picker-item"
              title={`${shape.label} ထည့်မယ်`}
              onClick={() => addShape(shape.id)}
            >
              <span className="element-picker-icon">{shape.icon}</span>
              <span className="element-picker-label">{shape.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chips for items currently placed on this page */}
      {pageElements.length > 0 && (
        <div
          className="page-elements-list"
          role="tablist"
          aria-label="ထည့်ထားသော Elements"
        >
          <span className="elements-list-caption">
            ထည့်ထားသည့် အလှဆင်ပစ္စည်းများ ({pageElements.length}):
          </span>
          <div className="elements-chips-wrap">
            {pageElements.map((el, index) => {
              const def = ELEMENT_SHAPES.find((s) => s.id === el.shape)
              const isSelected = selectedElementId === el.id
              const isSticker = el.shape === 'sticker'

              return (
                <button
                  key={el.id}
                  type="button"
                  className={`element-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectElement(isSelected ? null : el.id)}
                >
                  {isSticker && el.stickerSrc ? (
                    <img
                      src={el.stickerSrc}
                      alt="Sticker"
                      style={{
                        width: 16,
                        height: 16,
                        objectFit: 'contain',
                        marginRight: 4,
                      }}
                    />
                  ) : (
                    <span>{def?.icon ?? '✨'}</span>
                  )}
                  <span>
                    {isSticker
                      ? `စတစ်ကာ ${index + 1}`
                      : `${def?.label ?? 'Element'} ${index + 1}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Inspector for selected element/sticker */}
      {selectedElement && (
        <div className="element-inspector-card">
          <div className="element-inspector-header">
            <div className="inspector-title-group">
              {selectedElement.shape === 'sticker' && selectedElement.stickerSrc ? (
                <img
                  src={selectedElement.stickerSrc}
                  alt="Selected"
                  style={{
                    width: 24,
                    height: 24,
                    objectFit: 'contain',
                    marginRight: 6,
                  }}
                />
              ) : (
                <span className="inspector-icon">
                  {ELEMENT_SHAPES.find((s) => s.id === selectedElement.shape)?.icon}
                </span>
              )}
              <strong>
                {selectedElement.shape === 'sticker'
                  ? 'စတစ်ကာ အပြင်အဆင်'
                  : `${ELEMENT_SHAPES.find((s) => s.id === selectedElement.shape)?.label} အပြင်အဆင်`}
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
                        onClick={() =>
                          updateSelected({
                            fontFamily: f.id as CardElement['fontFamily'],
                          })
                        }
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-row">
                  <span className="control-label">
                    နောက်ခံပုံစံ (Background)
                  </span>
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
                          style={{
                            backgroundColor: bg.color,
                            borderColor: bg.border,
                          }}
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
                    onChange={(e) =>
                      updateSelected({ fontSize: Number(e.target.value) })
                    }
                  />
                </div>
              </>
            )}

            {/* Color swatches for geometric shapes / text */}
            {selectedElement.shape !== 'sticker' && (
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
                      style={{
                        backgroundColor:
                          c.id === 'theme' ? 'var(--card-accent, #7c3aed)' : c.hex,
                      }}
                      title={c.label}
                      onClick={() => updateSelected({ color: c.id })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Slider */}
            <div className="control-row">
              <span className="control-label">
                အရွယ်အစား ({Math.round(selectedElement.frame.width)}%)
              </span>
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

            {/* Rotation Controls */}
            <div className="control-row">
              <span className="control-label">
                စောင်းခြင်း ({Math.round(selectedElement.frame.rotation)}°)
              </span>
              <div className="rotation-quick-buttons">
                {[-15, 0, 15, 45].map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    className={`button ghost ${Math.round(selectedElement.frame.rotation) === angle ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={() =>
                      updateSelected({ frame: { rotation: angle } })
                    }
                  >
                    {angle === 0
                      ? 'တည့်တည့်'
                      : `${angle > 0 ? '+' : ''}${angle}°`}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="control-row">
              <span className="control-label">
                ကြည်လင်မှု ({Math.round(selectedElement.frame.opacity * 100)}%)
              </span>
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
