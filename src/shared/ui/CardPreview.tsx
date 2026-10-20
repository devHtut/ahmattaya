import type { CSSProperties } from 'react'
import type { CardAppearance, CardConfig } from '../models/card'
import { occasions } from '../templates/templates'

function textStyle(style: CardAppearance['heading']): CSSProperties {
  return {
    fontFamily: `'${style.font}', 'Noto Sans Myanmar', sans-serif`,
    fontSize: `${style.size}px`,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? 'italic' : 'normal',
    fontSynthesis: 'style',
    textAlign: style.align,
  }
}
export function CardPreview({
  card,
  pageId = 'cover',
}: {
  card: CardConfig
  pageId?: string
}) {
  const page = card.pages.find((item) => item.id === pageId)
  const photos = card.photos.filter(
    (photo) => photo.pageId === (page?.id ?? 'cover'),
  )
  const { colors, heading, body } = card.appearance
  return (
    <article
      className={`experience ${page?.paper === 'lined' ? 'paper-lined' : ''}`}
      aria-label="ကတ် နမူနာ"
      style={{
        background: `linear-gradient(145deg, ${colors.surface}, ${colors.background})`,
        color: colors.text,
      }}
    >
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
        <p className="recipient">{card.receiverName || 'ချစ်ရသူလေး အတွက်'}</p>
      )}
      <h2 style={textStyle(heading)}>
        {page ? page.title || 'စာမျက်နှာအသစ်' : card.title}
      </h2>
      <p className="card-message" style={textStyle(body)}>
        {(page ? page.message : card.message) ||
          'ရင်ထဲက စကားလေးတွေကို ဒီနေရာမှာ ရေးသားနိုင်ပါတယ်။'}
      </p>
      <div className="memory-gallery">
        {photos.map((photo, index) => (
          <figure key={photo.id}>
            <img
              src={photo.src}
              alt={photo.caption || `အမှတ်တရ ဓာတ်ပုံ ${index + 1}`}
              loading="lazy"
            />
            {photo.caption && <figcaption>{photo.caption}</figcaption>}
          </figure>
        ))}
      </div>
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
    </article>
  )
}
