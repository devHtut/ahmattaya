import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, Plus, X } from 'lucide-react'
import {
  templateCatalog,
  createTemplateCard,
} from '../../shared/templates/catalog'
import { occasions } from '../../shared/templates/templates'
import { CardPreview } from '../../shared/ui/CardPreview'
import { OpeningInvitation } from '../../shared/ui/OpeningInvitation'
import { CakeIllustration } from '../cake/components/CakeIllustration'
import { findMusicTrack } from '../../shared/audio/tracks'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { DraftStatus } from '../creator/components/DraftStatus'

type Template = (typeof templateCatalog)[number]
function TemplatePreview({
  template,
  onClose,
  onUse,
}: {
  template: Template
  onClose: () => void
  onUse: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [view, setView] = useState('cover')
  const card = createTemplateCard(template.id)!
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  const track = findMusicTrack(card.music.trackId)
  return (
    <dialog
      ref={dialog}
      className="template-dialog"
      onClose={() => {
        if (!dialog.current?.open) onClose()
      }}
      aria-labelledby="template-preview-title"
    >
      <div className="template-dialog-heading">
        <div>
          <span className="eyebrow">TEMPLATE PREVIEW</span>
          <h2 id="template-preview-title">{template.name}</h2>
        </div>
        <button
          autoFocus
          className="icon-button"
          aria-label="နမူနာ ပိတ်မယ်"
          onClick={() => dialog.current?.close()}
        >
          <X size={18} />
        </button>
      </div>
      <div className="template-dialog-grid">
        <div className="template-preview-stage">
          {view === 'opening' ? (
            <OpeningInvitation
              key={template.id}
              opening={card.opening}
              receiverName=""
              senderName=""
            />
          ) : view === 'cake' ? (
            <CakeIllustration recipe={card.cake} />
          ) : (
            <CardPreview card={card} pageId={view} />
          )}
        </div>
        <div className="template-preview-info">
          <p>{template.description}</p>
          <label>
            ကြည့်မယ့် အပိုင်း
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="opening">အဖွင့်ဖိတ်စာ</option>
              <option value="cover">အဖုံးကတ်</option>
              {card.pages.map((page, index) => (
                <option key={page.id} value={page.id}>
                  စာမျက်နှာ {index + 2} · {page.title}
                </option>
              ))}
              {card.cake.enabled && <option value="cake">Cake နမူနာ</option>}
            </select>
          </label>
          <ul className="template-includes">
            <li>အဖွင့်ဖိတ်စာနဲ့ ကတ် ပါဝင်ပါတယ်</li>
            <li>စုစုပေါင်း စာမျက်နှာ {card.pages.length + 1} မျက်နှာ</li>
            {card.cake.enabled && (
              <li>
                {card.cake.flavor} Cake {card.cake.tiers} ထပ်
              </li>
            )}
            <li>
              {track
                ? `သံစဉ် · ${track.title}`
                : 'သီချင်း မပါပါ — နောက်မှ ထည့်နိုင်ပါတယ်'}
            </li>
          </ul>
          <p className="field-hint">
            စာသား၊ အရောင်၊ ပုံနဲ့ သီချင်းအားလုံးကို ဆက်ပြင်နိုင်ပါတယ်။
            ဒီနမူနာမှာ သီချင်း မဖွင့်ပါ။
          </p>
          <button className="button primary" onClick={onUse}>
            ဒီပုံစံနဲ့ စမယ် <ArrowRight size={16} />
          </button>
          <p className="field-hint">
            Project အသစ်အဖြစ် သိမ်းပေးပါမယ်။ ရှိပြီးသား Project တွေ
            ဆက်ရှိနေပါမယ်။
          </p>
        </div>
      </div>
    </dialog>
  )
}
export function TemplatesPage({
  workspace: w,
}: {
  workspace: ProjectWorkspace
}) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('occasion')
  const filter = occasions.some((item) => item.id === requested)
    ? requested
    : 'all'
  const [selected, setSelected] = useState<string | null>(null)
  const navigate = useNavigate()
  const templates = templateCatalog.filter(
    (item) => filter === 'all' || item.occasion === filter,
  )
  const preview = templateCatalog.find((item) => item.id === selected)
  const startTemplate = (id: string) => {
    if (w.createFromTemplate(id)) navigate('/create')
  }
  return (
    <main id="main-content" className="page-width templates-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">TEMPLATE GALLERY</span>
          <h1>Choose a Template</h1>
          <p className="muted">
            အသင့်ပြင်ထားသော ပုံစံကို ရွေးချယ်ပြီး စိတ်ကြိုက် ပြင်ဆင်ဖန်တီးပါ။
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            w.create(occasions.find((item) => item.id === filter)?.id)
            navigate('/create')
          }}
        >
          <Plus size={17} /> Blank Project
        </button>
      </div>
      {['error', 'blocked'].includes(w.saveStatus) && (
        <DraftStatus status={w.saveStatus} onRetry={w.retrySave} />
      )}
      <div
        className="template-filters"
        role="group"
        aria-label="Filter templates by occasion"
      >
        <button aria-pressed={filter === 'all'} onClick={() => setParams({})}>
          All
        </button>
        {occasions.map((item) => (
          <button
            key={item.id}
            aria-pressed={filter === item.id}
            onClick={() => setParams({ occasion: item.id })}
          >
            {item.icon} {item.name}
          </button>
        ))}
      </div>
      <p className="template-count" role="status">
        Templates: {templates.length} ခု
      </p>
      <div className="template-grid">
        {templates.map((template) => {
          const card = createTemplateCard(template.id)!
          return (
            <article className="template-tile" key={template.id}>
              <div className="template-thumbnail" aria-hidden="true">
                <CardPreview card={card} />
              </div>
              <div className="template-tile-body">
                <span className="eyebrow">
                  {
                    occasions.find((item) => item.id === template.occasion)
                      ?.name
                  }
                </span>
                <h2>{template.name}</h2>
                <p>{template.description}</p>
                <div className="template-badges">
                  <span>{card.pages.length + 1} Pages</span>
                  {card.cake.enabled && <span>🎂 Cake</span>}
                  {card.music.trackId !== 'none' && <span>🎵 Music</span>}
                </div>
                <div className="template-tile-actions">
                  <button
                    className="button secondary"
                    aria-label={`Preview ${template.name}`}
                    onClick={() => setSelected(template.id)}
                  >
                    <Eye size={15} /> Preview
                  </button>
                  <button
                    className="button primary"
                    aria-label={`Use ${template.name}`}
                    onClick={() => startTemplate(template.id)}
                  >
                    Use Template <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      {preview && (
        <TemplatePreview
          key={preview.id}
          template={preview}
          onClose={() => setSelected(null)}
          onUse={() => startTemplate(preview.id)}
        />
      )}
    </main>
  )
}
