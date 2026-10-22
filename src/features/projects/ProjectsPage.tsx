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
    <main id="main-content" className="page-width shelf-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">ကတ်များ စာ/စာ</span>
          <h1>ကျွန်တော့် ကတ်များ</h1>
          <p className="muted">
            ဒီ browser ထဲမှာ သိမ်းထားတဲ့ ကတ်များ · ပြင်ဆင်နေဆဲအမှတ်တရများ
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            w.create('birthday')
            navigate('/create')
          }}
        >
          <Plus size={18} /> ကတ်အသစ်
        </button>
      </div>
      {['error', 'blocked'].includes(w.saveStatus) && (
        <DraftStatus status={w.saveStatus} onRetry={w.retrySave} />
      )}
      <div className="shelf-tabs">
        <button aria-pressed={!trash} onClick={() => setTrash(false)}>
          ကတ်များ ({w.projects.filter((p) => !p.deleted).length})
        </button>
        <button aria-pressed={trash} onClick={() => setTrash(true)}>
          ဖျက်ထားတာ ({w.projects.filter((p) => p.deleted).length})
        </button>
      </div>
      <div className="shelf-grid">
        {items.map((project) => (
          <article className="shelf-card" key={project.id}>
            <div className="shelf-thumb" aria-hidden="true">
              <div>
                <CardPreview card={project.card} />
              </div>
            </div>
            <div className="shelf-card-body">
              <h2>{project.name}</h2>
              <p className="muted">
                နောက်ဆုံး ပြင်တာ ·{' '}
                {new Date(project.updatedAt).toLocaleString()}
              </p>
              <div className="shelf-card-actions">
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
                      aria-label="မော်ကွန်းထုတ်မယ်"
                      title="မော်ကွန်းထုတ်မယ်"
                      onClick={() => {
                        w.duplicate(project.id)
                        navigate('/create')
                      }}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="ဖျက်မယ်"
                      title="ဖျက်မယ်"
                      onClick={() => w.trash(project.id, true)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 && (
        <p className="empty-page">ဒီနေရာမှာ ကတ် မရှိသေးပါ။</p>
      )}
    </main>
  )
}
