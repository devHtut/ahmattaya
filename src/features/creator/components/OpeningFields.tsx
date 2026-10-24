import type { CardConfig } from '../../../shared/models/card'
import {
  openingEmojis,
  type OpeningConfig,
} from '../../../shared/models/opening'
import { TEXT_FONTS } from '../../../shared/ui/ElementShapes'
import { getCustomFonts } from '../../../shared/fonts/fonts-catalog'

export function OpeningFields({
  card,
  onChange,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
}) {
  const update = (change: Partial<OpeningConfig>) =>
    onChange({ ...card, opening: { ...card.opening, ...change } })

  const standardFonts = TEXT_FONTS
  const customFonts = getCustomFonts()

  const renderFontSelect = (
    id: string,
    label: string,
    value: string | undefined,
    onChangeFont: (fontId: string) => void,
  ) => (
    <div className="opening-font-row">
      <span className="field-sublabel">{label}</span>
      <select
        id={id}
        className="element-select-dropdown"
        value={value || ''}
        onChange={(e) => onChangeFont(e.target.value)}
      >
        <option value="">မူရင်းဖောင့် (Default)</option>
        <optgroup label="အခြေခံ Fonts (Standard)">
          {standardFonts.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </optgroup>
        {customFonts.length > 0 && (
          <optgroup label={`ထည့်ထားသော မြန်မာ Fonts (${customFonts.length})`}>
            {customFonts.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  )

  const isCustomEmoji = !openingEmojis.includes(
    card.opening.emoji as (typeof openingEmojis)[number],
  )

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
          <option value="envelope">✉️ စာအိတ်လေး (Classic Envelope)</option>
          <option value="gift">🎁 လက်ဆောင်ဘူးလေး (Gift Box)</option>
          <option value="scroll">📜 ရှေးဟောင်း စာလိပ်လေး (Vintage Scroll)</option>
          <option value="heart">💖 အသည်းပုံ ကတ်လေး (Heart Locket)</option>
          <option value="ribbon">🎀 ဖဲကြိုးချည် ဖိတ်စာ (Ribbon Tied Card)</option>
          <option value="gate">🏛️ နန်းတွင်း ခေါက်ဖိတ်စာ (Gatefold Doors)</option>
        </select>
      </label>

      {/* Kicker (A LITTLE SURPRISE FOR YOU) */}
      <div className="opening-section-box">
        <label className="shadow-toggle" style={{ marginBottom: card.opening.showKicker !== false ? '8px' : '0' }}>
          <input
            type="checkbox"
            checked={card.opening.showKicker !== false}
            onChange={(e) => update({ showKicker: e.target.checked })}
          />{' '}
          အထက်ခေါင်းစဉ်ငယ် (Kicker) ပြသမည်
        </label>
        {card.opening.showKicker !== false && (
          <label style={{ marginTop: '8px' }}>
            <span>ခေါင်းစဉ်ငယ် စာသား</span>
            <input
              maxLength={100}
              placeholder="ဥပမာ A LITTLE SURPRISE FOR YOU"
              value={card.opening.kicker ?? 'A LITTLE SURPRISE FOR YOU'}
              onChange={(e) => update({ kicker: e.target.value })}
            />
          </label>
        )}
      </div>

      {/* Title & Font */}
      <div className="opening-section-box">
        <label>
          အဖွင့်ခေါင်းစဉ်
          <input
            maxLength={120}
            value={card.opening.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </label>
        {renderFontSelect(
          'opening-title-font',
          'ခေါင်းစဉ် ဖောင့် (Font)',
          card.opening.titleFont,
          (titleFont) => update({ titleFont }),
        )}
      </div>

      {/* Message & Font */}
      <div className="opening-section-box">
        <label>
          အဖွင့်စာသား
          <textarea
            rows={3}
            maxLength={300}
            value={card.opening.message}
            onChange={(e) => update({ message: e.target.value })}
          />
        </label>
        {renderFontSelect(
          'opening-message-font',
          'အဖွင့်စာသား ဖောင့် (Font)',
          card.opening.messageFont,
          (messageFont) => update({ messageFont }),
        )}
      </div>

      {/* Button & Font */}
      <div className="opening-section-box">
        <label>
          ဖွင့်ရန် ခလုတ်စာသား
          <input
            maxLength={50}
            value={card.opening.buttonText}
            onChange={(e) => update({ buttonText: e.target.value })}
          />
        </label>
        {renderFontSelect(
          'opening-button-font',
          'ခလုတ် ဖောင့် (Font)',
          card.opening.buttonFont,
          (buttonFont) => update({ buttonFont }),
        )}
      </div>

      {/* Colors */}
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

      {/* Emoji Customization */}
      <fieldset className="opening-emoji-picker">
        <legend>အလှဆင် Emoji (ရွေးချယ်ရန် သို့မဟုတ် စိတ်ကြိုက်ထည့်ရန်)</legend>
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
        <div className="custom-emoji-input-wrap">
          <label htmlFor="custom-emoji-input" className="field-sublabel">
            ကိုယ်ပိုင် Emoji (သို့မဟုတ် သင်္ကေတ စာလုံး) ထည့်မည်
          </label>
          <div className="custom-emoji-row">
            <span className="custom-emoji-preview" aria-hidden="true">
              {card.opening.emoji || '✨'}
            </span>
            <input
              id="custom-emoji-input"
              type="text"
              maxLength={10}
              placeholder="ဥပမာ 🌹, 👑, 🥳 သို့မဟုတ် စာလုံး"
              value={isCustomEmoji ? card.opening.emoji : ''}
              onChange={(e) => {
                const val = e.target.value.trim()
                update({ emoji: val || '💌' })
              }}
            />
          </div>
        </div>
      </fieldset>

      {/* Animations */}
      <label>
        Animation
        <select
          value={card.opening.animation}
          onChange={(e) =>
            update({ animation: e.target.value as OpeningConfig['animation'] })
          }
        >
          <option value="gentle">✨ ညင်သာစွာ လှုပ်ရှားမယ် (Gentle Float)</option>
          <option value="sparkles">⭐ ကြယ်လေးတွေနဲ့ ဖွင့်မယ် (Sparkle Stars)</option>
          <option value="confetti">🎉 ရောင်စုံ စက္ကူမှုန်များ ကြဲမယ် (Confetti Burst)</option>
          <option value="hearts">💖 အသည်းပုံလေးများ ပျံဝဲမယ် (Floating Hearts)</option>
          <option value="glow">🌟 ရွှေရောင် အလင်းတန်း ဖြာထွက်မယ် (Golden Glow)</option>
          <option value="bounce">🎈 ခုန်ပေါက် လှုပ်ရှားမယ် (Playful Bounce)</option>
          <option value="fade">🌫️ ညင်သာစွာ ပျောက်ကွယ်မယ် (Smooth Fade)</option>
          <option value="none">🚫 Animation မထည့်ဘူး (None)</option>
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
        အမည်တွေကို “ကတ်အဖုံး & စာမျက်နှာများ” မှာ ပြင်နိုင်ပါတယ်။ Preview က ခလုတ်ကို
        နှိပ်ပြီး animation စမ်းကြည့်နိုင်ပါသည်။ ဒီနေရာတွင် သီချင်းမဖွင့်ပါ။
      </p>
    </div>
  )
}

