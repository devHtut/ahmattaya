import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import {
  MAX_PAGES,
  MAX_PHOTOS,
  type CardConfig,
  type CardPhoto,
} from '../../../shared/models/card'
import { compressPhoto } from '../lib/compress-photo'
import { createPage, moveItem, removePage } from '../lib/pages'

export function PagesFields({
  card,
  onChange,
  pageId,
  onSelectPage,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
  pageId: string
  onSelectPage: (id: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [draggingOver, setDraggingOver] = useState(false)
  const latest = useRef(card)
  const mounted = useRef(false)
  const uploading = useRef(false)
  useEffect(() => {
    latest.current = card
  }, [card])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const page = card.pages.find((item) => item.id === pageId)
  const photos = card.photos.filter((photo) => photo.pageId === pageId)
  const pageIndex = card.pages.findIndex((item) => item.id === pageId)

  async function addPhotos(files: File[]) {
    if (uploading.current || files.length === 0) return
    const targetPageId = pageId
    const available = MAX_PHOTOS - latest.current.photos.length
    if (files.length > available) {
      setFeedback(`ဒီ card မှာ ပုံ ${available} ပုံပဲ ထပ်ထည့်နိုင်ပါသေးတယ်။`)
      return
    }
    uploading.current = true
    setBusy(true)
    setFeedback('ပုံတွေကို ချုံ့နေပါတယ်။ ဒီအဆင့်မှာ ခဏစောင့်ပေးပါ။')
    const added: CardPhoto[] = []
    const failures: string[] = []
    try {
      for (const file of files) {
        try {
          const src = await compressPhoto(file)
          if (!mounted.current) return
          added.push({
            id: crypto.randomUUID(),
            pageId: targetPageId,
            src,
            caption: '',
          })
        } catch (error) {
          failures.push(error instanceof Error ? error.message : 'ပုံထည့်မရပါ။')
        }
      }
      if (!mounted.current) return
      const current = latest.current
      if (
        targetPageId !== 'cover' &&
        !current.pages.some((item) => item.id === targetPageId)
      ) {
        setFeedback('ပုံထည့်မယ့် စာမျက်နှာ မရှိတော့ပါ။')
        return
      }
      const accepted = added.slice(0, MAX_PHOTOS - current.photos.length)
      if (accepted.length)
        onChange({ ...current, photos: [...current.photos, ...accepted] })
      setFeedback(
        [
          accepted.length ? `ပုံ ${accepted.length} ပုံ ထည့်ပြီးပါပြီ။` : '',
          ...failures,
        ]
          .filter(Boolean)
          .join(' '),
      )
    } finally {
      uploading.current = false
      if (mounted.current) setBusy(false)
    }
  }
  const updatePage = (change: Partial<NonNullable<typeof page>>) =>
    onChange({
      ...card,
      pages: card.pages.map((item) =>
        item.id === pageId ? { ...item, ...change } : item,
      ),
    })
  const reorderPhoto = (id: string, targetId: string) => {
    const from = card.photos.findIndex(
      (photo) => photo.id === id && photo.pageId === pageId,
    )
    const to = card.photos.findIndex(
      (photo) => photo.id === targetId && photo.pageId === pageId,
    )
    if (from >= 0 && to >= 0)
      onChange({ ...card, photos: moveItem(card.photos, from, to) })
  }
  return (
    <div className="pages-editor">
      <label>
        ပြင်မယ့် စာမျက်နှာ
        <select
          disabled={busy}
          value={pageId}
          onChange={(e) => onSelectPage(e.target.value)}
        >
          <option value="cover">အဖုံးစာမျက်နှာ</option>
          {card.pages.map((item, index) => (
            <option key={item.id} value={item.id}>
              {index + 2}. {item.title || 'စာမျက်နှာအသစ်'}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button secondary"
        disabled={busy || card.pages.length >= MAX_PAGES}
        onClick={() => {
          const next = createPage(crypto.randomUUID())
          onChange({ ...card, pages: [...card.pages, next] })
          onSelectPage(next.id)
        }}
      >
        <Plus size={16} /> စာမျက်နှာ ထပ်ထည့်မယ်
      </button>
      <p className="field-hint">
        အဖုံးအပြင် စာမျက်နှာ {MAX_PAGES} မျက်နှာအထိ ထည့်နိုင်ပါတယ်။
      </p>
      {page && (
        <div className="fields page-fields">
          <label>
            စာရွက်ပုံစံ
            <select
              value={page.paper}
              onChange={(e) =>
                updatePage({ paper: e.target.value as typeof page.paper })
              }
            >
              <option value="blank">Blank — စာရွက်အလွတ်</option>
              <option value="lined">မျဉ်းကြောင်းပါ စာရွက်</option>
            </select>
          </label>
          <label>
            စာမျက်နှာ ခေါင်းစဉ်
            <input
              maxLength={160}
              value={page.title}
              onChange={(e) => updatePage({ title: e.target.value })}
            />
          </label>
          <label>
            စာမျက်နှာ စာသား
            <textarea
              rows={5}
              maxLength={2000}
              value={page.message}
              onChange={(e) => updatePage({ message: e.target.value })}
            />
          </label>
          <div className="item-actions">
            <button
              disabled={busy || pageIndex === 0}
              onClick={() =>
                onChange({
                  ...card,
                  pages: moveItem(card.pages, pageIndex, pageIndex - 1),
                })
              }
            >
              စာမျက်နှာ ↑
            </button>
            <button
              disabled={busy || pageIndex === card.pages.length - 1}
              onClick={() =>
                onChange({
                  ...card,
                  pages: moveItem(card.pages, pageIndex, pageIndex + 1),
                })
              }
            >
              စာမျက်နှာ ↓
            </button>
            <button
              disabled={busy}
              className="danger"
              onClick={() => {
                if (window.confirm('ဒီစာမျက်နှာနဲ့ သူ့ပုံတွေကို ဖျက်မလား?')) {
                  onChange(removePage(card, pageId))
                  onSelectPage('cover')
                }
              }}
            >
              <Trash2 size={14} /> ဖျက်မယ်
            </button>
          </div>
        </div>
      )}
      {pageId === 'cover' && (
        <p className="field-hint">
          အဖုံးက စာသားတွေကို “စကားလေးများ” အဆင့်မှာ ပြင်နိုင်ပါတယ်။
        </p>
      )}
      <div
        className={`photo-dropzone ${draggingOver ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDraggingOver(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            setDraggingOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDraggingOver(false)
          void addPhotos(Array.from(e.dataTransfer.files))
        }}
      >
        <ImagePlus size={28} aria-hidden="true" />
        <p>ဒီစာမျက်နှာအတွက် ပုံတွေကို ဒီနေရာမှာ ဆွဲထည့်ပါ</p>
        <label className="photo-file-label">
          သို့မဟုတ် ပုံရွေးမယ်
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy || card.photos.length >= MAX_PHOTOS}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ''
              void addPhotos(files)
            }}
          />
        </label>
        <p className="field-hint">
          JPG / PNG / WebP · မူရင်းတစ်ပုံ 15 MB အထိ
          <br />
          Card တစ်ခုလုံး {card.photos.length} / {MAX_PHOTOS} ပုံ · တစ်ပုံ 200 KB
          အောက် ချုံ့ပေးပါတယ်
        </p>
      </div>
      <p className="upload-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
      <div className="photo-editor-grid">
        {photos.map((photo, index) => (
          <div
            className="photo-editor-item"
            key={photo.id}
            draggable={!busy}
            onDragStart={(e) =>
              e.dataTransfer.setData('application/x-ahmattaya-photo', photo.id)
            }
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('application/x-ahmattaya-photo')
              if (id) reorderPhoto(id, photo.id)
            }}
          >
            <img
              src={photo.src}
              alt={photo.caption || `ဓာတ်ပုံ ${index + 1}`}
            />
            <label>
              ပုံ {index + 1} စာတန်း
              <input
                maxLength={120}
                value={photo.caption}
                onChange={(e) =>
                  onChange({
                    ...card,
                    photos: card.photos.map((item) =>
                      item.id === photo.id
                        ? { ...item, caption: e.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
            <div className="item-actions">
              <button
                aria-label={`ပုံ ${index + 1} အပေါ်ရွှေ့မယ်`}
                disabled={busy || index === 0}
                onClick={() => reorderPhoto(photo.id, photos[index - 1].id)}
              >
                ↑
              </button>
              <button
                aria-label={`ပုံ ${index + 1} အောက်ရွှေ့မယ်`}
                disabled={busy || index === photos.length - 1}
                onClick={() => reorderPhoto(photo.id, photos[index + 1].id)}
              >
                ↓
              </button>
              <button
                className="danger"
                aria-label={`ပုံ ${index + 1} ဖျက်မယ်`}
                disabled={busy}
                onClick={() =>
                  onChange({
                    ...card,
                    photos: card.photos.filter((item) => item.id !== photo.id),
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
