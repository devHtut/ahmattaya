import { useEffect, useRef, useState } from 'react'
import { BackgroundFields } from './BackgroundFields'
import { StyleFields } from './StyleFields'
import { WordsFields } from './WordsFields'
import { occasions, changeOccasion } from '../../../shared/templates/templates'
import { ImagePlus, Trash2 } from 'lucide-react'
import { ElementFields } from './ElementFields'
import {
  MAX_PHOTOS,
  type CardConfig,
  type CardPhoto,
  type Occasion,
  occasionSchema,
} from '../../../shared/models/card'
import { compressPhoto } from '../lib/compress-photo'
import { defaultPhotoFrame } from '../../../shared/lib/photo-geometry'
import { PhotoProperties } from './PhotoProperties'
import { moveItem, removePage } from '../lib/pages'

export function PagesFields({
  card,
  onChange,
  pageId,
  onSelectPage,
  selectedPhotoId,
  onSelectPhoto,
  selectedElementId = null,
  onSelectElement = () => {},
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
  pageId: string
  onSelectPage: (id: string) => void
  selectedPhotoId: string | null
  onSelectPhoto: (id: string | null) => void
  selectedElementId?: string | null
  onSelectElement?: (id: string | null) => void
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
  const isCover = pageId === 'cover'

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
          const { src, ratio } = await compressPhoto(file)
          if (!mounted.current) return
          added.push({
            id: crypto.randomUUID(),
            pageId: targetPageId,
            src,
            caption: '',
            frame: defaultPhotoFrame(
              latest.current.photos.filter(
                (photo) => photo.pageId === targetPageId,
              ).length + added.length,
              ratio,
            ),
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
      if (accepted.length) {
        onChange({ ...current, photos: [...current.photos, ...accepted] })
        onSelectPhoto(accepted[accepted.length - 1].id)
      }
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
  return (
    <div className="pages-editor">
      <div className="active-page-banner">
        <span className="active-page-icon">{isCover ? '📇' : '📄'}</span>
        <div className="active-page-info">
          <strong>
            {isCover
              ? 'ကတ်အဖုံး (Cover)'
              : page?.title || `စာမျက်နှာ (${pageIndex + 1})`}
          </strong>
          <span className="active-page-sub">
            {isCover
              ? ' — ခေါင်းစဉ်၊ ရင်ထဲကစကား၊ အရောင်နှင့် အလှဆင်ခြင်း'
              : ' — စာမျက်နှာ စာသား၊ စာရွက်ပုံစံနှင့် ဓာတ်ပုံများ'}
          </span>
        </div>
      </div>

      {isCover && (
        <div className="cover-content-container">
          <div className="fields cover-fields">
            <label>
              အခမ်းအနား
              <select
                value={card.occasion}
                onChange={(e) =>
                  onChange(
                    changeOccasion(
                      card,
                      occasionSchema.parse(e.target.value as Occasion),
                    ),
                  )
                }
              >
                {occasions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.icon} {item.name}
                  </option>
                ))}
              </select>
            </label>
            <WordsFields card={card} onChange={onChange} />
          </div>

          <div className="cover-style-container" style={{ marginTop: '20px' }}>
            <h4
              className="section-subheading"
              style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 10px', color: 'var(--ink)' }}
            >
              ကတ်အဖုံး ပုံစံနှင့် Theme အရောင်
            </h4>
            <StyleFields card={card} onChange={onChange} />
          </div>

          <div className="cover-bg-container" style={{ marginTop: '20px' }}>
            <BackgroundFields
              key="cover"
              card={card}
              pageId="cover"
              onChange={onChange}
            />
          </div>
        </div>
      )}

      {!isCover && page && (
        <div className="inside-page-container">
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
                placeholder="ဥပမာ - အမှတ်တရ ဓာတ်ပုံများ"
                value={page.title}
                onChange={(e) => updatePage({ title: e.target.value })}
              />
            </label>
            <label>
              စာမျက်နှာ စာသား
              <textarea
                rows={5}
                maxLength={2000}
                placeholder="ဒီစာမျက်နှာအတွက် ဆုတောင်းစကား သို့မဟုတ် ရင်ဖွင့်စကား..."
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
          <BackgroundFields
            key={pageId}
            card={card}
            pageId={pageId}
            onChange={onChange}
          />
        </div>
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
      <p className="field-hint">
        Preview ပေါ်က ပုံကို ဆွဲရွှေ့ပါ။ ရွေးထားတဲ့ပုံရဲ့ ↘ ထောင့်ကို ဆွဲပြီး
        အရွယ်ပြောင်း၊ ↻ ကို ဆွဲပြီး လှည့်နိုင်ပါတယ်။ Keyboard
        မြားခလုတ်တွေနဲ့လည်း ရွှေ့နိုင်ပါတယ်။
      </p>
      <div className="photo-layer-list" role="group" aria-label="ပုံ အလွှာများ">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            className="photo-layer-choice"
            aria-pressed={selectedPhotoId === photo.id}
            onClick={() => onSelectPhoto(photo.id)}
          >
            <img src={photo.src} alt="" />
            <span>
              ပုံ {index + 1}
              {photo.caption ? ` · ${photo.caption}` : ''}
            </span>
          </button>
        ))}
      </div>
      {photos.find((photo) => photo.id === selectedPhotoId) && (
        <PhotoProperties
          card={card}
          photoId={selectedPhotoId!}
          onChange={onChange}
          onSelect={onSelectPhoto}
        />
      )}

      <ElementFields
        card={card}
        pageId={pageId}
        onChange={onChange}
        selectedElementId={selectedElementId}
        onSelectElement={onSelectElement}
      />
    </div>
  )
}
