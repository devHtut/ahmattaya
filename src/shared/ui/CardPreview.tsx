import type { CardConfig } from '../models/card'
import { occasions } from '../templates/templates'

export function CardPreview({ card }: { card: CardConfig }) {
  return (
    <article
      className={`experience theme-${card.theme}`}
      aria-label="ကတ် နမူနာ"
    >
      <span className="eyebrow">A LITTLE MOMENT, JUST FOR YOU</span>
      <div className="preview-symbol" aria-hidden="true">
        {occasions.find((item) => item.id === card.occasion)?.icon}
      </div>
      <p className="recipient">{card.receiverName || 'ချစ်ရသူလေး အတွက်'}</p>
      <h2>{card.title}</h2>
      <p className="card-message">
        {card.message || 'ရင်ထဲက စကားလေးတွေကို ဒီနေရာမှာ ရေးသားနိုင်ပါတယ်။'}
      </p>
      <div className="signature">
        ချစ်ခြင်းများစွာဖြင့်
        <br />
        <strong>{card.senderName || 'သင့်အမည်'}</strong>
      </div>
      <span className="preview-brand">အမှတ်တရ · AhMatTaYa</span>
    </article>
  )
}
