import type { CSSProperties } from 'react'
import type { CardAppearance, CardConfig, PhotoFrame } from '../models/card'
import { occasions } from '../templates/templates'
import { PhotoCanvas } from './PhotoCanvas'

function textStyle(style: CardAppearance['heading']): CSSProperties {
  return {
    fontFamily: `'${style.font}', 'Noto Sans Myanmar', sans-serif`,
    fontSize: `${style.size / 6}cqw`,
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
  const photos = card.photos.filter(
    (photo) => photo.pageId === (page?.id ?? 'cover'),
  )
  const { colors, heading, body } = card.appearance
  return (
    <div className="card-page-frame">
      <article
        className={`experience scrapbook-page ${page?.paper === 'lined' ? 'paper-lined' : ''}`}
        aria-label="ကတ် နမူနာ"
        style={{
          background: `linear-gradient(145deg, ${colors.surface}, ${colors.background})`,
          color: colors.text,
        }}
      >
        <div className="card-copy">
          {!page && (
            <span className="eyebrow" style={{ color: colors.accent }}>
              A LITTLE MOMENT, JUST FOR YOU
            </span>
          )}
          {!page && (
            <div className="preview-symbol" aria-hidden="true">
              {occasions.find((item) => item.id === card.occasion)?.icon}
            </div>
          )}
          {!page && (
            <p className="recipient">
              {card.receiverName || 'ချစ်ရသူလေး အတွက်'}
            </p>
          )}
          <h2 style={textStyle(heading)}>
            {page ? page.title || 'စာမျက်နှာအသစ်' : card.title}
          </h2>
          <p className="card-message" style={textStyle(body)}>
            {(page ? page.message : card.message) ||
              'ရင်ထဲက စကားလေးတွေကို ဒီနေရာမှာ ရေးသားနိုင်ပါတယ်။'}
          </p>
          {!page && (
            <div className="signature">
              ချစ်ခြင်းများစွာဖြင့်
              <br />
              <strong>{card.senderName || 'သင့်အမည်'}</strong>
            </div>
          )}
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
