import { useState } from 'react'
import { fontSchema } from '../../../shared/models/card'
import { TEXT_FONTS } from '../../../shared/ui/ElementShapes'
import { getCustomFonts } from '../../../shared/fonts/fonts-catalog'
import { RotateCcw } from 'lucide-react'

export interface TextStyleValue {
  font: string
  size: number
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
}

interface TextStyleFieldsProps {
  heading: TextStyleValue
  body: TextStyleValue
  onChangeHeading: (change: Partial<TextStyleValue>) => void
  onChangeBody: (change: Partial<TextStyleValue>) => void
  onResetToDefault?: () => void
  isCustomized?: boolean
  legend?: string
  headingLabel?: string
  bodyLabel?: string
}

export function TextStyleFields({
  heading,
  body,
  onChangeHeading,
  onChangeBody,
  onResetToDefault,
  isCustomized = false,
  legend = 'စာလုံးပုံစံ ပြင်မယ်',
  headingLabel = 'ခေါင်းစဉ်',
  bodyLabel = 'ဆုတောင်းစာ',
}: TextStyleFieldsProps) {
  const [target, setTarget] = useState<'heading' | 'body'>('heading')
  const style = target === 'heading' ? heading : body
  const updateCurrentText = (change: Partial<TextStyleValue>) => {
    if (target === 'heading') {
      onChangeHeading(change)
    } else {
      onChangeBody(change)
    }
  }

  const standardFonts = TEXT_FONTS
  const customFonts = getCustomFonts()

  return (
    <fieldset className="text-style-fieldset">
      <div className="text-style-legend-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
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
            title="Cover စတိုင်အတိုင်း ပြန်ထားမယ်"
          >
            <RotateCcw size={12} />
            <span>Cover စတိုင်အတိုင်းထားမယ်</span>
          </button>
        )}
      </div>

      <div className="text-target" role="group" aria-label="ပြင်မယ့် စာသား">
        <button
          type="button"
          aria-pressed={target === 'heading'}
          onClick={() => setTarget('heading')}
        >
          {headingLabel}
        </button>
        <button
          type="button"
          aria-pressed={target === 'body'}
          onClick={() => setTarget('body')}
        >
          {bodyLabel}
        </button>
      </div>

      <div className="fields">
        <label>
          Font
          <select
            value={style.font}
            onChange={(e) =>
              updateCurrentText({ font: fontSchema.parse(e.target.value) })
            }
          >
            <optgroup label="အခြေခံ Fonts (Standard)">
              {standardFonts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </optgroup>
            {customFonts.length > 0 && (
              <optgroup
                label={`ထည့်ထားသော မြန်မာ Fonts (${customFonts.length})ခု`}
              >
                {customFonts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </optgroup>
            )}
            {!standardFonts.some((f) => f.id === style.font) &&
              !customFonts.some((f) => f.id === style.font) && (
                <option value={style.font}>{style.font}</option>
              )}
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
            onChange={(e) =>
              updateCurrentText({ size: Number(e.target.value) })
            }
          />
        </label>

        <div
          className="text-toggles"
          role="group"
          aria-label="စာလုံး အထူနှင့် အစောင်း"
        >
          <button
            type="button"
            aria-pressed={style.bold}
            onClick={() => updateCurrentText({ bold: !style.bold })}
          >
            <strong>Bold</strong>
          </button>
          <button
            type="button"
            aria-pressed={style.italic}
            onClick={() => updateCurrentText({ italic: !style.italic })}
          >
            <em>Italic</em>
          </button>
        </div>

        <label>
          စာသား နေရာချမှု
          <select
            value={style.align}
            onChange={(e) =>
              updateCurrentText({
                align: e.target.value as TextStyleValue['align'],
              })
            }
          >
            <option value="left">ဘယ်ဘက်</option>
            <option value="center">အလယ်</option>
            <option value="right">ညာဘက်</option>
          </select>
        </label>
      </div>
    </fieldset>
  )
}
