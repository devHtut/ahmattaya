import { useState } from 'react'
import {
  Cake,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Images,
  LayoutTemplate,
  Mail,
  Music,
  Palette,
  Plus,
  Trash2,
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

export type ToolTab =
  | 'templates'
  | 'opening'
  | 'card'
  | 'style'
  | 'pages'
  | 'cake'
  | 'music'
  | 'projects'

export type CanvasViewMode = 'opening' | 'cover' | 'pages' | 'cake'

const toolTabs: {
  id: ToolTab
  label: string
  sublabel: string
  icon: typeof LayoutTemplate
  defaultView: CanvasViewMode
}[] = [
  {
    id: 'templates',
    label: 'Templates',
    sublabel: 'နမူနာ ပုံစံများ',
    icon: LayoutTemplate,
    defaultView: 'cover',
  },
  {
    id: 'opening',
    label: 'Invitation',
    sublabel: 'အဖွင့်ဖိတ်စာ',
    icon: Mail,
    defaultView: 'opening',
  },
  {
    id: 'card',
    label: 'Text',
    sublabel: 'စာသားနှင့် အခမ်းအနား',
    icon: Type,
    defaultView: 'cover',
  },
  {
    id: 'style',
    label: 'Design',
    sublabel: 'အရောင်နှင့် ဖောင့်',
    icon: Palette,
    defaultView: 'cover',
  },
  {
    id: 'pages',
    label: 'Photos',
    sublabel: 'စာမျက်နှာနှင့် ဓာတ်ပုံ',
    icon: Images,
    defaultView: 'pages',
  },
  {
    id: 'cake',
    label: 'Cake Studio',
    sublabel: 'ကိတ်မုန့် အလှဆင်',
    icon: Cake,
    defaultView: 'cake',
  },
  {
    id: 'music',
    label: 'Music',
    sublabel: 'သီချင်းနှင့် အသံ',
    icon: Music,
    defaultView: 'cover',
  },
  {
    id: 'projects',
    label: 'Projects',
    sublabel: 'သိမ်းထားသော ဖိုင်များ',
    icon: FolderKanban,
    defaultView: 'cover',
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
  const [activeTab, setActiveTab] = useState<ToolTab>('card')
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [canvasView, setCanvasView] = useState<CanvasViewMode>('cover')
  const [templateFilter, setTemplateFilter] = useState<string>('all')

  const cakeEditor = useCakeEditor(card.cake, (cake) =>
    onChange({ ...card, cake }),
  )
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState('cover')

  const previewPageId = card.pages.some((page) => page.id === selectedPageId)
    ? selectedPageId
    : 'cover'

  const handleSelectTab = (tab: ToolTab) => {
    if (activeTab === tab && isDrawerOpen) {
      // Toggle drawer if same tab clicked
      setIsDrawerOpen(false)
      return
    }
    setActiveTab(tab)
    setIsDrawerOpen(true)
    const tabDef = toolTabs.find((t) => t.id === tab)
    if (tabDef) {
      setCanvasView(tabDef.defaultView)
    }
  }

  const activeToolDef = toolTabs.find((t) => t.id === activeTab)

  const filteredTemplates =
    templateFilter === 'all'
      ? templateCatalog
      : templateCatalog.filter((t) => t.occasion === templateFilter)

  return (
    <div className="canva-studio-app">
      {['error', 'blocked'].includes(saveStatus) && (
        <DraftStatus status={saveStatus} onRetry={onRetrySave} />
      )}

      {/* Main Workspace: Left Tool Rail + Drawer + Canvas Stage */}
      <div className="studio-workspace-container">
        {/* 1. Left Vertical Tool Rail (Canva-style) */}
        <aside className="studio-tool-rail" aria-label="Tool Rail">
          {toolTabs.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id && isDrawerOpen
            return (
              <button
                key={item.id}
                className={`tool-rail-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectTab(item.id)}
                aria-pressed={isActive}
                title={`${item.label} (${item.sublabel})`}
              >
                <Icon size={20} className="tool-rail-icon" />
                <span className="tool-rail-label">{item.label}</span>
              </button>
            )
          })}
        </aside>

        {/* 2. Slide-out Drawer Panel (Properties & Settings) */}
        {isDrawerOpen && (
          <aside className="studio-drawer-panel" aria-label="Tool Settings">
            <div className="drawer-header">
              <div>
                <h2>{activeToolDef?.label}</h2>
                <p className="drawer-sublabel">{activeToolDef?.sublabel}</p>
              </div>
              <button
                className="icon-button drawer-collapse-btn"
                onClick={() => setIsDrawerOpen(false)}
                title="Collapse Panel"
                aria-label="Collapse Panel"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="drawer-content">
              {/* Templates Drawer */}
              {activeTab === 'templates' && (
                <div className="drawer-templates-list">
                  <div className="template-filter-pills">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'birthday', label: '🎂 Birthday' },
                      { id: 'wedding-invitation', label: '💌 Wedding' },
                      { id: 'anniversary', label: '💖 Anniversary' },
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

                  <div className="templates-mini-grid">
                    {filteredTemplates.map((template) => (
                      <article key={template.id} className="template-mini-card">
                        <div className="template-mini-info">
                          <h3>{template.name}</h3>
                          <p>{template.description}</p>
                          <span className="template-mini-tag">
                            {template.occasion}
                          </span>
                        </div>
                        <button
                          className="button primary mini-apply-btn"
                          onClick={() => {
                            if (workspace) {
                              workspace.createFromTemplate(template.id)
                            }
                          }}
                        >
                          Use Template
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* Invitation / Opening Drawer */}
              {activeTab === 'opening' && (
                <OpeningFields card={card} onChange={onChange} />
              )}

              {/* Text & Occasion Drawer */}
              {activeTab === 'card' && (
                <div className="fields">
                  <label>
                    Occasion (အခမ်းအနား ရွေးချယ်ရန်)
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

              {/* Design & Appearance Drawer */}
              {activeTab === 'style' && (
                <StyleFields card={card} onChange={onChange} />
              )}

              {/* Photos & Pages Drawer */}
              {activeTab === 'pages' && (
                <PagesFields
                  card={card}
                  onChange={onChange}
                  pageId={previewPageId}
                  onSelectPage={(id) => {
                    setSelectedPageId(id)
                    setSelectedPhotoId(null)
                    setCanvasView('pages')
                  }}
                  selectedPhotoId={selectedPhotoId}
                  onSelectPhoto={setSelectedPhotoId}
                />
              )}

              {/* Cake Studio Drawer */}
              {activeTab === 'cake' && (
                <CakeFields
                  card={card}
                  onChange={(next) => cakeEditor.changeRecipe(next.cake)}
                  editor={cakeEditor}
                />
              )}

              {/* Music Drawer */}
              {activeTab === 'music' && (
                <MusicFields card={card} onChange={onChange} />
              )}

              {/* Projects Drawer */}
              {activeTab === 'projects' && (
                <div className="drawer-projects-list">
                  <button
                    className="button primary new-project-btn"
                    onClick={() => {
                      if (workspace) {
                        workspace.create('birthday')
                      }
                    }}
                  >
                    <Plus size={16} /> New Blank Project
                  </button>

                  <div className="projects-mini-list">
                    {workspace?.projects
                      .filter((p) => !p.deleted)
                      .map((p) => {
                        const isActive = p.id === workspace.project.id
                        return (
                          <div
                            key={p.id}
                            className={`project-mini-item ${isActive ? 'active' : ''}`}
                          >
                            <div
                              className="project-mini-clickable"
                              onClick={() => workspace.open(p.id)}
                            >
                              <h4>{p.name}</h4>
                              <span className="project-mini-time">
                                {new Date(p.updatedAt).toLocaleDateString()}
                              </span>
                              {isActive && (
                                <span className="current-badge">Editing</span>
                              )}
                            </div>
                            <div className="project-mini-actions">
                              <button
                                className="icon-button mini"
                                title="Delete Project"
                                onClick={() => workspace.trash(p.id, true)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Collapsed Drawer Expand Button */}
        {!isDrawerOpen && (
          <button
            className="drawer-expand-tab"
            onClick={() => setIsDrawerOpen(true)}
            title="Expand Tools Panel"
            aria-label="Expand Tools Panel"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* 3. Center Live Canvas Stage */}
        <main className="studio-canvas-stage" id="main-content">
          {/* Floating Canvas View Switcher */}
          <div
            className="canvas-view-switcher"
            role="tablist"
            aria-label="Canvas Preview Views"
          >
            <button
              className={`view-pill ${canvasView === 'opening' ? 'active' : ''}`}
              onClick={() => setCanvasView('opening')}
              role="tab"
              aria-selected={canvasView === 'opening'}
            >
              💌 Invitation
            </button>
            <button
              className={`view-pill ${canvasView === 'cover' ? 'active' : ''}`}
              onClick={() => setCanvasView('cover')}
              role="tab"
              aria-selected={canvasView === 'cover'}
            >
              🎴 Card Cover
            </button>
            {card.pages.length > 0 && (
              <button
                className={`view-pill ${canvasView === 'pages' ? 'active' : ''}`}
                onClick={() => setCanvasView('pages')}
                role="tab"
                aria-selected={canvasView === 'pages'}
              >
                📄 Pages ({card.pages.length})
              </button>
            )}
            <button
              className={`view-pill ${canvasView === 'cake' ? 'active' : ''}`}
              onClick={() => setCanvasView('cake')}
              role="tab"
              aria-selected={canvasView === 'cake'}
            >
              🎂 Cake Studio
            </button>
          </div>

          {/* Canvas Card Frame */}
          <div className="canvas-frame-wrapper">
            <div className="canvas-phone-frame">
              {canvasView === 'opening' ? (
                <div className="stage-opening-view">
                  <OpeningInvitation
                    opening={card.opening}
                    receiverName={card.receiverName}
                    senderName={card.senderName}
                  />
                </div>
              ) : canvasView === 'cake' ? (
                <div className="stage-cake-view">
                  <CakePreview recipe={card.cake} editor={cakeEditor} />
                </div>
              ) : canvasView === 'pages' && activeTab === 'pages' ? (
                <div className="stage-pages-view">
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
                </div>
              ) : (
                <div className="stage-card-view">
                  <CardPreview
                    key={previewPageId}
                    card={card}
                    pageId={canvasView === 'pages' ? previewPageId : 'cover'}
                    selectedPhotoId={
                      canvasView === 'pages' ? selectedPhotoId : null
                    }
                    onSelectPhoto={
                      canvasView === 'pages' ? setSelectedPhotoId : undefined
                    }
                    onCommitPhoto={
                      canvasView === 'pages'
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
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
