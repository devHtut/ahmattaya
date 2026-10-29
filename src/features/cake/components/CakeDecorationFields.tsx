import { useState } from 'react'
import {
  candleDesigns,
  MAX_CANDLES,
  MAX_CREAM_STROKES,
  type CakeRecipe,
} from '../../../shared/models/cake'
import type { CakeEditorSession } from '../lib/useCakeEditor'
import { constrainPoint } from '../lib/surface'
import { CakeTopPad } from './CakeTopPad'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

export function CakeDecorationFields({
  recipe,
  editor,
}: {
  recipe: CakeRecipe
  editor: CakeEditorSession
}) {
  const [clearStrokesConfirmOpen, setClearStrokesConfirmOpen] = useState(false)
  const selected = recipe.candles.find(
    (item) => item.id === editor.tools.selectedId,
  )
  const labels = {
    classic: 'ရိုးရိုး',
    spiral: 'Spiral',
    heart: 'Heart',
    star: 'Star',
    number: 'Number',
  }
  const updateSelected = (change: Partial<NonNullable<typeof selected>>) =>
    editor.changeRecipe({
      ...recipe,
      candles: recipe.candles.map((item) =>
        item.id === selected?.id ? { ...item, ...change } : item,
      ),
    })
  return (
    <section className="cake-decoration-fields">
      <h3>Cream နဲ့ Candle အလှဆင်မယ်</h3>
      <div
        className="cake-mode-buttons"
        role="group"
        aria-label="Cake ပြင်ဆင်မှု Mode"
      >
        {(
          [
            { id: 'orbit', label: 'လှည့်ကြည့်မယ်' },
            { id: 'cream', label: 'Cream ဆွဲမယ်' },
            { id: 'candles', label: 'Candle စိုက်မယ်' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            aria-pressed={editor.tools.mode === item.id}
            onClick={() => editor.changeTools({ mode: item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>
      {editor.tools.mode === 'orbit' && (
        <p className="field-hint">
          Cake ပေါ်မှာ ဆွဲပြီး လှည့်ကြည့်နိုင်ပါတယ်။
        </p>
      )}
      {editor.tools.mode === 'cream' && (
        <div className="fields">
          <label className="color-control">
            <span>ဆွဲမယ့် Cream အရောင်</span>
            <input
              type="color"
              value={editor.tools.brushColor}
              onChange={(e) =>
                editor.changeTools({ brushColor: e.target.value })
              }
            />
            <span className="hex-value">{editor.tools.brushColor}</span>
          </label>
          <label>
            ဆွဲတံအထူ — {Math.round(editor.tools.brushWidth * 1000)}
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={editor.tools.brushWidth * 1000}
              onChange={(e) =>
                editor.changeTools({
                  brushWidth: Number(e.target.value) / 1000,
                })
              }
            />
          </label>
          <div className="item-actions">
            <button disabled={!editor.canUndo} onClick={editor.undo}>
              Undo
            </button>
            <button disabled={!editor.canRedo} onClick={editor.redo}>
              Redo
            </button>
            <button
              disabled={!recipe.strokes.length}
              onClick={() => setClearStrokesConfirmOpen(true)}
            >
              Cream အကုန်ဖျက်မယ်
            </button>
          </div>
          <p className="field-hint">
            လမ်းကြောင်း {recipe.strokes.length} / {MAX_CREAM_STROKES} ·
            အပေါ်ဆုံးအလွှာပေါ်မှာ ဆွဲပါ။
          </p>

          <ConfirmDialog
            isOpen={clearStrokesConfirmOpen}
            title="ဆွဲထားတဲ့ Cream လမ်းကြောင်းများ ဖျက်မလား?"
            description="ကိတ်မုန့်ပေါ်တွင် လက်ဖြင့်ဆွဲထားသော Cream လိုင်းအားလုံးကို ဖျက်ပစ်ပါမည်။"
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            icon="trash"
            onConfirm={() => {
              editor.changeRecipe({ ...recipe, strokes: [] })
              setClearStrokesConfirmOpen(false)
            }}
            onClose={() => setClearStrokesConfirmOpen(false)}
          />
        </div>
      )}
      {editor.tools.mode === 'candles' && (
        <div className="fields">
          <label>
            Candle အသစ် Design
            <select
              value={editor.tools.candleDesign}
              onChange={(e) =>
                editor.changeTools({
                  candleDesign: e.target
                    .value as typeof editor.tools.candleDesign,
                })
              }
            >
              {candleDesigns.map((design) => (
                <option key={design} value={design}>
                  {labels[design]}
                </option>
              ))}
            </select>
          </label>
          {editor.tools.candleDesign === 'number' && (
            <label>
              နံပါတ်
              <select
                value={editor.tools.candleDigit}
                onChange={(e) =>
                  editor.changeTools({ candleDigit: Number(e.target.value) })
                }
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="color-control">
            <span>Candle အသစ် အရောင်</span>
            <input
              type="color"
              value={editor.tools.candleColor}
              onChange={(e) =>
                editor.changeTools({ candleColor: e.target.value })
              }
            />
            <span className="hex-value">{editor.tools.candleColor}</span>
          </label>
          <button
            className="button secondary"
            disabled={recipe.candles.length >= MAX_CANDLES}
            onClick={() => editor.actions.onAddCandle({ x: 0, z: 0 })}
          >
            အလယ်မှာ Candle စိုက်မယ်
          </button>
          <p className="field-hint">
            Candle {recipe.candles.length} / {MAX_CANDLES} · Cake မျက်နှာပြင်ကို
            နှိပ်စိုက်၊ Candle ကို ဆွဲရွှေ့ပါ။
          </p>
          <label>
            ပြင်မယ့် Candle
            <select
              value={selected?.id ?? ''}
              onChange={(e) =>
                editor.actions.onSelectCandle(e.target.value || null)
              }
            >
              <option value="">မရွေးရသေးပါ</option>
              {recipe.candles.map((candle, i) => (
                <option key={candle.id} value={candle.id}>
                  Candle {i + 1} · {labels[candle.design]}
                  {candle.design === 'number' ? ` ${candle.digit}` : ''}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <fieldset className="selected-candle">
              <legend>ရွေးထားတဲ့ Candle</legend>
              <div className="fields">
                <label>
                  Design ပြောင်းမယ်
                  <select
                    value={selected.design}
                    onChange={(e) =>
                      updateSelected({
                        design: e.target.value as typeof selected.design,
                      })
                    }
                  >
                    {candleDesigns.map((design) => (
                      <option key={design} value={design}>
                        {labels[design]}
                      </option>
                    ))}
                  </select>
                </label>
                {selected.design === 'number' && (
                  <label>
                    နံပါတ် ပြောင်းမယ်
                    <select
                      value={selected.digit}
                      onChange={(e) =>
                        updateSelected({ digit: Number(e.target.value) })
                      }
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Candle အရောင်
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(e) => updateSelected({ color: e.target.value })}
                  />
                </label>
                <label>
                  ဘယ် / ညာ
                  <input
                    type="range"
                    min="-84"
                    max="84"
                    value={selected.position.x * 100}
                    onChange={(e) =>
                      updateSelected({
                        position: constrainPoint({
                          ...selected.position,
                          x: Number(e.target.value) / 100,
                        }),
                      })
                    }
                  />
                </label>
                <label>
                  အရှေ့ / အနောက်
                  <input
                    type="range"
                    min="-84"
                    max="84"
                    value={selected.position.z * 100}
                    onChange={(e) =>
                      updateSelected({
                        position: constrainPoint({
                          ...selected.position,
                          z: Number(e.target.value) / 100,
                        }),
                      })
                    }
                  />
                </label>
                <button
                  className="button secondary"
                  onClick={() => {
                    editor.changeRecipe({
                      ...recipe,
                      candles: recipe.candles.filter(
                        (item) => item.id !== selected.id,
                      ),
                    })
                    editor.actions.onSelectCandle(null)
                  }}
                >
                  ဒီ Candle ဖျက်မယ်
                </button>
              </div>
            </fieldset>
          )}
        </div>
      )}
      {editor.tools.mode !== 'orbit' && (
        <CakeTopPad
          key={`${editor.tools.mode}-${recipe.tiers}`}
          recipe={recipe}
          editor={editor}
        />
      )}
    </section>
  )
}
