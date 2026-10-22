import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  Check,
  FolderKanban,
  Images,
  LayoutTemplate,
  Mail,
  Music,
  Palette,
  Type,
} from 'lucide-react'
import type { CardConfig, Occasion } from '../../shared/models/card'
import { occasionSchema } from '../../shared/models/card'
import { changeOccasion, occasions } from '../../shared/templates/templates'
import { templateCatalog } from '../../shared/templates/catalog'
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
import type { ProjectWorkspace } from './hooks/useCreatorDraft'

export type MakerStep =
  | 'templates'
  | 'opening'
  | 'card'
  | 'style'
  | 'pages'
  | 'cake'
  | 'music'
  | 'projects'

type CanvasView = 'opening' | 'cover' | 'pages' | 'cake'

const steps: {
  id: MakerStep
  label: string
  title: string
  hint: string
  icon: typeof LayoutTemplate
  view: CanvasView
}[] = [
  {
    id: 'templates',
    label: 'နမူနာ',
    title: 'နမူနာ ရွေးပါ',
    hint: 'အသင့်ပုံစံတစ်ခုနဲ့ စဦးနော်အောင် — နောင်မှ စိတ်ကြိုက် ပြင်နိုင်ပါတယ်။',
    icon: LayoutTemplate,
    view: 'cover',
  },
  {
    id: 'opening',
    label: 'ဖိတ်စာ',
    title: 'အဖွင့်ဖိတ်စာ',
    hint: 'လက်ခံသူ ပထမဆုံး တွေ့ရမယ့် စာအိတ် သို့မဟုတ် လက်ဆောင်ဘူးလေး။',
    icon: Mail,
    view: 'opening',
  },
  {
    id: 'card',
    label: 'စာသား',
    title: 'ကတ်ထဲက စာသား',
    hint: 'လက်ခံသူအမည်၊ ခေါင်းစဉ်နဲ့ ရင်ထဲက စကားလေးတွေ ရေးပါ။',
    icon: Type,
    view: 'cover',
  },
  {
    id: 'style',
    label: 'အလှဆင်',
    title: 'အရောင်နဲ့ ဖောင့်',
    hint: 'နောက်ခံပုံ၊ အရောင်တွဲနဲ့ စာလုံးပုံစံကို ကတ်နဲ့ လိုက်အောင် ဆင်ပါ။',
    icon: Palette,
    view: 'cover',
  },
  {
    id: 'pages',
    label: 'စာမျက်နှာ',
    title: 'စာမျက်နှာနဲ့ ဓာတ်ပုံ',
    hint: 'မှတ်တမ်းပုံလေးတွေ ကပ်ပါ၊ စာမျက်နှာ ထပ်ပေါင်းပါ။',
    icon: Images,
    view: 'pages',
  },
  {
    id: 'cake',
    label: 'ကိတ်မုန့်',
    title: 'ကိတ်မုန့် အလှဆင်',
    hint: 'မွေးနေ့အတွက် ကိတ်မုန့်လေး ပုံဖော်ပြီး ဖယောင်းတိုင် ထားပါ။',
    icon: Cake,
    view: 'cake',
  },
  {
    id: 'music',
    label: 'သံစဉ်',
    title: 'နောက်ခံ သံစဉ်',
    hint: 'ကတ်ဖွင့်ချိန် တေးလေးတစ်ပုဒ် သည်းခန်းစေချင်လား။',
    icon: Music,
    view: 'cover',
  },
  {
    id: 'projects',
    label: 'ဖိုင်များ',
    title: 'သိမ်းထားတဲ့ ဖိုင်များ',
    hint: 'လက်ရှိကတ်ကို ဆက်ပြင်ပါ၊ ဒါမှမဟုတ် အစ်စ်ပါတ်တွေကို ကွပ်ကြည့်ပါ။',
    icon: FolderKanban,
    view: 'cover',
  },
]

