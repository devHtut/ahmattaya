import type { CardAppearance } from '../../../shared/models/card'
import { palettes } from '../../../shared/templates/card-styles'
import { RotateCcw } from 'lucide-react'

const colorLabels: { key: keyof CardAppearance['colors']; label: string }[] = [
  { key: 'background', label: 'နောက်ခံရောင်' },
  { key: 'surface', label: 'အပေါ်ခံရောင်' },
  { key: 'text', label: 'စာသားရောင်' },
  { key: 'accent', label: 'အလှဆင်ရောင်' },
]

export interface ColorPaletteFieldsProps {
  colors: CardAppearance['colors']
  onChangeColors: (colors: CardAppearance['colors']) => void
  onResetToDefault?: () => void
  isCustomized?: boolean
  legend?: string
  resetButtonText?: string
  showCustomPickers?: boolean
}

export function ColorPaletteFields({
  colors,
  onChangeColors,
  onResetToDefault,
  isCustomized = false,
  legend = 'လိုက်ဖက်တဲ့ အရောင်တွဲများ',
  resetButtonText = 'Cover အရောင်အတိုင်းထားမယ်',
  showCustomPickers = true,
}: ColorPaletteFieldsProps) {
  return (
    <div className="color-palette-fields">
      <fieldset>
        <div
          className="color-palette-legend-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <legend style={{ marginBottom: 0 }}>{legend}</legend>
          {isCustomized && onResetToDefault && (
            <button
              type="button"
              className="text-reset-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: 'var(--accent, #7c3aed)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
              onClick={onResetToDefault}
              title={resetButtonText}
            >
              <RotateCcw size={12} />
              <span>{resetButtonText}</span>
            </button>
          )}
        </div>
        <div className="palette-grid">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              className="palette-choice"
              aria-pressed={colorLabels.every(
                ({ key }) =>
                  colors[key].toLowerCase() ===
                  palette.colors[key].toLowerCase(),
              )}
              onClick={() => onChangeColors({ ...palette.colors })}
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

      {showCustomPickers && (
        <fieldset style={{ marginTop: '12px' }}>
          <legend>Custom Colors</legend>
          <div className="color-controls">
            {colorLabels.map(({ key, label }) => (
              <label className="color-control" key={key}>
                <span>{label}</span>
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) =>
                    onChangeColors({
                      ...colors,
                      [key]: e.target.value,
                    })
                  }
                />
                <span className="hex-value">{colors[key]}</span>
              </label>
            ))}
          </div>
          <p className="field-hint">
            နောက်ခံနဲ့ စာသားရောင် ကွဲကွဲပြားပြား ရွေးပေးရင် ပိုဖတ်ရလွယ်ပါတယ်။
          </p>
        </fieldset>
      )}
    </div>
  )
}
