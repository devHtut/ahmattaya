import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Music,
  Palette,
  Plus,
  Send,
  Share2,
  Sparkles,
} from 'lucide-react'
import {
  MAX_PAGES,
  type CardConfig,
  type Occasion,
} from '../../shared/models/card'
import { occasions } from '../../shared/templates/templates'
import { CardPreview } from '../../shared/ui/CardPreview'
import { DraftStatus } from './components/DraftStatus'
import { EventFields } from './components/EventFields'
import { CanvasWorkspace } from './components/CanvasWorkspace'
import { useCakeEditor } from '../cake/lib/useCakeEditor'
import { CakeFields } from '../cake/components/CakeFields'
import { CakePreview } from '../cake/components/CakePreview'
import { WeddingEventCard } from '../receiver/components/WeddingEventCard'
import { AnniversaryTimeline } from '../receiver/components/AnniversaryTimeline'
import { OpeningInvitation } from '../../shared/ui/OpeningInvitation'
import { OpeningFields } from './components/OpeningFields'
import { MusicFields } from './components/MusicFields'
import { PagesFields } from './components/PagesFields'
import { CloudConnection } from '../publishing/CloudConnection'
import { createPage } from './lib/pages'
import type { ProjectWorkspace } from './hooks/useCreatorDraft'

export type MakerStep =
  'opening' | 'pages' | 'event' | 'cake' | 'music' | 'publish'

type CanvasView = 'opening' | 'pages' | 'cake' | 'event'

type StepDefinition = {
  id: MakerStep
  label: string
  title: string
  hint: string
  icon: typeof Mail
  view: CanvasView
}

