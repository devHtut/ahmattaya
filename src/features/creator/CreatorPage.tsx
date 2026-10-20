import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { CardConfig } from '../../shared/models/card'
import { occasionSchema } from '../../shared/models/card'
import { changeOccasion, occasions } from '../../shared/templates/templates'
import { CardPreview } from '../../shared/ui/CardPreview'
import { DraftStatus } from './components/DraftStatus'
import { WordsFields } from './components/WordsFields'
import { StyleFields } from './components/StyleFields'
import { CanvasWorkspace } from './components/CanvasWorkspace'
import { useCakeEditor } from '../cake/lib/useCakeEditor'
import { CakeFields } from '../cake/components/CakeFields'
import { CakePreview } from '../cake/components/CakePreview'
import { OpeningInvitation } from '../../shared/ui/OpeningInvitation'
import { OpeningFields } from './components/OpeningFields'
import { MusicFields } from './components/MusicFields'
import { PagesFields } from './components/PagesFields'

const steps = [
  {
    id: 'opening',
    title: 'အဖွင့်ဖိတ်စာ',
    description: 'ပထမဆုံးမြင်ရမယ့် ဖိတ်စာလေး',
  },
  {
    id: 'card',
    title: 'ကတ်',
    description: 'အခမ်းအနား၊ စကားလေးတွေနဲ့ ပုံစံကို ပြင်ပါ',
  },
  {
    id: 'pages',
    title: 'စာမျက်နှာများ',
    description: 'အမှတ်တရပုံနဲ့ စာမျက်နှာလေးတွေ ထည့်ပါ',
  },
  {
    id: 'music',
    title: 'သီချင်း',
    description: 'အမှတ်တရကို သံစဉ်လေးနဲ့ ဖြည့်ပါ',
  },
  {
    id: 'cake',
    title: 'Cake Studio',
    description: 'ကိုယ်ပိုင် cake design လေး ဖန်တီးပါ',
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
  const [step, setStep] = useState<CreatorStep>('opening')
  const [cardTab, setCardTab] = useState('words')
  const cakeEditor = useCakeEditor(card.cake, (cake) =>
    onChange({ ...card, cake }),
  )
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
      {['error', 'blocked'].includes(saveStatus) && (
        <DraftStatus status={saveStatus} onRetry={onRetrySave} />
      )}
      <nav className="editor-steps" aria-label="ဖန်တီးမှု အဆင့်များ">
        <label className="mobile-step-picker">
          အဆင့် {stepIndex + 1} / {steps.length}
          <select
            aria-label="ဖန်တီးမှုအဆင့် ရွေးရန်"
            value={step}
            onChange={(e) => setStep(e.target.value as CreatorStep)}
          >
            {steps.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <div className="desktop-step-list">
          {steps.map((item, index) => (
            <button
              key={item.id}
              aria-current={step === item.id ? 'step' : undefined}
              onClick={() => setStep(item.id)}
            >
              <span>{index + 1}</span>
              {item.title}
            </button>
          ))}
        </div>
      </nav>
      <div className="studio-grid wizard-grid editor-workspace">
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
            <CakePreview recipe={card.cake} editor={cakeEditor} />
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
          {step === 'card' && (
            <div
              className="card-tool-tabs"
              role="group"
              aria-label="ကတ်ပြင်ဆင်စရာများ"
            >
              {[
                { id: 'words', label: 'စာသား' },
                { id: 'style', label: 'အရောင်နဲ့ စာလုံး' },
                { id: 'occasion', label: 'အခမ်းအနား' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  aria-pressed={cardTab === tab.id}
                  onClick={() => setCardTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          {step === 'card' && cardTab === 'occasion' && (
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
          {step === 'card' && cardTab === 'words' && (
            <WordsFields card={card} onChange={onChange} />
          )}
          {step === 'card' && cardTab === 'style' && (
            <StyleFields card={card} onChange={onChange} />
          )}
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
          {step === 'cake' && (
            <CakeFields
              card={card}
              onChange={(next) => cakeEditor.changeRecipe(next.cake)}
              editor={cakeEditor}
            />
          )}
          {step === 'music' && <MusicFields card={card} onChange={onChange} />}
          <div className="wizard-actions">
            <button
              className="button secondary"
              disabled={stepIndex === 0}
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
