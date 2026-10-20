import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react'
import type { CardConfig } from '../../shared/models/card'
import { occasionSchema } from '../../shared/models/card'
import { changeOccasion, occasions } from '../../shared/templates/templates'
import { CardPreview } from '../../shared/ui/CardPreview'
import { DraftStatus } from './components/DraftStatus'
import { WordsFields } from './components/WordsFields'
import { StyleFields } from './components/StyleFields'
import { PagesFields } from './components/PagesFields'

const steps = [
  { title: 'အခမ်းအနား', description: 'အထူးနေ့လေးကို ရွေးပါ' },
  { title: 'စကားလေးများ', description: 'ရင်ထဲက စာသားလေးတွေ ရေးပါ' },
  { title: 'အရောင်နဲ့ စာလုံး', description: 'သင့်စိတ်ကြိုက် ပုံစံပြင်ပါ' },
  {
    title: 'ပုံနဲ့ စာမျက်နှာများ',
    description: 'အမှတ်တရပုံနဲ့ စာမျက်နှာလေးတွေ ထည့်ပါ',
  },
  { title: 'နမူနာကြည့်မယ်', description: 'မပို့ခင် ပြန်စစ်ကြည့်ပါ' },
]
export function CreatorPage({
  card,
  onChange,
  saveStatus,
  onRetrySave,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
  saveStatus: 'idle' | 'saved' | 'error' | 'blocked'
  onRetrySave: () => void
}) {
  const [step, setStep] = useState(0)
  const [selectedPageId, setSelectedPageId] = useState('cover')
  const previewPageId =
    step === 3 && card.pages.some((page) => page.id === selectedPageId)
      ? selectedPageId
      : 'cover'
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)
  useEffect(() => {
    if (previousStep.current !== step) headingRef.current?.focus()
    previousStep.current = step
  }, [step])
  return (
    <main id="main-content" className="studio page-width">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">CREATOR STUDIO</span>
          <h1>သင့်အမှတ်တရလေး ဖန်တီးပါ</h1>
          <p className="muted">
            တစ်ဆင့်ချင်း ဖန်တီးပါ။ ပြင်သမျှကို ဒီ browser ထဲမှာ သိမ်းပေးပါတယ်။
          </p>
        </div>
        <Link className="button secondary" to="/preview">
          <Eye size={17} /> နမူနာကြည့်မယ်
        </Link>
      </div>
      <DraftStatus status={saveStatus} onRetry={onRetrySave} />
      <div className="studio-grid wizard-grid">
        <nav
          className="studio-tools wizard-steps"
          aria-label="ဖန်တီးမှု အဆင့်များ"
        >
          {steps.map((item, index) => (
            <button
              key={item.title}
              aria-current={step === index ? 'step' : undefined}
              onClick={() => setStep(index)}
            >
              <span className="step-number">{index + 1}</span>
              <span>{item.title}</span>
            </button>
          ))}
        </nav>
        <details className="preview-panel expandable-preview" open>
          <summary>
            LIVE PREVIEW <span>ဖွင့် / ပိတ် ကြည့်နိုင်ပါတယ်</span>
          </summary>
          <CardPreview card={card} pageId={previewPageId} />
        </details>
        <section
          className="properties wizard-properties"
          aria-labelledby="step-heading"
        >
          <p className="eyebrow step-counter">
            အဆင့် {step + 1} / {steps.length}
          </p>
          <h2 id="step-heading" ref={headingRef} tabIndex={-1}>
            {steps[step].title}
          </h2>
          <p className="step-description">{steps[step].description}</p>
          {step === 0 && (
            <div className="fields">
              <label>
                အခမ်းအနား
                <select
                  value={card.occasion}
                  onChange={(e) =>
                    onChange(
                      changeOccasion(
                        card,
                        occasionSchema.parse(e.target.value),
                      ),
                    )
                  }
                >
                  {occasions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.icon} {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="editor-note">
                အခမ်းအနား ပြောင်းလည်း ကိုယ်ရေးထားတဲ့ စာသားနဲ့ အရောင်တွေ
                ဆက်ရှိနေပါမယ်။
              </p>
            </div>
          )}
          {step === 1 && <WordsFields card={card} onChange={onChange} />}
          {step === 2 && <StyleFields card={card} onChange={onChange} />}
          {step === 3 && (
            <PagesFields
              card={card}
              onChange={onChange}
              pageId={previewPageId}
              onSelectPage={setSelectedPageId}
            />
          )}
          {step === 4 && (
            <div className="review-panel">
              <p>
                အမည်၊ ဆုတောင်းစာနဲ့ စာလုံးပုံစံတွေကို နမူနာမှာ ပြန်စစ်ကြည့်ပါ။
                နောက်ပြန်သွားပြီး ပြန်ပြင်နိုင်ပါတယ်။
              </p>
              <Link className="button primary" to="/preview">
                <Eye size={17} /> နမူနာ အပြည့်ကြည့်မယ်
              </Link>
              <p className="editor-note">
                ဒီကတ်ကို Publish မလုပ်ရသေးပါ။ သီးသန့် Cake Studio၊ music နဲ့
                sharing တို့ကို နောက်အဆင့်တွေမှာ ဆက်ထည့်ပါမယ်။
              </p>
            </div>
          )}
          <div className="wizard-actions">
            <button
              className="button secondary"
              disabled={step === 0}
              onClick={() => setStep((value) => value - 1)}
            >
              <ArrowLeft size={16} /> နောက်ပြန်
            </button>
            {step < steps.length - 1 && (
              <button
                className="button primary"
                onClick={() => setStep((value) => value + 1)}
              >
                နောက်တစ်ဆင့် <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
