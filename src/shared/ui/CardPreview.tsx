import type { CSSProperties } from 'react'
import { useImageAsset } from '../media/useImageAsset'
import type { CardAppearance, CardConfig, PhotoFrame } from '../models/card'
import { occasions } from '../templates/templates'
import { PhotoCanvas } from './PhotoCanvas'

function textStyle(style: CardAppearance['heading']): CSSProperties {
  return {
    fontFamily: `'${style.font}', 'Noto Sans Myanmar', sans-serif`,
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
}: {
  card: CardConfig
  pageId?: string
  selectedPhotoId?: string | null
  onSelectPhoto?: (id: string | null) => void
  onCommitPhoto?: (id: string, frame: PhotoFrame) => void
}) {
  const page = card.pages.find((item) => item.id === pageId)
  const background = page ? page.background : card.background
  const { url: backgroundUrl, failed: backgroundFailed } = useImageAsset(
    background?.assetId,
  )
  const photos = card.photos.filter(
    (photo) => photo.pageId === (page?.id ?? 'cover'),
  )
  const { colors, heading, body } = card.appearance
  const isCover = !page
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
          <div className="copy-side">
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
              <span className="eyebrow" style={{ color: colors.accent }}>
                A LITTLE MOMENT, JUST FOR YOU
              </span>
            )}
            <h2 style={textStyle(heading)}>
              {page ? page.title || 'စာမျက်နှာအသစ်' : card.title}
            </h2>
            <p className="card-message" style={textStyle(body)}>
              {(page ? page.message : card.message) ||
                'ရင်ထဲက စကားလေးတွေကို ဒီနေရာမှာ ရေးသားနိုင်ပါတယ်။'}
            </p>
            {isCover && (
              <div className="signature">
                ချစ်ခြင်းများစွာဖြင့် ·{' '}
                <strong>{card.senderName || 'သင့်အမည်'}</strong>
              </div>
            )}
          </div>
          <span className="preview-brand" style={{ color: colors.accent }}>
            အမှတ်တရ · AhMatTaYa
          </span>
        </div>
        <PhotoCanvas
          photos={photos}
          selectedId={selectedPhotoId}
          onSelect={onSelectPhoto}
          onCommit={onCommitPhoto}
        />
      </article>
    </div>
  )
}
