import type { CardConfig } from '../../../shared/models/card'
import { cakeFlavors, type CakeRecipe } from '../../../shared/models/cake'
import { cakeFromPreset, cakePresets } from '../lib/presets'
import { CakeIllustration } from './CakeIllustration'

export function CakeFields({
  card,
  onChange,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
}) {
  const update = (change: Partial<CakeRecipe>) =>
    onChange({ ...card, cake: { ...card.cake, ...change } })
  return (
    <div className="cake-fields">
      <label className="shadow-toggle">
        <input
          type="checkbox"
          checked={card.cake.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
        />{' '}
        ဒီအမှတ်တရမှာ Cake ထည့်မယ်
      </label>
      {!card.cake.enabled && (
        <p className="field-hint">
          Cake မလိုရင် ဒီအဆင့်ကို ကျော်နိုင်ပါတယ်။ ပြင်ထားတဲ့ settings တွေ
          ဆက်သိမ်းထားပေးပါတယ်။
        </p>
      )}
      {card.cake.enabled && (
        <>
          <fieldset className="cake-preset-picker">
            <legend>အသင့်သုံး design ရွေးမယ်</legend>
            <div className="cake-preset-grid">
              {cakePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() =>
                    onChange({ ...card, cake: cakeFromPreset(preset.id) })
                  }
                >
                  <CakeIllustration recipe={preset.recipe} />
                  <strong>{preset.name}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
            <button
              className="button secondary cake-scratch"
              onClick={() =>
                onChange({ ...card, cake: cakeFromPreset('blank') })
              }
            >
              အကြမ်းထည်ကနေ စမယ်
            </button>
            <p className="field-hint">
              Design အသစ်ရွေးရင် လက်ရှိ Cake settings ကို အစားထိုးပါမယ်။
              အတွင်းစာမျက်နှာတွေ မပြောင်းပါ။
            </p>
          </fieldset>
          <div className="fields">
            <label>
              Cake သား
              <select
                value={card.cake.flavor}
                onChange={(e) =>
                  update({ flavor: e.target.value as CakeRecipe['flavor'] })
                }
              >
                {cakeFlavors.map((flavor) => (
                  <option key={flavor} value={flavor}>
                    {flavor === 'vanilla'
                      ? 'Vanilla · ဗနီလာ'
                      : flavor === 'chocolate'
                        ? 'Chocolate · ချောကလက်'
                        : 'Strawberry · စတော်ဘယ်ရီ'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              အလွှာအရေအတွက်
              <select
                value={card.cake.tiers}
                onChange={(e) =>
                  update({
                    tiers: Number(e.target.value) as CakeRecipe['tiers'],
                  })
                }
              >
                <option value={1}>၁ ထပ်</option>
                <option value={2}>၂ ထပ်</option>
                <option value={3}>၃ ထပ်</option>
              </select>
            </label>
            <div className="color-controls">
              <label className="color-control">
                <span>Cream အရောင်</span>
                <input
                  type="color"
                  value={card.cake.creamColor}
                  onChange={(e) => update({ creamColor: e.target.value })}
                />
                <span className="hex-value">{card.cake.creamColor}</span>
              </label>
              <label className="color-control">
                <span>အလှဆင် အရောင်</span>
                <input
                  type="color"
                  value={card.cake.accentColor}
                  onChange={(e) => update({ accentColor: e.target.value })}
                />
                <span className="hex-value">{card.cake.accentColor}</span>
              </label>
            </div>
            <label>
              အခြေခံအလှဆင်
              <select
                value={card.cake.decoration}
                onChange={(e) =>
                  update({
                    decoration: e.target.value as CakeRecipe['decoration'],
                  })
                }
              >
                <option value="plain">အလွတ်</option>
                <option value="pearls">Cream ပုလဲလေးတွေ</option>
                <option value="berries">Berry လေးတွေ</option>
              </select>
            </label>
          </div>
          <p className="editor-note">
            Cream ကိုယ်တိုင်ဆွဲခြင်းနဲ့ Candle design / နေရာချခြင်းကို
            နောက်အဆင့်မှာ ထည့်ပါမယ်။
          </p>
        </>
      )}
    </div>
  )
}
