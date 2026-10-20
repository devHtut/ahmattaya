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
import { CanvasWorkspace } from './components/CanvasWorkspace'
import { CakeFields } from '../cake/components/CakeFields'
import { CakePreview } from '../cake/components/CakePreview'
import { OpeningInvitation } from '../../shared/ui/OpeningInvitation'
import { OpeningFields } from './components/OpeningFields'
import { MusicFields } from './components/MusicFields'
import { PagesFields } from './components/PagesFields'

const steps = [
  { id: 'occasion', title: 'အခမ်းအနား', description: 'အထူးနေ့လေးကို ရွေးပါ' },
  {
    id: 'opening',
    title: 'အဖွင့်ဖိတ်စာ',
    description: 'လက်ခံသူ ပထမဆုံးမြင်မယ့် ဖိတ်စာလေး',
  },
  {
    id: 'words',
    title: 'စကားလေးများ',
    description: 'ရင်ထဲက စာသားလေးတွေ ရေးပါ',
  },
  {
    id: 'style',
    title: 'အရောင်နဲ့ စာလုံး',
    description: 'သင့်စိတ်ကြိုက် ပုံစံပြင်ပါ',
  },
  {
    id: 'pages',
    title: 'ပုံနဲ့ စာမျက်နှာများ',
    description: 'အမှတ်တရပုံနဲ့ စာမျက်နှာလေးတွေ ထည့်ပါ',
  },
  {
    id: 'cake',
    title: 'Cake Studio',
    description: 'ကိုယ်ပိုင် cake design လေး ဖန်တီးပါ',
  },
  {
    id: 'music',
    title: 'သံစဉ်လေး',
    description: 'အမှတ်တရကို သံစဉ်လေးနဲ့ ဖြည့်ပါ',
  },
  {
    id: 'review',
    title: 'နမူနာကြည့်မယ်',
    description: 'မပို့ခင် ပြန်စစ်ကြည့်ပါ',
  },
] as const
type CreatorStep = (typeof steps)[number]['id']
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
  const [step, setStep] = useState<CreatorStep>('occasion')
  const stepIndex = steps.findIndex((item) => item.id === step)
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState('cover')
  const previewPageId =
    step === 'pages' && card.pages.some((page) => page.id === selectedPageId)
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
              aria-current={step === item.id ? 'step' : undefined}
              onClick={() => setStep(item.id)}
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
          {step === 'pages' && (
            <CanvasWorkspace
              card={card}
              pageId={previewPageId}
              selectedId={selectedPhotoId}
              onSelect={setSelectedPhotoId}
              onCommit={(id, frame) =>
                onChange({
                  ...card,
                  photos: card.photos.map((photo) =>
                    photo.id === id ? { ...photo, frame } : photo,
                  ),
                })
              }
            />
          )}
          {step === 'opening' ? (
            <OpeningInvitation
              opening={card.opening}
              receiverName={card.receiverName}
              senderName={card.senderName}
            />
          ) : step === 'cake' ? (
            <CakePreview recipe={card.cake} />
          ) : (
            <CardPreview
              key={previewPageId}
              card={card}
              pageId={previewPageId}
              selectedPhotoId={step === 'pages' ? selectedPhotoId : null}
              onSelectPhoto={step === 'pages' ? setSelectedPhotoId : undefined}
              onCommitPhoto={
                step === 'pages'
                  ? (id, frame) =>
                      onChange({
                        ...card,
                        photos: card.photos.map((photo) =>
                          photo.id === id ? { ...photo, frame } : photo,
                        ),
                      })
                  : undefined
              }
            />
          )}
        </details>
        <section
          className="properties wizard-properties"
          aria-labelledby="step-heading"
        >
          <p className="eyebrow step-counter">
            အဆင့် {stepIndex + 1} / {steps.length}
          </p>
          <h2 id="step-heading" ref={headingRef} tabIndex={-1}>
            {steps[stepIndex].title}
          </h2>
          <p className="step-description">{steps[stepIndex].description}</p>
          {step === 'occasion' && (
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
          {step === 'opening' && (
            <OpeningFields card={card} onChange={onChange} />
          )}
          {step === 'words' && <WordsFields card={card} onChange={onChange} />}
          {step === 'style' && <StyleFields card={card} onChange={onChange} />}
          {step === 'pages' && (
            <PagesFields
              card={card}
              onChange={onChange}
              pageId={previewPageId}
              onSelectPage={(id) => {
                setSelectedPageId(id)
                setSelectedPhotoId(null)
              }}
              selectedPhotoId={selectedPhotoId}
              onSelectPhoto={setSelectedPhotoId}
            />
          )}
          {step === 'cake' && <CakeFields card={card} onChange={onChange} />}
          {step === 'music' && <MusicFields card={card} onChange={onChange} />}
          {step === 'review' && (
            <div className="review-panel">
              <p>
                အမည်၊ ဆုတောင်းစာနဲ့ စာလုံးပုံစံတွေကို နမူနာမှာ ပြန်စစ်ကြည့်ပါ။
                နောက်ပြန်သွားပြီး ပြန်ပြင်နိုင်ပါတယ်။
              </p>
              <Link className="button primary" to="/preview">
                <Eye size={17} /> နမူနာ အပြည့်ကြည့်မယ်
              </Link>
              <p className="editor-note">
                ဒီကတ်ကို Publish မလုပ်ရသေးပါ။ သီးသန့် Cake Studio နဲ့ sharing
                တို့ကို နောက်အဆင့်တွေမှာ ဆက်ထည့်ပါမယ်။
              </p>
            </div>
          )}
          <div className="wizard-actions">
            <button
              className="button secondary"
              disabled={step === 'occasion'}
              onClick={() => setStep(steps[stepIndex - 1].id)}
            >
              <ArrowLeft size={16} /> နောက်ပြန်
            </button>
            {stepIndex < steps.length - 1 && (
              <button
                className="button primary"
                onClick={() => setStep(steps[stepIndex + 1].id)}
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
