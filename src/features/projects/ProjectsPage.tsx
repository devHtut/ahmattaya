import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, Plus, RotateCcw, Trash2 } from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { CardPreview } from '../../shared/ui/CardPreview'
import { DraftStatus } from '../creator/components/DraftStatus'
export function ProjectsPage({
  workspace: w,
}: {
  workspace: ProjectWorkspace
}) {
  const [trash, setTrash] = useState(false)
  const navigate = useNavigate()
  const items = w.projects
    .filter((p) => p.deleted === trash)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return (
    <main id="main-content" className="page-width projects-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">YOUR LITTLE MOMENTS</span>
          <h1>ကျွန်တော့် Project များ</h1>
          <p className="muted">
            ဒီ browser မှာ သိမ်းထားတဲ့ အမှတ်တရလေးတွေ။ တခြားစက်နဲ့တော့
            မချိတ်ဆက်ရသေးပါ။
          </p>
        </div>
        <Link className="button primary" to="/templates">
          <Plus size={18} /> အသစ်ဖန်တီးမယ်
        </Link>
      </div>
      {['error', 'blocked'].includes(w.saveStatus) && (
        <DraftStatus status={w.saveStatus} onRetry={w.retrySave} />
      )}
      <div className="project-tabs">
        <button aria-pressed={!trash} onClick={() => setTrash(false)}>
          Drafts ({w.projects.filter((p) => !p.deleted).length})
        </button>
        <button aria-pressed={trash} onClick={() => setTrash(true)}>
          ဖယ်ထားသော Project များ
        </button>
      </div>
      <div className="projects-grid">
        {items.map((project) => (
          <article className="project-tile" key={project.id}>
            <div className="project-thumbnail" aria-hidden="true">
              <div>
                <CardPreview card={project.card} />
              </div>
            </div>
            <div className="project-tile-body">
              <h2>{project.name}</h2>
              <p className="muted">
                နောက်ဆုံးပြင်ချိန်{' '}
                {new Date(project.updatedAt).toLocaleString()}
              </p>
              <div className="project-tile-actions">
                {trash ? (
                  <button
                    className="button secondary"
                    onClick={() => w.trash(project.id, false)}
                  >
                    <RotateCcw size={16} /> ပြန်ယူမယ်
                  </button>
                ) : (
                  <>
                    <Link
                      className="button primary"
                      to="/create"
                      onClick={() => w.open(project.id)}
                    >
                      ဆက်ပြင်မယ်
                    </Link>
                    <button
                      className="icon-button"
                      aria-label={`${project.name} မိတ္တူပွားမယ်`}
                      onClick={() => {
                        w.duplicate(project.id)
                        navigate('/create')
                      }}
                    >
                      <Copy size={17} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`${project.name} ဖယ်ထားမယ်`}
                      onClick={() => w.trash(project.id, true)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 && (
        <p className="empty-page">ဒီနေရာမှာ Project မရှိသေးပါ။</p>
      )}
    </main>
  )
}
