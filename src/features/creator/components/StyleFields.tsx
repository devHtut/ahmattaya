import { useState } from 'react'
import type { CardAppearance, CardConfig } from '../../../shared/models/card'
import { fontSchema } from '../../../shared/models/card'
import { palettes } from '../../../shared/templates/card-styles'

const colorLabels: { key: keyof CardAppearance['colors']; label: string }[] = [
  { key: 'background', label: 'နောက်ခံရောင်' },
  { key: 'surface', label: 'အပေါ်ခံရောင်' },
  { key: 'text', label: 'စာသားရောင်' },
  { key: 'accent', label: 'အလှဆင်ရောင်' },
]
export function StyleFields({
  card,
  onChange,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
}) {
  const [target, setTarget] = useState<'heading' | 'body'>('heading')
  const style = card.appearance[target]
  const updateText = (change: Partial<typeof style>) =>
    onChange({
      ...card,
      appearance: { ...card.appearance, [target]: { ...style, ...change } },
    })
  return (
    <div className="style-fields">
      <fieldset>
        <legend>လိုက်ဖက်တဲ့ အရောင်တွဲများ</legend>
        <div className="palette-grid">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              className="palette-choice"
              aria-pressed={colorLabels.every(
                ({ key }) =>
                  card.appearance.colors[key].toLowerCase() ===
                  palette.colors[key].toLowerCase(),
              )}
              onClick={() =>
                onChange({
                  ...card,
                  theme: palette.id,
                  appearance: {
                    ...card.appearance,
                    colors: { ...palette.colors },
                  },
                })
              }
            >
              <span className="palette-swatches" aria-hidden="true">
                {Object.values(palette.colors).map((color, index) => (
                  <span key={index} style={{ backgroundColor: color }} />
                ))}
              </span>
              <span>{palette.name}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>ကိုယ်ပိုင် အရောင်ရွေးမယ်</legend>
        <div className="color-controls">
          {colorLabels.map(({ key, label }) => (
            <label className="color-control" key={key}>
              <span>{label}</span>
              <input
                type="color"
                value={card.appearance.colors[key]}
                onChange={(e) =>
                  onChange({
                    ...card,
                    appearance: {
                      ...card.appearance,
                      colors: {
                        ...card.appearance.colors,
                        [key]: e.target.value,
                      },
                    },
                  })
                }
              />
              <span className="hex-value">{card.appearance.colors[key]}</span>
            </label>
          ))}
        </div>
        <p className="field-hint">
          နောက်ခံနဲ့ စာသားရောင် ကွဲကွဲပြားပြား ရွေးပေးရင် ပိုဖတ်ရလွယ်ပါတယ်။
        </p>
      </fieldset>
      <fieldset>
        <legend>စာလုံးပုံစံ ပြင်မယ်</legend>
        <div className="text-target" role="group" aria-label="ပြင်မယ့် စာသား">
          <button
            aria-pressed={target === 'heading'}
            onClick={() => setTarget('heading')}
          >
            ခေါင်းစဉ်
          </button>
          <button
            aria-pressed={target === 'body'}
            onClick={() => setTarget('body')}
          >
            ဆုတောင်းစာ
          </button>
        </div>
        <div className="fields">
          <label>
            Font
            <select
              value={style.font}
              onChange={(e) =>
                updateText({ font: fontSchema.parse(e.target.value) })
              }
            >
              {fontSchema.options.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <label>
            စာလုံးအရွယ် — {style.size}px
            <input
              type="range"
              min={target === 'heading' ? 18 : 12}
              max={target === 'heading' ? 48 : 24}
              step={1}
              value={style.size}
              onChange={(e) => updateText({ size: Number(e.target.value) })}
            />
          </label>
          <div
            className="text-toggles"
            role="group"
            aria-label="စာလုံး အထူနှင့် အစောင်း"
          >
            <button
              aria-pressed={style.bold}
              onClick={() => updateText({ bold: !style.bold })}
            >
              <strong>Bold</strong>
            </button>
            <button
              aria-pressed={style.italic}
              onClick={() => updateText({ italic: !style.italic })}
            >
              <em>Italic</em>
            </button>
          </div>
          <label>
            စာသား နေရာချမှု
            <select
              value={style.align}
              onChange={(e) =>
                updateText({ align: e.target.value as typeof style.align })
              }
            >
              <option value="left">ဘယ်ဘက်</option>
              <option value="center">အလယ်</option>
              <option value="right">ညာဘက်</option>
            </select>
          </label>
        </div>
        <p className="field-hint">
          မြန်မာစာအတွက် Noto Sans Myanmar သို့မဟုတ် Padauk ရွေးနိုင်ပါတယ်။
          English font ရွေးလည်း မြန်မာစာကို ဆက်ဖတ်နိုင်ပါတယ်။
        </p>
      </fieldset>
    </div>
  )
}
