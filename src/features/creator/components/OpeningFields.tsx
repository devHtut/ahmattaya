import type { CardConfig } from '../../../shared/models/card'
import {
  openingEmojis,
  type OpeningConfig,
} from '../../../shared/models/opening'
import { TEXT_FONTS } from '../../../shared/ui/ElementShapes'
import { getCustomFonts } from '../../../shared/fonts/fonts-catalog'
import { palettes } from '../../../shared/templates/card-styles'
import { RotateCcw } from 'lucide-react'

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
        <option value="">Default</option>
        <optgroup label="အခြေခံ Fonts (Standard)">
          {standardFonts.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </optgroup>
        {customFonts.length > 0 && (
          <optgroup label={`ထည့်ထားသော မြန်မာ Fonts (${customFonts.length})ခု`}>
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


  return (
    <div className="fields opening-fields">
      <label>
        အမျိုးအစား
        <select
          value={card.opening.style}
          onChange={(e) =>
            update({ style: e.target.value as OpeningConfig['style'] })
          }
        >
          <option value="envelope">✉️ Classic Envelope</option>
          <option value="gift">🎁 Gift Box</option>
          <option value="scroll">📜 Vintage Scroll</option>
          <option value="heart">💖 Heart Locket</option>
          <option value="ribbon">🎀 Ribbon Tied Card</option>
          <option value="gate">🏛️ Gatefold Doors</option>
        </select>
      </label>

      {/* Title & Font */}
      <div className="opening-section-box">
        <label>
          ခေါင်းစဉ်
          <input
            maxLength={120}
            value={card.opening.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </label>
        {renderFontSelect(
          'opening-title-font',
          'Heading Font',
          card.opening.titleFont,
          (titleFont) => update({ titleFont }),
        )}
      </div>

      {/* Message & Font */}
      <div className="opening-section-box">
        <label>
          စာသား
          <textarea
            rows={3}
            maxLength={300}
            value={card.opening.message}
            onChange={(e) => update({ message: e.target.value })}
          />
        </label>
        {renderFontSelect(
          'opening-message-font',
          'Message Font',
          card.opening.messageFont,
          (messageFont) => update({ messageFont }),
        )}
      </div>

      {/* Button & Font */}
      <div className="opening-section-box">
        <label>
          ခလုတ်စာသား
          <input
            maxLength={50}
            value={card.opening.buttonText}
            onChange={(e) => update({ buttonText: e.target.value })}
          />
        </label>
        {renderFontSelect(
          'opening-button-font',
          'Button Font',
          card.opening.buttonFont,
          (buttonFont) => update({ buttonFont }),
        )}
      </div>

      {/* Colors */}
      <fieldset className="opening-colors-section">
        <div
          className="color-palette-legend-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <legend style={{ marginBottom: 0 }}>လိုက်ဖက်တဲ့ အရောင်တွဲများ</legend>
          {!(
            card.opening.background.toLowerCase() ===
              card.appearance.colors.surface.toLowerCase() &&
            card.opening.color.toLowerCase() ===
              card.appearance.colors.background.toLowerCase() &&
            card.opening.sealColor.toLowerCase() ===
              card.appearance.colors.accent.toLowerCase() &&
            card.opening.textColor.toLowerCase() ===
              card.appearance.colors.text.toLowerCase()
          ) && (
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
              onClick={() =>
                update({
                  background: card.appearance.colors.surface,
                  color: card.appearance.colors.background,
                  sealColor: card.appearance.colors.accent,
                  textColor: card.appearance.colors.text,
                })
              }
              title="Cover အရောင်အတိုင်းထားမယ်"
            >
              <RotateCcw size={12} />
              <span>Cover အရောင်အတိုင်းထားမယ်</span>
            </button>
          )}
        </div>

        <div className="palette-grid">
          {palettes.map((palette) => {
            const isSelected =
              card.opening.background.toLowerCase() ===
                palette.colors.surface.toLowerCase() &&
              card.opening.color.toLowerCase() ===
                palette.colors.background.toLowerCase() &&
              card.opening.sealColor.toLowerCase() ===
                palette.colors.accent.toLowerCase() &&
              card.opening.textColor.toLowerCase() ===
                palette.colors.text.toLowerCase()

            return (
              <button
                key={palette.id}
                type="button"
                className="palette-choice"
                aria-pressed={isSelected}
                onClick={() =>
                  update({
                    background: palette.colors.surface,
                    color: palette.colors.background,
                    sealColor: palette.colors.accent,
                    textColor: palette.colors.text,
                  })
                }
              >
                <span className="palette-swatches" aria-hidden="true">
                  <span style={{ backgroundColor: palette.colors.surface }} />
                  <span style={{ backgroundColor: palette.colors.background }} />
                  <span style={{ backgroundColor: palette.colors.accent }} />
                  <span style={{ backgroundColor: palette.colors.text }} />
                </span>
                <span>{palette.name}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset style={{ marginTop: '12px' }}>
        <legend>ကိုယ်ပိုင် အရောင်ရွေးမယ်</legend>
        <div className="color-controls">
          {(
            [
              { key: 'background', label: 'နောက်ခံအရောင်' },
              { key: 'color', label: 'စာအိတ် / ဘူးအရောင်' },
              { key: 'sealColor', label: 'Seal / ဖဲကြိုးအရောင်' },
              { key: 'textColor', label: 'စာသားအရောင်' },
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
        <p className="field-hint">
          နောက်ခံနဲ့ စာသားရောင် ကွဲကွဲပြားပြား ရွေးပေးရင် ပိုဖတ်ရလွယ်ပါတယ်။
        </p>
      </fieldset>

      {/* Emoji Customization */}
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

      {/* Animations */}
      <label>
        Animation
        <select
          value={card.opening.animation}
          onChange={(e) =>
            update({ animation: e.target.value as OpeningConfig['animation'] })
          }
        >
          <option value="gentle">✨ Gentle Float</option>
          <option value="sparkles">⭐ Sparkle Stars</option>
          <option value="confetti">🎉 Confetti Burst</option>
          <option value="hearts">💖 Floating Hearts</option>
          <option value="glow">🌟 Golden Glow</option>
          <option value="bounce">🎈 Playful Bounce</option>
          <option value="fade">🌫️ Smooth Fade</option>
          <option value="none">🚫 None</option>
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
        အမည်တွေကို “ကတ်အဖုံး & စာမျက်နှာများ” မှာ ပြင်နိုင်ပါတယ်။ Preview ခလုတ်ကို
        နှိပ်ပြီး animation စမ်းကြည့်နိုင်ပါသည်။ ဒီနေရာတွင် သံစဥ်မပွင့်လာသေးပါ။
      </p>
    </div>
  )
}

