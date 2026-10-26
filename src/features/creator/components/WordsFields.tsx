import type { CardConfig } from '../../../shared/models/card'

export function WordsFields({
  card,
  onChange,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
}) {
  const update = (change: Partial<CardConfig>) =>
    onChange({ ...card, ...change })
  return (
    <div className="fields">
      <label>
        လက်ခံသူအမည်
        <input
          maxLength={80}
          value={card.receiverName}
          onChange={(e) => update({ receiverName: e.target.value })}
        />
      </label>
      <label>
        ပေးပို့သူအမည်
        <input
          maxLength={80}
          value={card.senderName}
          onChange={(e) => update({ senderName: e.target.value })}
        />
      </label>
      <label>
        ခေါင်းစဉ်
        <input
          maxLength={160}
          value={card.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </label>
      <label>
        ရင်ထဲက စကား
        <textarea
          rows={5}
          maxLength={2000}
          placeholder="မွေးနေ့ဆုတောင်း သို့မဟုတ် ရင်ထဲက စကားလေးတွေကို ဒီနေရာမှာ ရေးသားနိုင်ပါတယ်..."
          value={card.message}
          onChange={(e) => update({ message: e.target.value })}
        />
      </label>
      <p className="field-hint">{card.message.length} / 2000</p>
    </div>
  )
}
