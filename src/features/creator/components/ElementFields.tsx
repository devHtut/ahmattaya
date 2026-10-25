import { useEffect, useState } from 'react'
import {
  type CardConfig,
  type CardElement,
  MAX_ELEMENTS,
} from '../../../shared/models/card'
import {
  COLOR_PALETTE,
  ELEMENT_SHAPES,
  TEXT_BACKGROUNDS,
  TEXT_FONTS,
} from '../../../shared/ui/ElementShapes'
import { getCustomFonts } from '../../../shared/fonts/fonts-catalog'
import {
  STICKER_CATEGORIES,
  type StickerItem,
} from '../../../shared/stickers/stickers-catalog'
import { Copy, Trash2, Sparkles, Type, X, ChevronUp, ChevronDown } from 'lucide-react'

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
  const [stickerModalOpen, setStickerModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedCatId, setSelectedCatId] = useState<string>(
    STICKER_CATEGORIES[0]?.id ?? '',
  )

  const allElements = card.elements ?? []
  const pageElements = allElements.filter((el) => el.pageId === pageId)
  const selectedElement = pageElements.find((el) => el.id === selectedElementId)
  const standardFonts = TEXT_FONTS
  const customFonts = getCustomFonts()

  const currentCategory =
    STICKER_CATEGORIES.find((c) => c.id === selectedCatId) ??
    STICKER_CATEGORIES[0]

  useEffect(() => {
    if (!stickerModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStickerModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stickerModalOpen])

  function addSticker(sticker: StickerItem) {
    if (allElements.length >= MAX_ELEMENTS) {
      alert(`ကတ်တစ်ခုလုံးတွင် stickers/စာတို အများဆုံး ${MAX_ELEMENTS} ခုသာ ထည့်နိုင်ပါသည်`)
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

  function addTextBox() {
    if (allElements.length >= MAX_ELEMENTS) {
      alert(`ကတ်တစ်ခုလုံးတွင် stickers/စာတို အများဆုံး ${MAX_ELEMENTS} ခုသာ ထည့်နိုင်ပါသည်`)
      return
    }

    const offset = (pageElements.length % 5) * 6
    const newElement: CardElement = {
      id: crypto.randomUUID(),
      pageId,
      shape: 'text',
      color: '#334155',
      text: 'ချစ်ခြင်းများစွာဖြင့်',
      fontSize: 16,
      fontFamily: 'handwriting',
      bg: 'sticky-yellow',
      frame: {
        x: Math.min(85, Math.max(15, 50 + (pageElements.length % 2 === 0 ? offset : -offset))),
        y: Math.min(85, Math.max(15, 50 + (pageElements.length % 3 === 0 ? -offset : offset))),
        width: 38,
        ratio: 0.38,
        rotation: -3,
        opacity: 1,
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

  function moveLayer(elementId: string, direction: 'up' | 'down') {
    const currentIndex = pageElements.findIndex((el) => el.id === elementId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1
    if (targetIndex < 0 || targetIndex >= pageElements.length) return

    const newPageElements = [...pageElements]
    const temp = newPageElements[currentIndex]
    newPageElements[currentIndex] = newPageElements[targetIndex]
    newPageElements[targetIndex] = temp

    let pageIdx = 0
    const nextAllElements = allElements.map((el) => {
      if (el.pageId === pageId) {
        const item = newPageElements[pageIdx]
        pageIdx += 1
        return item
      }
      return el
    })

    onChange({
      ...card,
      elements: nextAllElements,
    })
    onSelectElement(elementId)
  }

  const selectedIndexInPage = selectedElement
    ? pageElements.findIndex((el) => el.id === selectedElement.id)
    : -1

  return (
    <div className="elements-editor-section">
      <div className="elements-section-header">
        <div>
          <h3 className="elements-section-title">
            အလှဆင် Stickers နှင့် စာတိုများ
          </h3>
        </div>
        <span className="elements-count-badge">{pageElements.length} ခု</span>
      </div>

      {/* Clean compact trigger buttons */}
      <div className="elements-launch-row">
        <button
          type="button"
          className="button primary sticker-picker-launch-btn"
          onClick={() => setStickerModalOpen(true)}
        >
          <span>Stickers ရွေးမယ်</span>
        </button>
        <button
          type="button"
          className="button ghost add-textbox-launch-btn"
          onClick={addTextBox}
          title="စာတို (Text Box) ထည့်မယ်"
        >
          <Type size={14} />
          <span>စာတို ထည့်မယ်</span>
        </button>
      </div>

      {/* Layers list (Photoshop style) for items currently placed on this page */}
      {pageElements.length > 0 && (
        <div
          className="page-elements-list"
          role="region"
          aria-label="ထည့်ထားသော အလွှာများ"
        >
          <div className="elements-list-header">
            <span className="elements-list-caption">
              ထည့်ထားသည့် အလွှာများ (Layers - {pageElements.length}):
            </span>
          </div>
          <div className="elements-layers-stack">
            {[...pageElements]
              .map((el, originalIndex) => ({ el, originalIndex }))
              .reverse()
              .map(({ el, originalIndex }) => {
                const def = ELEMENT_SHAPES.find((s) => s.id === el.shape)
                const isSelected = selectedElementId === el.id
                const isSticker = el.shape === 'sticker'
                const isText = el.shape === 'text'
                const isTop = originalIndex === pageElements.length - 1
                const isBottom = originalIndex === 0

                return (
                  <div
                    key={el.id}
                    className={`layer-item-row ${isSelected ? 'active' : ''}`}
                    onClick={() => onSelectElement(isSelected ? null : el.id)}
                  >
                    <div className="layer-item-main">
                      <div className="layer-item-thumb">
                        {isSticker && el.stickerSrc ? (
                          <img src={el.stickerSrc} alt="Sticker" />
                        ) : isText ? (
                          <span>📝</span>
                        ) : (
                          <span>{def?.icon ?? '✨'}</span>
                        )}
                      </div>
                      <div className="layer-item-info">
                        <span className="layer-item-title">
                          {isSticker
                            ? (el.text || 'Sticker')
                            : isText
                              ? (el.text ? `"${el.text.slice(0, 16)}${el.text.length > 16 ? '...' : ''}"` : 'Text Box')
                              : (def?.label ?? 'ပစ္စည်း')}
                        </span>
                        <span className="layer-item-sub">
                          {isSticker ? 'Sticker' : isText ? 'Text Box' : 'Shape'} • Layer {originalIndex + 1}
                        </span>
                      </div>
                    </div>

                    <div
                      className="layer-order-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="layer-arrow-btn"
                        disabled={isTop}
                        onClick={() => moveLayer(el.id, 'up')}
                        title="အပေါ်သို့ (ရှေ့သို့)"
                        aria-label="အပေါ်သို့"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        className="layer-arrow-btn"
                        disabled={isBottom}
                        onClick={() => moveLayer(el.id, 'down')}
                        title="အောက်သို့ (နောက်သို့)"
                        aria-label="အောက်သို့"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </div>
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
              ) : selectedElement.shape === 'text' ? (
                <span className="inspector-icon">📝</span>
              ) : (
                <span className="inspector-icon">
                  {ELEMENT_SHAPES.find((s) => s.id === selectedElement.shape)?.icon}
                </span>
              )}
              <strong>
                {selectedElement.shape === 'sticker'
                  ? 'Stickers Style'
                  : selectedElement.shape === 'text'
                    ? 'Text Box Style'
                    : 'Stickers Style'}
              </strong>
            </div>
            <div className="inspector-actions">
              <button
                type="button"
                className="icon-button"
                title="အပေါ်သို့ (ရှေ့သို့)"
                aria-label="အပေါ်သို့"
                disabled={selectedIndexInPage === pageElements.length - 1}
                onClick={() => moveLayer(selectedElement.id, 'up')}
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                title="အောက်သို့ (နောက်သို့)"
                aria-label="အောက်သို့"
                disabled={selectedIndexInPage === 0}
                onClick={() => moveLayer(selectedElement.id, 'down')}
              >
                <ChevronDown size={14} />
              </button>
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
                  <label className="control-label" htmlFor="textbox-font-select">
                    Font
                  </label>
                  <select
                    id="textbox-font-select"
                    className="element-select-dropdown"
                    value={selectedElement.fontFamily ?? 'handwriting'}
                    onChange={(e) =>
                      updateSelected({
                        fontFamily: e.target.value,
                      })
                    }
                  >
                    <optgroup label="အခြေခံ Fonts (Standard)">
                      {standardFonts.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </optgroup>
                    {customFonts.length > 0 && (
                      <optgroup label={`ထည့်ထားသော မြန်မာ Fonts (${customFonts.length})`}>
                        {customFonts.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="control-row">
                  <span className="control-label">
                    နောက်ခံအရောင် (Background)
                  </span>
                  <div className="color-swatches-row">
                    {TEXT_BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        className={`color-swatch-btn ${selectedElement.bg === bg.id ? 'active' : ''} ${bg.id === 'transparent' ? 'swatch-transparent' : ''}`}
                        style={{
                          backgroundColor: bg.color,
                          borderColor: bg.border,
                        }}
                        title={bg.label}
                        onClick={() => updateSelected({ bg: bg.id })}
                      >
                        {bg.id === 'transparent' && (
                          <span
                            className="swatch-transparent-slash"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-row">
                  <span className="control-label">စာလုံးအရောင်</span>
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

      {/* Stickers Library Modal Dialog */}
      {stickerModalOpen && (
        <dialog
          className="stickers-library-dialog"
          open
          onClick={(e) => {
            if (e.target === e.currentTarget) setStickerModalOpen(false)
          }}
        >
          <div className="stickers-library-modal">
            <div className="stickers-library-header">
              <div className="stickers-library-titles">
                <h3>
                  <Sparkles size={18} /> Stickers & တံဆိပ်ခေါင်းများ (၂၁၀ ပုံ)
                </h3>
                <p>
                  ကြိုက်နှစ်သက်ရာ စတစ်ကာကို နှိပ်လိုက်ရုံဖြင့် ကတ်ပေါ်သို့ ချက်ချင်း ရောက်ရှိပါမည်
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="ပိတ်မယ်"
                onClick={() => setStickerModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Subcategory horizontal chips */}
            <div
              className="stickers-category-pill-bar"
              role="tablist"
              aria-label="Stickers အမျိုးအစားများ"
            >
              {STICKER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`sticker-cat-pill ${selectedCatId === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCatId(cat.id)}
                >
                  <span className="pill-icon">{cat.icon}</span>
                  <span className="pill-name">{cat.name}</span>
                  <span className="pill-count">({cat.stickers.length})</span>
                </button>
              ))}
            </div>

            {/* Sticker Images Grid */}
            <div
              className="stickers-library-grid"
              role="group"
              aria-label={`${currentCategory.name} Stickers`}
            >
              {currentCategory.stickers.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  className="sticker-library-card"
                  title={`${stk.name} ထည့်မယ်`}
                  onClick={() => {
                    addSticker(stk)
                    setToastMessage(`✓ "${stk.name}" စတစ်ကာ ထည့်ပြီးပါပြီ ✨`)
                    setTimeout(() => setToastMessage(''), 2200)
                  }}
                >
                  <div className="sticker-img-box">
                    <img src={stk.src} alt={stk.name} loading="lazy" />
                  </div>
                  <span className="sticker-name-label">{stk.name}</span>
                </button>
              ))}
            </div>

            <div className="stickers-library-footer">
              <div className="stickers-toast-area">
                {toastMessage && (
                  <span className="sticker-toast-msg">{toastMessage}</span>
                )}
                <span className="stickers-help-note">
                  💡 စတစ်ကာများကို တစ်ခုထက်မက ဆက်လက်ရွေးချယ်နိုင်ပါသည်။
                </span>
              </div>
              <button
                type="button"
                className="button primary"
                onClick={() => setStickerModalOpen(false)}
              >
                ပြီးပါပြီ (Done)
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}