function getSteps(occasion: Occasion): StepDefinition[] {
  const isBirthday = occasion === 'birthday'
  const isAnniversary = occasion === 'anniversary'
  const isWedding = occasion === 'wedding-invitation'

  const eventLabel = isBirthday
    ? 'မွေးနေ့မှတ်တမ်း'
    : isAnniversary
      ? 'အမှတ်တရ'
      : 'အစီအစဉ်'

  const eventTitle = isBirthday
    ? 'မွေးနေ့ အမှတ်တရ မှတ်တမ်း'
    : isAnniversary
      ? 'နှစ်ပတ်လည် အမှတ်တရ မှတ်တမ်း'
      : isWedding
        ? 'မင်္ဂလာပွဲ အစီအစဉ်'
        : 'ပွဲအစီအစဉ်'

  const eventHint = isBirthday
    ? 'ယခုမွေးနေ့နှင့် လွန်ခဲ့သောနှစ်များက မွေးနေ့အမှတ်တရပုံရိပ် Timeline ကို ပြင်ဆင်ပါ။'
    : isAnniversary
      ? 'နှစ်ပတ်လည် မင်္ဂလာသက်တမ်းနှင့် အတူဖြတ်သန်းခဲ့သော အမှတ်တရ Timeline ကို ပြင်ဆင်ပါ။'
      : isWedding
        ? 'မင်္ဂလာရက်၊ ခန်းမ၊ Google Maps နှင့် RSVP ဧည့်စာရင်း အချက်အလက်များ။'
        : 'ပွဲရက်စွဲ၊ အစီအစဉ်နှင့် အမှတ်တရ အချက်အလက်များ။'

  return [
    {
      id: 'opening',
      label: 'ဖိတ်စာ',
      title: 'အဖွင့်ဖိတ်စာ',
      hint: 'လက်ခံသူ ပထမဆုံး တွေ့ရမယ့် စာအိတ် သို့မဟုတ် လက်ဆောင်ဘူးလေး။',
      icon: Mail,
      view: 'opening',
    },
    {
      id: 'pages',
      label: 'စာမျက်နှာများ',
      title: 'ကတ်အဖုံးနှင့် စာမျက်နှာများ',
      hint: 'ကတ်အဖုံးနှင့် စာမျက်နှာများ၏ စာသား၊ နောက်ခံ၊ အရောင်နှင့် ဓာတ်ပုံများကို ပြင်ဆင်ပါ။',
      icon: Palette,
      view: 'pages',
    },
    {
      id: 'event',
      label: eventLabel,
      title: eventTitle,
      hint: eventHint,
      icon: Calendar,
      view: 'event',
    },
    {
      id: 'cake',
      label: 'ကိတ်မုန့်',
      title: 'ကိတ်မုန့် အလှဆင်',
      hint: 'ကိတ်မုန့်လေး ပုံဖော်ပြီး ဖယောင်းတိုင်လေးတွေ စိုက်ပါ။',
      icon: Cake,
      view: 'cake',
    },
    {
      id: 'music',
      label: 'သံစဉ်',
      title: 'နောက်ခံ သံစဉ်',
      hint: 'ကတ်ဖွင့်ချိန် သံစဥ်လေးတပုဒ် ပွင့်လာစေမယ်။',
      icon: Music,
      view: 'pages',
    },
    {
      id: 'publish',
      label: 'မျှဝေမယ်',
      title: 'စစ်ဆေး & မျှဝေမယ်',
      hint: 'ကတ်လေးကို အစအဆုံး စစ်ဆေးပြီး Reviewer သို့မဟုတ် လက်ခံသူထံ မျှဝေလိုက်ပါ။',
      icon: Send,
      view: 'pages',
    },
  ]
}

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
  const [step, setStep] = useState<MakerStep>('pages')
  const [view, setView] = useState<CanvasView>('pages')
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState('cover')
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const cakeEditor = useCakeEditor(card.cake, (cake) =>
    onChange({ ...card, cake }),
  )

  const previewPageId = card.pages.some((page) => page.id === selectedPageId)
    ? selectedPageId
    : 'cover'

  const cakePlacement = card.cake.placement || 'end'
  const hasValidPagePlacement =
    cakePlacement !== 'end' &&
    (cakePlacement === 'cover' ||
      card.pages.some((p) => p.id === cakePlacement))
  const effectiveCakePlacement = hasValidPagePlacement ? cakePlacement : 'end'

  const allPageIds = ['cover', ...card.pages.map((p) => p.id)]
  const currentPageIndex = Math.max(0, allPageIds.indexOf(previewPageId))
  const totalPagesCount = allPageIds.length

  function handlePrevPage() {
    if (currentPageIndex > 0) {
      setSelectedPageId(allPageIds[currentPageIndex - 1])
      setSelectedPhotoId(null)
      setSelectedElementId(null)
    }
  }

  function handleNextPage() {
    if (currentPageIndex < totalPagesCount - 1) {
      setSelectedPageId(allPageIds[currentPageIndex + 1])
      setSelectedPhotoId(null)
      setSelectedElementId(null)
    }
  }

  function handleAddNewPage() {
    if (card.pages.length < MAX_PAGES) {
      const next = createPage(crypto.randomUUID())
      onChange({ ...card, pages: [...card.pages, next] })
      setSelectedPageId(next.id)
      setSelectedPhotoId(null)
      setSelectedElementId(null)
      setView('pages')
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return
    const diffX = e.changedTouches[0].clientX - touchStartX
    if (diffX > 45) {
      handlePrevPage()
    } else if (diffX < -45) {
      handleNextPage()
    }
    setTouchStartX(null)
  }

  const steps = useMemo(() => getSteps(card.occasion), [card.occasion])
  const stepIndex = Math.max(0, steps.findIndex((s) => s.id === step))
  const stepDef = steps[stepIndex] ?? steps[0]
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
                {
                  id: 'pages',
                  label: `ကတ်ပြား${card.pages.length ? ` (${card.pages.length + 1} မျက်နှာ)` : ''}`,
                },
                ...(card.occasion === 'wedding-invitation'
                  ? [{ id: 'event' as CanvasView, label: 'မင်္ဂလာပွဲ' }]
                  : card.occasion === 'anniversary' ||
                    (card.occasion === 'birthday' &&
                      card.event?.anniversary?.enabled)
                    ? [
                      {
                        id: 'event' as CanvasView,
                        label:
                          card.occasion === 'birthday'
                            ? 'မွေးနေ့မှတ်တမ်း'
                            : 'မှတ်တမ်း',
                      },
                    ]
                    : []),
                { id: 'cake', label: 'ကိတ်မုန့်' },
              ] as { id: CanvasView; label: string }[]
            ).map((v) => (
              <button
                key={v.id}
                aria-pressed={view === v.id}
                onClick={() => {
                  setView(v.id)
                  if (v.id === 'event') {
                    setStep('event')
                  } else if (v.id === 'cake') {
                    setStep('cake')
                  } else if (v.id === 'opening') {
                    setStep('opening')
                  } else if (
                    v.id === 'pages' &&
                    (step === 'event' || step === 'cake' || step === 'opening')
                  ) {
                    setStep('pages')
                  }
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div
            className="bench"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {view === 'pages' && (
              <>
                <button
                  type="button"
                  className="canvas-flip-arrow prev"
                  disabled={currentPageIndex <= 0}
                  onClick={handlePrevPage}
                  title="ရှေ့စာမျက်နှာသို့ လှန်မယ်"
                  aria-label="ရှေ့စာမျက်နှာ"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  type="button"
                  className="canvas-flip-arrow next"
                  disabled={currentPageIndex >= totalPagesCount - 1}
                  onClick={handleNextPage}
                  title="နောက်စာမျက်နှာသို့ လှန်မယ်"
                  aria-label="နောက်စာမျက်နှာ"
                >
                  <ChevronRight size={24} />
                </button>

                {card.pages.length < MAX_PAGES && (
                  <button
                    type="button"
                    className="canvas-add-page-floating"
                    onClick={handleAddNewPage}
                    title="စာမျက်နှာသစ် ထည့်မယ် (+)"
                  >
                    <Plus size={16} />
                    <span className="floating-text">စာမျက်နှာသစ်</span>
                  </button>
                )}
              </>
            )}

            <div className="artboard">
              {view === 'opening' ? (
                <OpeningInvitation
                  opening={card.opening}
                  receiverName={card.receiverName}
                  senderName={card.senderName}
                />
              ) : view === 'cake' ? (
                <CakePreview recipe={card.cake} editor={cakeEditor} />
              ) : view === 'event' ? (
                <div className="bench-event-preview">
                  {card.occasion === 'wedding-invitation' ? (
                    <WeddingEventCard
                      wedding={card.event?.wedding}
                      cardId={workspace?.project.id}
                      coupleNames={card.title}
                    />
                  ) : card.occasion === 'anniversary' ||
                    (card.occasion === 'birthday' &&
                      card.event?.anniversary?.enabled) ? (
                    <AnniversaryTimeline
                      anniversary={card.event?.anniversary}
                      coupleNames={card.title}
                      colors={card.event?.anniversary?.colors ?? card.appearance.colors}
                      isBirthday={card.occasion === 'birthday'}
                    />
                  ) : (
                    <div className="bench-event-empty">
                      <p>
                        မင်္ဂလာဖိတ်စာ၊ နှစ်ပတ်လည် သို့မဟုတ် မွေးနေ့မှတ်တမ်း
                        ဖွင့်ထားသော ကတ်များတွင်သာ အစီအစဉ် အထူးကဏ္ဍများ
                        ပါဝင်ပါသည်။
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {view === 'pages' && step === 'pages' && (
                    <CanvasWorkspace
                      card={card}
                      pageId={previewPageId}
                      onSelectPage={(id) => {
                        setSelectedPageId(id)
                        setSelectedPhotoId(null)
                        setSelectedElementId(null)
                      }}
                      selectedId={selectedPhotoId}
                      onSelect={(id) => {
                        setSelectedPhotoId(id)
                        if (id) setSelectedElementId(null)
                      }}
                      onCommit={(id, frame) =>
                        onChange({
                          ...card,
                          photos: card.photos.map((photo) =>
                            photo.id === id ? { ...photo, frame } : photo,
                          ),
                        })
                      }
                      selectedElementId={selectedElementId}
                      onSelectElement={(id) => {
                        setSelectedElementId(id)
                        if (id) setSelectedPhotoId(null)
                      }}
                      onCommitElement={(id, frame) =>
                        onChange({
                          ...card,
                          elements: (card.elements ?? []).map((el) =>
                            el.id === id ? { ...el, frame } : el,
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
                      view === 'pages'
                        ? (id) => {
                          setSelectedPhotoId(id)
                          if (id) setSelectedElementId(null)
                        }
                        : undefined
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
                    selectedElementId={view === 'pages' ? selectedElementId : null}
                    onSelectElement={
                      view === 'pages'
                        ? (id) => {
                          setSelectedElementId(id)
                          if (id) setSelectedPhotoId(null)
                        }
                        : undefined
                    }
                    onCommitElement={
                      view === 'pages'
                        ? (id, frame) =>
                          onChange({
                            ...card,
                            elements: (card.elements ?? []).map((el) =>
                              el.id === id ? { ...el, frame } : el,
                            ),
                          })
                        : undefined
                    }
                  />
                </>
              )}
            </div>
          </div>

          {view === 'pages' && (
            <div
              className="card-stage-pagination"
              role="tablist"
              aria-label="စာမျက်နှာ ရွေးချယ်ရန်"
            >
              <button
                type="button"
                className={`stage-page-dot ${selectedPageId === 'cover' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPageId('cover')
                  setSelectedPhotoId(null)
                  setSelectedElementId(null)
                }}
                title="ကတ်အဖုံး"
              >
                📇 အဖုံး
              </button>

              {card.cake.enabled && effectiveCakePlacement === 'cover' && (
                <button
                  type="button"
                  className="stage-page-dot cake-indicator"
                  onClick={() => {
                    setView('cake')
                    setStep('cake')
                  }}
                  title="ကိတ်မုန့် (မျက်နှာဖုံး အပြီးတွင် ပေါ်မည်)"
                >
                  🎂 ကိတ်
                </button>
              )}

              {card.pages.map((p, idx) => (
                <Fragment key={p.id}>
                  <button
                    type="button"
                    className={`stage-page-dot ${selectedPageId === p.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPageId(p.id)
                      setSelectedPhotoId(null)
                      setSelectedElementId(null)
                    }}
                    title={p.title || `စာမျက်နှာ ${idx + 1}`}
                  >
                    📄 {idx + 1}
                  </button>
                  {card.cake.enabled && effectiveCakePlacement === p.id && (
                    <button
                      type="button"
                      className="stage-page-dot cake-indicator"
                      onClick={() => {
                        setView('cake')
                        setStep('cake')
                      }}
                      title={`ကိတ်မုန့် (စာမျက်နှာ ${idx + 1} အပြီးတွင် ပေါ်မည်)`}
                    >
                      🎂 ကိတ်
                    </button>
                  )}
                </Fragment>
              ))}

              {card.cake.enabled && effectiveCakePlacement === 'end' && (
                <button
                  type="button"
                  className="stage-page-dot cake-indicator"
                  onClick={() => {
                    setView('cake')
                    setStep('cake')
                  }}
                  title="ကိတ်မုန့် (ကတ်ရဲ့ နောက်ဆုံးတွင် ပေါ်မည်)"
                >
                  🎂 ကိတ်
                </button>
              )}

              {card.pages.length < MAX_PAGES && (
                <button
                  type="button"
                  className="stage-page-add"
                  onClick={handleAddNewPage}
                  title="စာမျက်နှာအသစ် ထည့်မယ်"
                >
                  <Plus size={13} />
                </button>
              )}
            </div>
          )}
        </section>

        {/* The working sheet */}
        <section className="maker-panel" aria-labelledby="step-heading">
          <div className="panel-head">
            <span className="step-kicker">
              Step {stepIndex + 1} / {steps.length}
            </span>
            <h2 id="step-heading">{stepDef.title}</h2>
            <p>{stepDef.hint}</p>
          </div>

          <div className="panel-body">
            {step === 'opening' && (
              <OpeningFields card={card} onChange={onChange} />
            )}

            {step === 'pages' && (
              <PagesFields
                card={card}
                onChange={onChange}
                pageId={previewPageId}
                onSelectPage={(id) => {
                  setSelectedPageId(id)
                  setSelectedPhotoId(null)
                  setSelectedElementId(null)
                  setView('pages')
                }}
                selectedPhotoId={selectedPhotoId}
                onSelectPhoto={(id) => {
                  setSelectedPhotoId(id)
                  if (id) setSelectedElementId(null)
                }}
                selectedElementId={selectedElementId}
                onSelectElement={(id) => {
                  setSelectedElementId(id)
                  if (id) setSelectedPhotoId(null)
                }}
              />
            )}

            {step === 'event' && (
              <EventFields
                card={card}
                onChange={onChange}
                projectId={workspace?.project.id}
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

            {step === 'publish' && (
              <div className="publish-step-panel">
                <div className="publish-summary-card">
                  <div className="publish-summary-header">
                    <Sparkles size={20} className="publish-summary-sparkle" />
                    <div>
                      <h4 className="publish-card-title">
                        {card.title || 'အမှတ်တရ ကတ်'}
                      </h4>
                      <p className="publish-card-meta">
                        {occasions.find((o) => o.id === card.occasion)?.name ??
                          'အမှတ်တရ'}{' '}
                        ·{' '}
                        {card.pages.length
                          ? `အဖုံးအပြင် စာမျက်နှာ ${card.pages.length} မျက်နှာ`
                          : 'အဖုံးစာမျက်နှာ'}{' '}
                        · ဓာတ်ပုံ {card.photos.length} ပုံ
                      </p>
                    </div>
                  </div>

                  <div className="publish-quick-actions">
                    <Link
                      to="/preview"
                      className="button ghost preview-full-btn"
                    >
                      <Eye size={15} /> လက်ခံသူ မြင်ရမယ့်ပုံစံ အစအဆုံး စစ်ဆေးမယ်
                    </Link>
                  </div>
                </div>

                <div className="publish-cloud-section">
                  <div className="publish-section-head">
                    <Share2 size={16} />
                    <h4>Cloud ထုတ်ဝေမှုနှင့် လင့်ခ်မျှဝေရန်</h4>
                  </div>
                  <p className="field-hint">
                    ကတ်ကို Cloud ပေါ်သို့ တင်ပြီး လုံခြုံသော Link သို့မဟုတ် QR
                    ဖိတ်စာကတ်ပြားဖြင့် Reviewer များ၊ မိတ်ဆွေများထံ တိုက်ရိုက်
                    ပေးပို့နိုင်ပါသည်။
                  </p>
                  {workspace && <CloudConnection workspace={workspace} />}
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
            {isLast ? (
              <Link to="/preview" className="button primary publish-action-btn">
                <Eye size={15} /> ကတ်ကို စစ်ဆေးမယ် 🚀
              </Link>
            ) : (
              <button className="button primary" onClick={() => go(1)}>
                နောက်အဆင့် <ArrowRight size={15} />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