export function CreatorPage({
  card,
  onChange,
  saveStatus,
  onRetrySave,
  workspace,
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
  saveStatus: 'idle' | 'saved' | 'error' | 'blocked'
  onRetrySave: () => void
  workspace?: ProjectWorkspace
}) {
  const [step, setStep] = useState<MakerStep>('card')
  const [view, setView] = useState<CanvasView>('cover')
  const [templateFilter, setTemplateFilter] = useState('all')
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState('cover')

  const cakeEditor = useCakeEditor(card.cake, (cake) =>
    onChange({ ...card, cake }),
  )

  const previewPageId = card.pages.some((page) => page.id === selectedPageId)
    ? selectedPageId
    : 'cover'

  const stepIndex = steps.findIndex((s) => s.id === step)
  const stepDef = steps[stepIndex]
  const isFirst = stepIndex <= 0
  const isLast = stepIndex >= steps.length - 1

  function goTo(target: MakerStep) {
    const def = steps.find((s) => s.id === target)
    setStep(target)
    if (def) setView(def.view)
    if (target !== 'pages') setSelectedPhotoId(null)
  }
  function go(delta: -1 | 1) {
    const next = steps[stepIndex + delta]
    if (next) goTo(next.id)
  }

  const filteredTemplates =
    templateFilter === 'all'
      ? templateCatalog
      : templateCatalog.filter((t) => t.occasion === templateFilter)

  return (
    <div className="maker">
      {['error', 'blocked'].includes(saveStatus) && (
        <DraftStatus status={saveStatus} onRetry={onRetrySave} />
      )}

      {/* Step journey */}
      <nav className="maker-journey" aria-label="ဖန်တီးမှု အဆင့်များ">
        <div className="journey-track" role="list">
          {steps.map((s, i) => (
            <button
              key={s.id}
              className={`journey-step ${i < stepIndex ? 'is-done' : ''}`}
              onClick={() => goTo(s.id)}
              aria-current={i === stepIndex ? 'step' : undefined}
              role="listitem"
            >
              <span className="step-index">
                {i < stepIndex ? <Check size={13} /> : i + 1}
              </span>
              <span className="step-text">{s.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="maker-body">
        {/* The bench — live preview */}
        <section className="maker-stage" aria-label="ကတ် နမူနာ">
          <div
            className="preview-switch"
            role="group"
            aria-label="ကြည့်မယ့် အပိုင်း"
          >
            {(
              [
                { id: 'opening', label: 'ဖိတ်စာ' },
                { id: 'cover', label: 'အဖုံး' },
                {
                  id: 'pages',
                  label: `စာမျက်နှာ${card.pages.length ? ` (${card.pages.length})` : ''}`,
                },
                { id: 'cake', label: 'ကိတ်မုန့်' },
              ] as { id: CanvasView; label: string }[]
            ).map((v) => (
              <button
                key={v.id}
                aria-pressed={view === v.id}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="bench">
            <div className="artboard">
              {view === 'opening' ? (
                <OpeningInvitation
                  opening={card.opening}
                  receiverName={card.receiverName}
                  senderName={card.senderName}
                />
              ) : view === 'cake' ? (
                <CakePreview recipe={card.cake} editor={cakeEditor} />
              ) : (
                <>
                  {view === 'pages' && step === 'pages' && (
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
                  <CardPreview
                    key={previewPageId}
                    card={card}
                    pageId={view === 'pages' ? previewPageId : 'cover'}
                    selectedPhotoId={view === 'pages' ? selectedPhotoId : null}
                    onSelectPhoto={
                      view === 'pages' ? setSelectedPhotoId : undefined
                    }
                    onCommitPhoto={
                      view === 'pages'
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
                </>
              )}
            </div>
          </div>
          <p className="stage-caption">
            {view === 'opening'
              ? 'လက်ခံသူ ပထမဆုံး ဖွင့်တွေ့ရမယ့် အထုပ်'
              : view === 'cake'
                ? 'ကိတ်မုန့် ပုံစံ'
                : 'ကတ်ရဲ့ လက်ရှိပုံစံ'}
          </p>
        </section>

        {/* The working sheet */}
        <section className="maker-panel" aria-labelledby="step-heading">
          <div className="panel-head">
            <span className="step-kicker">
              အဆင့် {stepIndex + 1} / {steps.length}
            </span>
            <h2 id="step-heading">{stepDef.title}</h2>
            <p>{stepDef.hint}</p>
          </div>

          <div className="panel-body">
            {step === 'templates' && (
              <div>
                <div className="shelf-filter">
                  {[
                    { id: 'all', label: 'အားလုံး' },
                    { id: 'birthday', label: '🎂 မွေးနေ့' },
                    { id: 'wedding-invitation', label: '💌 မင်္ဂလာဖိတ်စာ' },
                    { id: 'anniversary', label: '💖 နှစ်ပတ်လည်' },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      className={`filter-pill ${templateFilter === pill.id ? 'active' : ''}`}
                      onClick={() => setTemplateFilter(pill.id)}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
                <div className="shelf-list">
                  {filteredTemplates.map((template) => (
                    <article key={template.id} className="shelf-item">
                      <div>
                        <h3>{template.name}</h3>
                        <p>{template.description}</p>
                        <span className="mini-badge">{template.occasion}</span>
                      </div>
                      <button
                        className="button primary mini-apply-btn"
                        onClick={() =>
                          workspace?.createFromTemplate(template.id)
                        }
                      >
                        ဒီပုံစံနဲ့ စမယ်
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {step === 'opening' && (
              <OpeningFields card={card} onChange={onChange} />
            )}

            {step === 'card' && (
              <div className="fields">
                <label>
                  အခမ်းအနား
                  <select
                    value={card.occasion}
                    onChange={(e) =>
                      onChange(
                        changeOccasion(
                          card,
                          occasionSchema.parse(e.target.value as Occasion),
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
                <WordsFields card={card} onChange={onChange} />
              </div>
            )}

            {step === 'style' && (
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
                  setView('pages')
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

            {step === 'music' && (
              <MusicFields card={card} onChange={onChange} />
            )}

            {step === 'projects' && (
              <div>
                <button
                  className="button primary new-project-btn"
                  onClick={() => workspace?.create('birthday')}
                >
                  + အစကတ် အသစ်
                </button>
                <div className="stack-list">
                  {workspace?.projects
                    .filter((p) => !p.deleted)
                    .map((p) => {
                      const isActive = p.id === workspace.project.id
                      return (
                        <div
                          key={p.id}
                          className={`stack-item ${isActive ? 'active' : ''}`}
                        >
                          <div
                            className="stack-item-click"
                            onClick={() => workspace.open(p.id)}
                          >
                            <h4>{p.name}</h4>
                            <span className="stack-item-time">
                              {new Date(p.updatedAt).toLocaleDateString()}
                            </span>
                            {isActive && (
                              <span className="current-badge">ပြင်နေတယ်</span>
                            )}
                          </div>
                          <button
                            className="icon-button"
                            title="ဖျက်မယ်"
                            aria-label="ဖျက်မယ်"
                            onClick={() => workspace.trash(p.id, true)}
                          >
                            🗑
                          </button>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>

          <div className="panel-foot">
            <button
              className="button ghost"
              onClick={() => go(-1)}
              disabled={isFirst}
            >
              <ArrowLeft size={15} /> အရင်အဆင့်
            </button>
            <div className="step-dots" aria-hidden="true">
              {steps.map((s, i) => (
                <span key={s.id} className={i === stepIndex ? 'on' : ''} />
              ))}
            </div>
            <button
              className="button primary"
              onClick={() => go(1)}
              disabled={isLast}
            >
              နောက်အဆင့် <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
