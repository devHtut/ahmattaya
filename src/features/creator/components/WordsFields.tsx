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
  const isWedding = card.occasion === 'wedding-invitation'
  return (
    <div className="fields">
      <label>
        {isWedding ? 'ဖိတ်ကြားခံရသူ / ဧည့်သည်အမည်' : 'လက်ခံသူအမည်'}
        <input
          maxLength={80}
          placeholder={isWedding ? 'ဥပမာ - ဦးထွဋ်ခေါင်' : 'ဥပမာ - ချစ်ရသူလေး'}
          value={card.receiverName}
          onChange={(e) => update({ receiverName: e.target.value })}
        />
      </label>
      <label>
        {isWedding ? 'ဖိတ်ကြားသူ / မင်္ဂလာမောင်နှံ အမည်' : 'ပေးပို့သူအမည်'}
        <input
          maxLength={80}
          placeholder={isWedding ? 'ဥပမာ - ကိုကျော်ကျော် + မနှင်းဖြူ' : 'သင့်အမည်'}
          value={card.senderName}
          onChange={(e) => update({ senderName: e.target.value })}
        />
      </label>
      <label>
        ခေါင်းစဉ်
        <input
          maxLength={160}
          placeholder={isWedding ? 'ဥပမာ - ကျွန်တော်တို့ မင်္ဂလာပွဲကို ဖိတ်ခေါ်ပါတယ်' : 'ဥပမာ - ပျော်ရွှင်ဖွယ် မွေးနေ့ဖြစ်ပါစေ'}
          value={card.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </label>
      <label>
        {isWedding ? 'ဖိတ်ကြားလွှာ စာသား' : 'ရင်ထဲက စကား'}
        <textarea
          rows={5}
          maxLength={2000}
          placeholder={
            isWedding
              ? 'မင်္ဂလာလက်ထပ်ပွဲသို့ ကြွရောက်ချီးမြှင့်ပေးပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်။'
              : 'မွေးနေ့ဆုတောင်း သို့မဟုတ် ရင်ထဲက စကားလေးတွေကို ဒီနေရာမှာ ရေးသားနိုင်ပါတယ်...'
          }
          value={card.message}
          onChange={(e) => update({ message: e.target.value })}
        />
      </label>
      <p className="field-hint">{card.message.length} / 2000</p>
    </div>
  )
}
