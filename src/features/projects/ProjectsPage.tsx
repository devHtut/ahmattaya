import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, Plus, RotateCcw, Trash2 } from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { CardPreview } from '../../shared/ui/CardPreview'
import { DraftStatus } from '../creator/components/DraftStatus'
import { CloudConnection } from '../publishing/CloudConnection'

export function ProjectsPage({
  workspace: w,
}: {
  workspace: ProjectWorkspace
}) {
  const [trash, setTrash] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const confirmation = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const items = w.projects
    .filter((p) => p.deleted === trash)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const selectedIds = items
    .filter((p) => selected.includes(p.id))
    .map((p) => p.id)

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
        <button
          aria-pressed={!trash}
          onClick={() => {
            setTrash(false)
            setSelected([])
          }}
        >
          ကတ်များ ({w.projects.filter((p) => !p.deleted).length})
        </button>
        <button
          aria-pressed={trash}
          onClick={() => {
            setTrash(true)
            setSelected([])
          }}
        >
          ဖျက်ထားတာ ({w.projects.filter((p) => p.deleted).length})
        </button>
      </div>
      {trash && items.length > 0 && (
        <div className="trash-selection-bar">
          <label>
            <input
              type="checkbox"
              checked={selectedIds.length === items.length}
              onChange={(e) =>
                setSelected(e.target.checked ? items.map((p) => p.id) : [])
              }
            />
            အားလုံးရွေးမယ်
          </label>
          <span aria-live="polite">ရွေးထားတာ {selectedIds.length} ခု</span>
          <button
            className="button secondary"
            disabled={selectedIds.length === 0}
            onClick={() => confirmation.current?.showModal()}
          >
            <Trash2 size={16} /> အပြီးတိုင်ဖျက်မယ်
          </button>
        </div>
      )}
      <dialog
        ref={confirmation}
        className="share-dialog"
        aria-labelledby="delete-heading"
        aria-describedby="delete-description"
      >
        <h2 id="delete-heading">
          ရွေးထားတဲ့ ကတ် {selectedIds.length} ခုကို အပြီးတိုင်ဖျက်မလား။
        </h2>
        <p id="delete-description">
          ဒီ browser ထဲက ရွေးထားတဲ့ကတ်တွေကို ပြန်ယူလို့ မရတော့ပါ။ Cloud
          မိတ္တူနဲ့ မျှဝေထားတဲ့ link တွေကို မဖျက်ပါ။
        </p>
        <div className="share-dialog-actions">
          <button
            className="button secondary"
            autoFocus
            onClick={() => confirmation.current?.close()}
          >
            မဖျက်တော့ပါ
          </button>
          <button
            className="button primary"
            disabled={selectedIds.length === 0}
            onClick={() => {
              w.deletePermanently(selectedIds)
              setSelected([])
              confirmation.current?.close()
            }}
          >
            အပြီးတိုင်ဖျက်မယ်
          </button>
        </div>
      </dialog>
      <div className="shelf-grid">
        {items.map((project) => (
          <article className="shelf-card" key={project.id}>
            <div className="shelf-thumb" aria-hidden="true">
              <div>
                <CardPreview card={project.card} />
              </div>
            </div>
            <div className="shelf-card-body">
              {trash && (
                <label className="trash-card-select">
                  <input
                    type="checkbox"
                    aria-label={`${project.name} ကို ရွေးမယ်`}
                    checked={selected.includes(project.id)}
                    onChange={(e) =>
                      setSelected((ids) =>
                        e.target.checked
                          ? [...ids, project.id]
                          : ids.filter((id) => id !== project.id),
                      )
                    }
                  />
                  ရွေးမယ်
                </label>
              )}
              <h2>{project.name}</h2>
              <p className="muted">
                နောက်ဆုံး ပြင်တာ ·{' '}
                {new Date(project.updatedAt).toLocaleString()}
              </p>
              <div className="shelf-card-actions">
                {trash ? (
                  <button
                    className="button secondary"
                    onClick={() => {
                      w.trash(project.id, false)
                      setSelected((ids) =>
                        ids.filter((id) => id !== project.id),
                      )
                    }}
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
      <CloudConnection workspace={w} />
    </main>
  )
}
