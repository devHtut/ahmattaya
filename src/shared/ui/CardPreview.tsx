import type { CSSProperties } from 'react'
import { useImageAsset } from '../media/useImageAsset'
import type { CardAppearance, CardConfig, ElementFrame, PhotoFrame } from '../models/card'
import { occasions } from '../templates/templates'
import { PhotoCanvas } from './PhotoCanvas'
import { ElementCanvas } from './ElementCanvas'

import { resolveFontFamily, getCustomFonts } from '../fonts/fonts-catalog'

function textStyle(style: CardAppearance['heading']): CSSProperties {
  const fontFamily =
    resolveFontFamily(style.font) ||
    `'${style.font}', 'Noto Sans Myanmar', sans-serif`
  return {
    fontFamily,
    fontSize: `max(var(--card-min-type, 11px), ${style.size / 6}cqw)`,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? 'italic' : 'normal',
    fontSynthesis: 'style',
    textAlign: style.align,
  }
}
export function CardPreview({
  card,
  pageId = 'cover',
  selectedPhotoId,
  onSelectPhoto,
  onCommitPhoto,
  selectedElementId,
  onSelectElement,
  onCommitElement,
}: {
  card: CardConfig
  pageId?: string
  selectedPhotoId?: string | null
  onSelectPhoto?: (id: string | null) => void
  onCommitPhoto?: (id: string, frame: PhotoFrame) => void
  selectedElementId?: string | null
  onSelectElement?: (id: string | null) => void
  onCommitElement?: (id: string, frame: ElementFrame) => void
}) {
  getCustomFonts()
  const page = card.pages.find((item) => item.id === pageId)
  const background = page ? page.background : card.background
  const { url: backgroundUrl, failed: backgroundFailed } = useImageAsset(
    background?.assetId,
  )
  const photos = card.photos.filter(
    (photo) => photo.pageId === (page?.id ?? 'cover'),
  )
  const elements = (card.elements ?? []).filter(
    (el) => el.pageId === (page?.id ?? 'cover'),
  )
  const { colors: baseColors, heading, body } = card.appearance
  const colors = {
    ...baseColors,
    ...(page?.colors ?? {}),
  }
  const isCover = !page
  const effectiveHeading = {
    ...heading,
    ...(page?.heading ?? {}),
  }
  const effectiveBody = {
    ...body,
    ...(page?.body ?? {}),
  }
  return (
    <div className="card-page-frame">
      <article
        className={`experience scrapbook-page ${page?.paper === 'lined' ? 'paper-lined' : ''} ${isCover ? 'is-cover' : 'is-page'}`}
        aria-label="ကတ် နမူနာ"
        style={{
          background: `linear-gradient(135deg, ${colors.surface}, ${colors.background})`,
          color: colors.text,
        }}
      >
        {background && backgroundUrl && (
          <div className="page-background" aria-hidden="true">
            <img
              src={backgroundUrl}
              alt=""
              style={{
                objectPosition: `${background.positionX}% ${background.positionY}%`,
                transform: `scale(${background.zoom})`,
                transformOrigin: `${background.positionX}% ${background.positionY}%`,
                opacity: background.opacity,
              }}
            />
            <div
              style={{
                backgroundColor: background.overlayColor,
                opacity: background.overlayOpacity,
              }}
            />
          </div>
        )}
        {backgroundFailed && (
          <span className="background-missing" role="status">
            နောက်ခံပုံ ဖွင့်မရပါ
          </span>
        )}
        <div className="card-copy">
          <div className="copy-side reveal-step-1">
            {isCover && (
              <div className="preview-symbol" aria-hidden="true">
                {occasions.find((item) => item.id === card.occasion)?.icon}
              </div>
            )}
            {isCover && (
              <span className="copy-for">
                {card.receiverName || 'ချစ်ရသူလေး'} အတွက်
              </span>
            )}
            {!isCover && (
              <div className="page-motif" aria-hidden="true">
                <span />
                <span />
              </div>
            )}
          </div>
          <div className="copy-main">
            {isCover && (
              <span
                className="eyebrow reveal-step-2"
                style={{ color: colors.accent }}
              >
                A LITTLE MOMENT, JUST FOR YOU
              </span>
            )}
            <h2 className="reveal-step-3" style={textStyle(effectiveHeading)}>
              {page ? page.title || 'စာမျက်နှာအသစ်' : card.title}
            </h2>
            <p
              className="card-message reveal-step-4"
              style={textStyle(effectiveBody)}
            >
              {(page ? page.message : card.message) ||
                'ရင်ထဲက စကားလေးတွေကို ဒီနေရာမှာ ရေးသားနိုင်ပါတယ်။'}
            </p>
            {isCover && (
              <div className="signature reveal-step-5">
                ချစ်ခြင်းများစွာဖြင့် ·{' '}
                <strong>{card.senderName || 'သင့်အမည်'}</strong>
              </div>
            )}
          </div>
          <span
            className="preview-brand reveal-step-5"
            style={{ color: colors.accent }}
          >
            အမှတ်တရ · AhMatTaYa
          </span>
        </div>
        <div className="elements-canvas-wrapper reveal-step-element">
          <ElementCanvas
            elements={elements}
            selectedId={selectedElementId}
            onSelect={(id) => {
              if (id) onSelectPhoto?.(null)
              onSelectElement?.(id)
            }}
            onCommit={onCommitElement}
          />
        </div>
        <div className="photo-canvas-wrapper reveal-step-photo">
          <PhotoCanvas
            photos={photos}
            selectedId={selectedPhotoId}
            onSelect={(id) => {
              if (id) onSelectElement?.(null)
              onSelectPhoto?.(id)
            }}
            onCommit={onCommitPhoto}
          />
        </div>
      </article>
    </div>
  )
}
