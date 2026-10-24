import { useEffect, useRef, useState } from 'react'
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react'
import type { CardConfig } from '../../../shared/models/card'
import {
  createBackground,
  type PageBackground,
} from '../../../shared/models/background'
import { saveImageAsset } from '../../../shared/media/image-assets'
import { useImageAsset } from '../../../shared/media/useImageAsset'
import { compressPhoto } from '../lib/compress-photo'
import { setPageBackground } from '../lib/backgrounds'

export function BackgroundFields({
  card,
  pageId = 'cover',
  onChange,
}: {
  card: CardConfig
  pageId?: string
  onChange: (card: CardConfig) => void
}) {
  const background =
    pageId === 'cover'
      ? card.background
      : card.pages.find((page) => page.id === pageId)?.background
  const { url, failed } = useImageAsset(background?.assetId)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [over, setOver] = useState(false)
  const latest = useRef({ card, onChange })
  const mounted = useRef(false)
  const uploading = useRef(false)
  useEffect(() => {
    latest.current = { card, onChange }
  }, [card, onChange])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const update = (change: Partial<PageBackground>) => {
    if (background)
      onChange(setPageBackground(card, pageId, { ...background, ...change }))
  }
  async function upload(files: File[]) {
    if (uploading.current || files.length === 0) return
    if (files.length !== 1) {
      setFeedback('နောက်ခံအတွက် ပုံတစ်ပုံပဲ ရွေးပေးပါ။')
      return
    }
    uploading.current = true
    setBusy(true)
    setFeedback('နောက်ခံပုံကို ပြင်ဆင်နေပါတယ်…')
    try {
      const { src } = await compressPhoto(files[0])
      if (!mounted.current) return
      let assetId: string
      try {
        assetId = await saveImageAsset(src)
      } catch {
        throw new Error(
          'နောက်ခံပုံကို ဒီ browser မှာ သိမ်းမရပါ။ နေရာလွတ်ရှိမရှိ စစ်ပြီး ထပ်ကြိုးစားပေးပါ။',
        )
      }
      if (!mounted.current) return
      const { card: current, onChange: commit } = latest.current
      if (
        pageId !== 'cover' &&
        !current.pages.some((page) => page.id === pageId)
      )
        return
      const previous =
        pageId === 'cover'
          ? current.background
          : current.pages.find((page) => page.id === pageId)?.background
      commit(
        setPageBackground(
          current,
          pageId,
          previous ? { ...previous, assetId } : createBackground(assetId),
        ),
      )
      setFeedback('နောက်ခံပုံ ထည့်ပြီးပါပြီ။')
    } catch (error) {
      if (mounted.current)
        setFeedback(error instanceof Error ? error.message : 'ပုံထည့်မရပါ။')
    } finally {
      uploading.current = false
      if (mounted.current) setBusy(false)
    }
  }
  return (
    <div className="background-fields-wrap">
      <div
        className={`background-dropzone compact ${over ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void upload(Array.from(e.dataTransfer.files))
        }}
      >
        {url ? (
          <div className="bg-preview-wrap">
            <img
              className="background-thumbnail"
              src={url}
              alt="လက်ရှိ နောက်ခံပုံ"
            />
            <label className="button ghost compact-file-btn">
              နောက်ခံပုံ ပြောင်းမယ်
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  e.target.value = ''
                  void upload(files)
                }}
              />
            </label>
          </div>
        ) : (
          <div className="compact-dropzone-content">
            <ImagePlus size={22} aria-hidden="true" />
            <div className="compact-dropzone-text">
              <label className="button ghost compact-file-btn">
                Background Image Picker
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    e.target.value = ''
                    void upload(files)
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
      <p className="upload-feedback" role="status">
        {feedback ||
          (failed ? 'နောက်ခံပုံကို ဖွင့်မရပါ။ ပုံပြန်ရွေးနိုင်ပါတယ်။' : '')}
      </p>
      {background && (
        <div className="fields">
          <label>
            ဘယ် / ညာ နေရာ — {background.positionX}%
            <input
              type="range"
              min="0"
              max="100"
              value={background.positionX}
              disabled={busy}
              onChange={(e) => update({ positionX: Number(e.target.value) })}
            />
          </label>
          <label>
            အပေါ် / အောက် နေရာ — {background.positionY}%
            <input
              type="range"
              min="0"
              max="100"
              value={background.positionY}
              disabled={busy}
              onChange={(e) => update({ positionY: Number(e.target.value) })}
            />
          </label>
          <label>
            ပုံချဲ့နှုန်း — {Math.round(background.zoom * 100)}%
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={background.zoom}
              disabled={busy}
              onChange={(e) => update({ zoom: Number(e.target.value) })}
            />
          </label>
          <label>
            ပုံထင်ရှားမှု — {Math.round(background.opacity * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={background.opacity}
              disabled={busy}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
            />
          </label>
          <label className="color-control">
            <span>စာဖတ်လွယ်စေမယ့် အရောင်လွှာ</span>
            <input
              type="color"
              value={background.overlayColor}
              disabled={busy}
              onChange={(e) => update({ overlayColor: e.target.value })}
            />
          </label>
          <label>
            အရောင်လွှာ အထူ — {Math.round(background.overlayOpacity * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={background.overlayOpacity}
              disabled={busy}
              onChange={(e) =>
                update({ overlayOpacity: Number(e.target.value) })
              }
            />
          </label>
          <div className="item-actions">
            <button
              disabled={busy}
              onClick={() => {
                onChange(
                  setPageBackground(
                    card,
                    pageId,
                    createBackground(background.assetId),
                  ),
                )
                setFeedback('နေရာနဲ့ အရောင်လွှာ ပြန်ညှိပြီးပါပြီ။')
              }}
            >
              <RotateCcw size={14} /> နေရာ ပြန်ညှိမယ်
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={() => {
                onChange(setPageBackground(card, pageId, null))
                setFeedback('နောက်ခံပုံ ဖယ်ပြီးပါပြီ။')
              }}
            >
              <Trash2 size={14} /> နောက်ခံပုံ ဖယ်မယ်
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
