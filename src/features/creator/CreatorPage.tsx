import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Palette, Type } from 'lucide-react'
import type { CardConfig } from '../../shared/models/card'
import { occasionSchema } from '../../shared/models/card'
import { createCard, occasions } from '../../shared/templates/templates'
import { CardPreview } from '../../shared/ui/CardPreview'

export function CreatorPage({
  card,
  onChange,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
}) {
  const [step, setStep] = useState<'words' | 'style'>('words')
  const activeCard = card
  const update = (change: Partial<CardConfig>) =>
    onChange({ ...activeCard, ...change })
  return (
    <main id="main-content" className="studio page-width">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">CREATOR STUDIO</span>
          <h1>သင့်အမှတ်တရလေး ဖန်တီးပါ</h1>
          <p className="muted">
            ဒီအဆင့်မှာ နမူနာကို စမ်းသပ်နိုင်ပါတယ်။ Refresh လုပ်ရင် draft
            ပျောက်ပါမယ်။
          </p>
        </div>
        <Link className="button secondary" to="/preview">
          <Eye size={17} /> နမူနာကြည့်မယ်
        </Link>
      </div>
      <div className="studio-grid">
        <nav className="studio-tools" aria-label="ပြင်ဆင်ရန် ကိရိယာများ">
          <button
            aria-pressed={step === 'words'}
            onClick={() => setStep('words')}
          >
            <Type size={20} /> စကားလေးများ
          </button>
          <button
            aria-pressed={step === 'style'}
            onClick={() => setStep('style')}
          >
            <Palette size={20} /> အရောင်များ
          </button>
        </nav>
        <section className="preview-panel">
          <div className="panel-caption">
            LIVE PREVIEW <span>နမူနာသာ ဖြစ်ပါတယ်</span>
          </div>
          <CardPreview card={activeCard} />
        </section>
        <section className="properties">
          <h2>
            {step === 'words' ? 'သင့်ရဲ့ စကားလေးတွေ' : 'သင့်စိတ်ကြိုက် အရောင်'}
          </h2>
          {step === 'words' ? (
            <div className="fields">
              <label>
                အခမ်းအနား
                <select
                  value={activeCard.occasion}
                  onChange={(e) => {
                    const occasion = occasionSchema.parse(e.target.value)
                    onChange({
                      ...activeCard,
                      occasion,
                      title: createCard(occasion).title,
                    })
                  }}
                >
                  {occasions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                လက်ခံသူအမည်
                <input
                  maxLength={80}
                  value={activeCard.receiverName}
                  onChange={(e) => update({ receiverName: e.target.value })}
                />
              </label>
              <label>
                ပေးပို့သူအမည်
                <input
                  maxLength={80}
                  value={activeCard.senderName}
                  onChange={(e) => update({ senderName: e.target.value })}
                />
              </label>
              <label>
                ခေါင်းစဉ်
                <input
                  maxLength={160}
                  value={activeCard.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </label>
              <label>
                ရင်ထဲက စကား
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={activeCard.message}
                  onChange={(e) => update({ message: e.target.value })}
                />
              </label>
            </div>
          ) : (
            <div className="theme-options">
              {(['lavender', 'rose', 'gold'] as const).map((theme) => (
                <button
                  className={`theme-option theme-${theme}`}
                  key={theme}
                  aria-pressed={activeCard.theme === theme}
                  onClick={() => update({ theme })}
                >
                  {theme === 'lavender'
                    ? 'ခရမ်းနု'
                    : theme === 'rose'
                      ? 'ပန်းရောင်'
                      : 'ရွှေရောင်'}
                </button>
              ))}
            </div>
          )}
          <p className="editor-note">
            Photo၊ music၊ သိမ်းဆည်းခြင်းနဲ့ publishing ကို နောက်အဆင့်တွေမှာ
            ထည့်သွင်းပါမယ်။
          </p>
        </section>
      </div>
    </main>
  )
}
