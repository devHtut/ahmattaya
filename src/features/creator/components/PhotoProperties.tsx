import { useState } from 'react'
import { ChevronDown, ChevronUp, Image as ImageIcon, Trash2 } from 'lucide-react'
import type { CardConfig, PhotoFrame } from '../../../shared/models/card'
import { constrainFrame } from '../../../shared/lib/photo-geometry'
import { moveItem } from '../lib/pages'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

export function PhotoProperties({
  card,
  photoId,
  onChange,
  onSelect,
}: {
  card: CardConfig
  photoId: string
  onChange: (card: CardConfig) => void
  onSelect: (id: string | null) => void
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const photo = card.photos.find((item) => item.id === photoId)
  const pagePhotos = card.photos.filter((item) => item.pageId === photo?.pageId)
  const index = pagePhotos.findIndex((item) => item.id === photoId)

  if (!photo) return null

  const update = (change: Partial<PhotoFrame>) =>
    onChange({
      ...card,
      photos: card.photos.map((item) =>
        item.id === photoId
          ? { ...item, frame: constrainFrame({ ...item.frame, ...change }) }
          : item,
      ),
    })

  function layer(direction: -1 | 1) {
    const target = pagePhotos[index + direction]
    if (!target) return
    onChange({
      ...card,
      photos: moveItem(
        card.photos,
        card.photos.findIndex((item) => item.id === photoId),
        card.photos.findIndex((item) => item.id === target.id),
      ),
    })
  }

  function handleDeletePhoto() {
    onChange({
      ...card,
      photos: card.photos.filter((item) => item.id !== photoId),
    })
    onSelect(null)
    setDeleteConfirmOpen(false)
  }

  return (
    <div className="element-inspector-card photo-properties">
      <div className="element-inspector-header">
        <div className="inspector-title-group">
          {photo.src ? (
            <img
              src={photo.src}
              alt="Selected"
              style={{
                width: 24,
                height: 24,
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid var(--line, #e2e8f0)',
                marginRight: 6,
              }}
            />
          ) : (
            <span className="inspector-icon" style={{ display: 'inline-flex', alignItems: 'center', marginRight: 6 }}>
              <ImageIcon size={18} />
            </span>
          )}
          <strong>ရွေးထားတဲ့ပုံ ပြင်မယ်</strong>
        </div>
        <div className="inspector-actions">
          <button
            type="button"
            className="icon-button"
            title="ရှေ့တင်မယ် (အပေါ်သို့)"
            aria-label="ရှေ့တင်မယ်"
            disabled={index === pagePhotos.length - 1}
            onClick={() => layer(1)}
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            className="icon-button"
            title="နောက်ပို့မယ် (အောက်သို့)"
            aria-label="နောက်ပို့မယ်"
            disabled={index === 0}
            onClick={() => layer(-1)}
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="icon-button danger"
            title="ပုံဖျက်မယ်"
            aria-label="ပုံဖျက်မယ်"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="fields">
        <label>
          ပုံ စာတန်း
          <input
            maxLength={120}
            value={photo.caption}
            placeholder="ပုံအောက်မှာ ပြသမယ့် စာတို ရေးပါ..."
            onChange={(e) =>
              onChange({
                ...card,
                photos: card.photos.map((item) =>
                  item.id === photoId
                    ? { ...item, caption: e.target.value }
                    : item,
                ),
              })
            }
          />
        </label>
        <label>
          ပုံအရွယ် — {Math.round(photo.frame.width)}%
          <input
            type="range"
            min={10}
            max={85}
            step={1}
            value={photo.frame.width}
            onChange={(e) => update({ width: Number(e.target.value) })}
          />
        </label>
        <label>
          စောင်းမှု — {Math.round(photo.frame.rotation)}°
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={photo.frame.rotation}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
          />
        </label>
        <div className="photo-position-fields">
          <label>
            ဘယ် / ညာ — {Math.round(photo.frame.x)}%
            <input
              type="range"
              min={0}
              max={100}
              value={photo.frame.x}
              onChange={(e) => update({ x: Number(e.target.value) })}
            />
          </label>
          <label>
            အပေါ် / အောက် — {Math.round(photo.frame.y)}%
            <input
              type="range"
              min={0}
              max={100}
              value={photo.frame.y}
              onChange={(e) => update({ y: Number(e.target.value) })}
            />
          </label>
        </div>
        <label className="shadow-toggle">
          <input
            type="checkbox"
            checked={photo.frame.shadow}
            onChange={(e) => update({ shadow: e.target.checked })}
          />{' '}
          Shadow ထည့်မယ်
        </label>
        <div className="item-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="button secondary"
            style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}
            onClick={() => update({ x: 50, y: 50, rotation: 0 })}
          >
            အလယ်တည့်မယ်
          </button>
          <button
            type="button"
            className="button danger"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px' }}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 size={13} /> ပုံဖျက်မယ်
          </button>
        </div>
        <p className="field-hint">
          ပုံအစွန်းတွေ စာမျက်နှာအပြင် မထွက်အောင် ထိန်းထားပါတယ်။ အပေါ်က
          ပုံစာရင်းမှာ နှိပ်ပြီး ဖုံးနေတဲ့ပုံကို ရွေးနိုင်ပါတယ်။
        </p>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="ဓာတ်ပုံကို ဖျက်မလား?"
        description="ရွေးချယ်ထားသော ဓာတ်ပုံကို ဖျက်ပစ်ပါမည်။"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
        onConfirm={handleDeletePhoto}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </div>
  )
}
