import { BackgroundFields } from './BackgroundFields'
import type { CardAppearance, CardConfig } from '../../../shared/models/card'
import { palettes } from '../../../shared/templates/card-styles'
import { TextStyleFields } from './TextStyleFields'

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
  return (
    <div className="style-fields">
      <BackgroundFields card={card} onChange={onChange} />
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
      <TextStyleFields
        heading={card.appearance.heading}
        body={card.appearance.body}
        onChangeHeading={(change) =>
          onChange({
            ...card,
            appearance: {
              ...card.appearance,
              heading: { ...card.appearance.heading, ...change },
            },
          })
        }
        onChangeBody={(change) =>
          onChange({
            ...card,
            appearance: {
              ...card.appearance,
              body: { ...card.appearance.body, ...change },
            },
          })
        }
        legend="စာလုံးပုံစံ ပြင်မယ်"
        headingLabel="ခေါင်းစဉ်"
        bodyLabel="ဆုတောင်းစာ"
      />
    </div>
  )
}
