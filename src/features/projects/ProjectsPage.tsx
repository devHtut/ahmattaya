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
          <span className="eyebrow">PROJECTS LIBRARY</span>
          <h1>My Projects</h1>
          <p className="muted">
            Saved locally in this browser · ဒီ browser တွင် သိမ်းဆည်းထားသော
            အမှတ်တရများ
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            w.create('birthday')
            navigate('/create')
          }}
        >
          <Plus size={18} /> New Project
        </button>
      </div>
      {['error', 'blocked'].includes(w.saveStatus) && (
        <DraftStatus status={w.saveStatus} onRetry={w.retrySave} />
      )}
      <div className="project-tabs">
        <button aria-pressed={!trash} onClick={() => setTrash(false)}>
          Active Projects ({w.projects.filter((p) => !p.deleted).length})
        </button>
        <button aria-pressed={trash} onClick={() => setTrash(true)}>
          Trash ({w.projects.filter((p) => p.deleted).length})
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
                Last edited: {new Date(project.updatedAt).toLocaleString()}
              </p>
              <div className="project-tile-actions">
                {trash ? (
                  <button
                    className="button secondary"
                    onClick={() => w.trash(project.id, false)}
                  >
                    <RotateCcw size={16} /> Restore
                  </button>
                ) : (
                  <>
                    <Link
                      className="button primary"
                      to="/create"
                      onClick={() => w.open(project.id)}
                    >
                      Open Project
                    </Link>
                    <button
                      className="icon-button"
                      aria-label="Duplicate"
                      title="Duplicate"
                      onClick={() => {
                        w.duplicate(project.id)
                        navigate('/create')
                      }}
                    >
                      <Copy size={17} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Move to Trash"
                      title="Move to Trash"
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
        <p className="empty-page">ဒီနေရာတွင် Project မရှိသေးပါ။</p>
      )}
    </main>
  )
}
