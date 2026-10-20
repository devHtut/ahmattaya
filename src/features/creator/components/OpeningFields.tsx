import type { CardConfig } from '../../../shared/models/card'
import {
  openingEmojis,
  type OpeningConfig,
} from '../../../shared/models/opening'

export function OpeningFields({
  card,
  onChange,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
}) {
  const update = (change: Partial<OpeningConfig>) =>
    onChange({ ...card, opening: { ...card.opening, ...change } })
  return (
    <div className="fields opening-fields">
      <label>
        အဖွင့်ပုံစံ
        <select
          value={card.opening.style}
          onChange={(e) =>
            update({ style: e.target.value as OpeningConfig['style'] })
          }
        >
          <option value="envelope">စာအိတ်လေး</option>
          <option value="gift">လက်ဆောင်ဘူးလေး</option>
        </select>
      </label>
      <label>
        အဖွင့်ခေါင်းစဉ်
        <input
          maxLength={120}
          value={card.opening.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </label>
      <label>
        အဖွင့်စာသား
        <textarea
          rows={3}
          maxLength={300}
          value={card.opening.message}
          onChange={(e) => update({ message: e.target.value })}
        />
      </label>
      <label>
        ဖွင့်ရန် ခလုတ်စာသား
        <input
          maxLength={50}
          value={card.opening.buttonText}
          onChange={(e) => update({ buttonText: e.target.value })}
        />
      </label>
      <div className="color-controls">
        {(
          [
            { key: 'background', label: 'အဖွင့် နောက်ခံ' },
            { key: 'color', label: 'စာအိတ် / ဘူးအရောင်' },
            { key: 'sealColor', label: 'Seal / ဖဲကြိုးအရောင်' },
            { key: 'textColor', label: 'အဖွင့် စာသားရောင်' },
          ] as const
        ).map(({ key, label }) => (
          <label className="color-control" key={key}>
            <span>{label}</span>
            <input
              type="color"
              value={card.opening[key]}
              onChange={(e) => update({ [key]: e.target.value })}
            />
            <span className="hex-value">{card.opening[key]}</span>
          </label>
        ))}
      </div>
      <fieldset className="opening-emoji-picker">
        <legend>အလှဆင် Emoji</legend>
        <div role="group" aria-label="ဖိတ်စာ Emoji">
          {openingEmojis.map((emoji) => (
            <button
              key={emoji}
              aria-label={`ဖိတ်စာ Emoji ${emoji}`}
              aria-pressed={card.opening.emoji === emoji}
              onClick={() => update({ emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        Animation
        <select
          value={card.opening.animation}
          onChange={(e) =>
            update({ animation: e.target.value as OpeningConfig['animation'] })
          }
        >
          <option value="gentle">ညင်သာစွာ လှုပ်ရှားမယ်</option>
          <option value="sparkles">ကြယ်လေးတွေနဲ့ ဖွင့်မယ်</option>
          <option value="fade">ညင်သာစွာ ပျောက်ကွယ်မယ်</option>
          <option value="none">Animation မထည့်ဘူး</option>
        </select>
      </label>
      <label className="shadow-toggle">
        <input
          type="checkbox"
          checked={card.opening.musicOnOpen}
          onChange={(e) => update({ musicOnOpen: e.target.checked })}
        />{' '}
        ဖိတ်စာဖွင့်ချိန် ရွေးထားတဲ့သံစဉ်ကို ဖွင့်မယ်
      </label>
      <p className="field-hint">
        အမည်တွေကို “ကတ် → စာသား” မှာ ပြင်နိုင်ပါတယ်။ Preview က ခလုတ်ကို
        နှိပ်ပြီး animation စမ်းကြည့်ပါ။ ဒီမှာ သီချင်းမဖွင့်ပါ။
      </p>
    </div>
  )
}
