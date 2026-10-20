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
export function CardPreview({ card }: { card: CardConfig }) {
  const { colors, heading, body } = card.appearance
  return (
    <article
      className="experience"
      aria-label="ကတ် နမူနာ"
      style={{
        background: `linear-gradient(145deg, ${colors.surface}, ${colors.background})`,
        color: colors.text,
      }}
    >
      <span className="eyebrow" style={{ color: colors.accent }}>
        A LITTLE MOMENT, JUST FOR YOU
      </span>
      <div className="preview-symbol" aria-hidden="true">
        {occasions.find((item) => item.id === card.occasion)?.icon}
      </div>
      <p className="recipient">{card.receiverName || 'ချစ်ရသူလေး အတွက်'}</p>
      <h2 style={textStyle(heading)}>{card.title}</h2>
      <p className="card-message" style={textStyle(body)}>
        {card.message || 'ရင်ထဲက စကားလေးတွေကို ဒီနေရာမှာ ရေးသားနိုင်ပါတယ်။'}
      </p>
      <div className="signature">
        ချစ်ခြင်းများစွာဖြင့်
        <br />
        <strong>{card.senderName || 'သင့်အမည်'}</strong>
      </div>
      <span className="preview-brand" style={{ color: colors.accent }}>
        အမှတ်တရ · AhMatTaYa
      </span>
    </article>
  )
}
