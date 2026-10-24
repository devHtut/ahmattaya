import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Cloud, Copy, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { CardPreview } from '../../shared/ui/CardPreview'
import { DraftStatus } from '../creator/components/DraftStatus'
import { CloudConnection } from '../publishing/CloudConnection'
import { useCloudIdentity } from '../publishing/useCloudIdentity'
import { isPermanentAccount } from '../../shared/cloud/account'

export function ProjectsPage({
  workspace: w,
}: {
  workspace: ProjectWorkspace
}) {
  const [tab, setTab] = useState<'projects' | 'trash'>('projects')
  const [selected, setSelected] = useState<string[]>([])
  const [cloudOpened, setCloudOpened] = useState(false)
  const confirmation = useRef<HTMLDialogElement>(null)
  const cloudDialog = useRef<HTMLDialogElement>(null)
  const identity = useCloudIdentity()
  const isPermanent = isPermanentAccount(identity.user)
  const navigate = useNavigate()
  const isTrash = tab === 'trash'
  const items = w.projects
    .filter((p) => p.deleted === isTrash)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const selectedIds = items
    .filter((p) => selected.includes(p.id))
    .map((p) => p.id)

  return (
    <main id="main-content" className="page-width shelf-page">
      <div className="page-head">
        <div>
          <h1>My Cards</h1>
          <p className="muted">
            ပြင်ဆင်နေဆဲအမှတ်တရများ
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
          aria-pressed={tab === 'projects'}
          onClick={() => {
            setTab('projects')
            setSelected([])
          }}
        >
          ကတ်များ ({w.projects.filter((p) => !p.deleted).length})
        </button>
        <button
          aria-pressed={tab === 'trash'}
          onClick={() => {
            setTab('trash')
            setSelected([])
          }}
        >
          ဖျက်ထားသောကတ်များ ({w.projects.filter((p) => p.deleted).length})
        </button>
      </div>
      {isTrash && items.length > 0 && (
        <div className="trash-selection-bar">
          <label className="trash-select-all">
            <input
              type="checkbox"
              checked={selectedIds.length === items.length}
              onChange={(e) =>
                setSelected(e.target.checked ? items.map((p) => p.id) : [])
              }
            />
            <span>အားလုံးရွေးမယ်</span>
          </label>
          <div className="trash-bar-actions">
            <span aria-live="polite" className="trash-selected-count">
              {selectedIds.length} selected
            </span>
            <button
              className="button danger"
              disabled={selectedIds.length === 0}
              onClick={() => confirmation.current?.showModal()}
            >
              <Trash2 size={16} /> အပြီးတိုင်ဖျက်မယ်
            </button>
          </div>
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
            className="button danger"
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
              {isTrash && (
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
                  <span>ရွေးမယ်</span>
                </label>
              )}
              <h2>{project.name}</h2>
              <p className="muted">
                {' '}
                {new Date(project.updatedAt).toLocaleString()} တွင်နောက်ဆုံးပြင်ဆင်ခဲ့သည်
              </p>
              <div className="shelf-card-actions">
                {isTrash ? (
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
                      aria-label="မိတ္တူပွားမယ် (Duplicate)"
                      title="မိတ္တူပွားမယ် (Duplicate)"
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
      <div className="cloud-sync-banner">
        <div className="cloud-sync-banner-info">
          <div
            className={`cloud-sync-icon-badge ${isPermanent ? 'success' : ''}`}
          >
            <Cloud size={20} />
          </div>
          <div>
            <h3>
              {isPermanent
                ? 'Cloud နှင့် ချိတ်ဆက်ထားပြီးပါပြီ'
                : 'ကတ်များကို Cloud ပေါ် သိမ်းဆည်းထားမလား'}
            </h3>
            <p>
              {isPermanent
                ? `${identity.user?.email} ဖြင့် ချိတ်ဆက်ထားပြီး အခြားစက်များမှ အချိန်မရွေး ဝင်ရောက်နိုင်ပါသည်`
                : 'အခြားဖုန်း သို့မဟုတ် ကွန်ပျူတာများမှ အချိန်မရွေး ပြန်ဖွင့်ပြင်ဆင်နိုင်ရန် အကောင့်ဝင်ထားပါ (အခမဲ့)'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="button secondary cloud-sync-banner-btn"
          onClick={() => {
            setCloudOpened(true)
            cloudDialog.current?.showModal()
          }}
        >
          <Cloud size={15} />
          <span>
            {isPermanent ? 'Cloud စီမံရန်' : 'အကောင့်ဝင်ရန် / ဖွင့်ရန်'}
          </span>
        </button>
      </div>

      <dialog
        ref={cloudDialog}
        onClose={() => {
          if (!cloudDialog.current?.open) setCloudOpened(false)
        }}
        className="share-dialog"
        aria-labelledby="cloud-dialog-heading"
      >
        <div className="share-dialog-header">
          <h2 id="cloud-dialog-heading">
            တခြားစက်များနှင့် ချိတ်ဆက်ရန် (Cloud Sync)
          </h2>
          <button
            className="icon-button"
            aria-label="ပိတ်မယ်"
            onClick={() => cloudDialog.current?.close()}
          >
            <X size={16} />
          </button>
        </div>
        <p className="share-dialog-desc">
          အီးမေးလ်ဖြင့် အကောင့်ဝင်ထားပါက လက်ရှိဖန်တီးထားသော ကတ်များကို အခြားဖုန်း
          သို့မဟုတ် ကွန်ပျူတာများမှလည်း အချိန်မရွေး ပြန်လည်ဖွင့်ဖောက်ပြင်ဆင်နိုင်မည်
          ဖြစ်ပါသည်။
        </p>
        {cloudOpened && (
          <CloudConnection
            workspace={w}
            onRestored={() => cloudDialog.current?.close()}
          />
        )}
      </dialog>
    </main>
  )
}
