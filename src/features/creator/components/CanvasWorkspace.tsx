import { useEffect, useMemo, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  X,
} from 'lucide-react'
import type {
  CardConfig,
  ElementFrame,
  PhotoFrame,
} from '../../../shared/models/card'
import { CardPreview } from '../../../shared/ui/CardPreview'

export function CanvasWorkspace({
  card,
  pageId,
  onSelectPage,
  selectedId,
  onSelect,
  onCommit,
  selectedElementId,
  onSelectElement,
  onCommitElement,
}: {
  card: CardConfig
  pageId: string
  onSelectPage?: (id: string) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCommit: (id: string, frame: PhotoFrame) => void
  selectedElementId?: string | null
  onSelectElement?: (id: string | null) => void
  onCommitElement?: (id: string, frame: ElementFrame) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  const allPageIds = useMemo(
    () => ['cover', ...card.pages.map((p) => p.id)],
    [card.pages],
  )
  const currentPageIndex = Math.max(0, allPageIds.indexOf(pageId))
  const isCover = pageId === 'cover'
  const isFirst = currentPageIndex === 0
  const isLast = currentPageIndex === allPageIds.length - 1

  function handleClose() {
    dialog.current?.close()
    onSelect(null)
    onSelectElement?.(null)
  }

  function handlePrev() {
    if (!isFirst && onSelectPage) {
      onSelectPage(allPageIds[currentPageIndex - 1])
      onSelect(null)
      onSelectElement?.(null)
    }
  }

  function handleNext() {
    if (!isLast && onSelectPage) {
      onSelectPage(allPageIds[currentPageIndex + 1])
      onSelect(null)
      onSelectElement?.(null)
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!dialog.current?.open) return
      if (e.key === 'ArrowLeft') {
        if (currentPageIndex > 0 && onSelectPage) {
          e.preventDefault()
          onSelectPage(allPageIds[currentPageIndex - 1])
          onSelect(null)
          onSelectElement?.(null)
        }
      } else if (e.key === 'ArrowRight') {
        if (currentPageIndex < allPageIds.length - 1 && onSelectPage) {
          e.preventDefault()
          onSelectPage(allPageIds[currentPageIndex + 1])
          onSelect(null)
          onSelectElement?.(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPageIndex, allPageIds, onSelectPage, onSelect, onSelectElement])

  return (
    <>
      <button
        type="button"
        className="button secondary canvas-expand"
        onClick={() => dialog.current?.showModal()}
        title="Canvas အပြည့်ဖြင့် ပုံများနှင့် စာသားများကို လွတ်လပ်စွာ နေရာချရန်"
      >
        <Maximize2 size={14} style={{ marginRight: 6 }} />
        Canvas အပြည့် ပြင်မယ် ↗
      </button>

      <dialog
        ref={dialog}
        className="canvas-workspace"
        aria-labelledby="canvas-workspace-title"
        onClose={() => {
          onSelect(null)
          onSelectElement?.(null)
        }}
      >
        <div className="canvas-workspace-bar">
          <div className="canvas-workspace-bar-left">
            <h2 id="canvas-workspace-title">
              <Sparkles size={16} />
              Canvas အပြည့် အလှဆင်ခြင်း
            </h2>
            <span className="canvas-workspace-page-badge">
              {isCover
                ? '📇 ကတ်အဖုံး (Cover)'
                : `📄 စာမျက်နှာ (${currentPageIndex})`}
            </span>
          </div>

          <div className="canvas-workspace-hint">
            💡 ဆွဲရွှေ့ရန်၊ အရွယ်ပြောင်းရန် ↘၊ စောင်းရန် ↻ ကို အသုံးပြုပါ
          </div>

          <button
            type="button"
            className="canvas-workspace-close"
            onClick={handleClose}
          >
            <X size={15} />
            ပြီးပြီ · ပိတ်မယ်
            <span className="canvas-workspace-esc-badge">Esc</span>
          </button>
        </div>

        <div className="canvas-workspace-body">
          {allPageIds.length > 1 && (
            <button
              type="button"
              className="canvas-workspace-nav-btn prev"
              onClick={handlePrev}
              disabled={isFirst}
              title="ယခင် စာမျက်နှာ (←)"
              aria-label="ယခင် စာမျက်နှာ"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="canvas-workspace-page">
            <CardPreview
              key={pageId}
              card={card}
              pageId={pageId}
              selectedPhotoId={selectedId}
              onSelectPhoto={onSelect}
              onCommitPhoto={onCommit}
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
              onCommitElement={onCommitElement}
            />
          </div>

          {allPageIds.length > 1 && (
            <button
              type="button"
              className="canvas-workspace-nav-btn next"
              onClick={handleNext}
              disabled={isLast}
              title="နောက် စာမျက်နှာ (→)"
              aria-label="နောက် စာမျက်နှာ"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {allPageIds.length > 1 && (
          <div className="canvas-workspace-footer">
            {allPageIds.map((pId, idx) => (
              <button
                key={pId}
                type="button"
                className={`stage-page-dot ${pageId === pId ? 'active' : ''}`}
                onClick={() => {
                  onSelectPage?.(pId)
                  onSelect(null)
                  onSelectElement?.(null)
                }}
              >
                {pId === 'cover' ? '📇 အဖုံး' : `📄 ${idx}`}
              </button>
            ))}
          </div>
        )}
      </dialog>
    </>
  )
}

