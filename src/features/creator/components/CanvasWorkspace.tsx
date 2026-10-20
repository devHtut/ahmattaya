import { useRef } from 'react'
import type { CardConfig, PhotoFrame } from '../../../shared/models/card'
import { CardPreview } from '../../../shared/ui/CardPreview'

export function CanvasWorkspace({
  card,
  pageId,
  selectedId,
  onSelect,
  onCommit,
}: {
  card: CardConfig
  pageId: string
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCommit: (id: string, frame: PhotoFrame) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button
        className="button secondary canvas-expand"
        onClick={() => dialog.current?.showModal()}
      >
        Canvas အပြည့် ပြင်မယ် ↗
      </button>
      <dialog
        ref={dialog}
        className="canvas-workspace"
        aria-labelledby="canvas-workspace-title"
        aria-describedby="canvas-workspace-help"
      >
        <div className="canvas-workspace-bar">
          <h2 id="canvas-workspace-title">ပုံလေးတွေ နေရာချမယ်</h2>
          <button
            className="button secondary"
            onClick={() => dialog.current?.close()}
          >
            ပြီးပြီ · ပိတ်မယ်
          </button>
        </div>
        <p id="canvas-workspace-help">
          ပုံကို ဆွဲရွှေ့ပါ။ ရွေးထားတဲ့ပုံရဲ့ ↘ ကို ဆွဲပြီး အရွယ်ပြောင်း၊ ↻ ကို
          ဆွဲပြီး စောင်းပါ။
        </p>
        <div className="canvas-workspace-page">
          <CardPreview
            card={card}
            pageId={pageId}
            selectedPhotoId={selectedId}
            onSelectPhoto={onSelect}
            onCommitPhoto={onCommit}
          />
        </div>
        <p className="field-hint">
          Shadow နဲ့ ရှေ့တင်/နောက်ပို့ကို settings ထဲမှာ ရွေးနိုင်ပါတယ်။
        </p>
      </dialog>
    </>
  )
}
