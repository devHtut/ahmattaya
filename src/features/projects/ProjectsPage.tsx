import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CloudCheck, CloudUpload, Copy, Plus, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { CardPreview } from '../../shared/ui/CardPreview'
import { DraftStatus } from '../creator/components/DraftStatus'
import { useCloudIdentity } from '../publishing/useCloudIdentity'
import { isPermanentAccount } from '../../shared/cloud/account'
import { AuthModal } from '../publishing/AuthModal'
import { getCloudClient } from '../../shared/cloud/client'
import { cloudDraftMessage, saveCloudDraft } from '../../shared/cloud/drafts'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'

export function ProjectsPage({
  workspace: w,
}: {
  workspace: ProjectWorkspace
}) {
  const [tab, setTab] = useState<'projects' | 'trash'>('projects')
  const [selected, setSelected] = useState<string[]>([])
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const navigate = useNavigate()

  const identity = useCloudIdentity()
  const isPermanent = isPermanentAccount(identity.user)

  async function handleCloudUpload(project: ProjectWorkspace['projects'][number]) {
    if (!isPermanent || !identity.user?.id) {
      setAuthModalOpen(true)
      return
    }
    setUploadingId(project.id)
    try {
      const client = await getCloudClient()
      const receipt = await saveCloudDraft(client, identity.user.id, structuredClone(project))
      w.recordCloudSave(project.id, receipt)
      setToastMessage(`✓ "${project.name}" ကို Cloud ပေါ်သို့ သိမ်းဆည်းပြီးပါပြီ`)
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      alert(cloudDraftMessage(err))
    } finally {
      setUploadingId(null)
    }
  }

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
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 size={16} /> အပြီးတိုင်ဖျက်မယ်
            </button>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={`ရွေးထားတဲ့ ကတ် ${selectedIds.length} ခုကို အပြီးတိုင်ဖျက်မလား။`}
        description="ဒီ browser ထဲက ရွေးထားတဲ့ကတ်တွေကို ပြန်ယူလို့ မရတော့ပါ။ Cloud မိတ္တူနဲ့ မျှဝေထားတဲ့ link တွေကို မဖျက်ပါ။"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
        onConfirm={() => {
          w.deletePermanently(selectedIds)
          setSelected([])
          setDeleteConfirmOpen(false)
        }}
        onClose={() => setDeleteConfirmOpen(false)}
      />
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
                    {(() => {
                      const isCloudSaved = Boolean(
                        project.cloud?.savedAt &&
                        identity.user?.id &&
                        project.cloud?.ownerId === identity.user.id
                      )
                      return (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={
                            isCloudSaved
                              ? `${project.name} ကို Cloud တွင် Update တင်မည်`
                              : `${project.name} ကို Cloud ပေါ်သို့ သိမ်းမည်`
                          }
                          title={
                            isCloudSaved
                              ? `Cloud ပေါ်တွင် သိမ်းပြီးသား (${new Date(project.cloud!.savedAt).toLocaleDateString()}) — Update တင်ရန် နှိပ်ပါ`
                              : `"${project.name}" ကို Cloud ပေါ်သို့ သိမ်းမည် (Cloud Backup)`
                          }
                          disabled={uploadingId === project.id}
                          onClick={() => void handleCloudUpload(project)}
                        >
                          {uploadingId === project.id ? (
                            <RefreshCw size={15} className="spin" />
                          ) : isCloudSaved ? (
                            <CloudCheck size={16} style={{ color: 'var(--success, #16a34a)' }} />
                          ) : (
                            <CloudUpload size={16} />
                          )}
                        </button>
                      )
                    })()}
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

      {toastMessage && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            background: 'var(--ink, #1e293b)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </main>
  )
}
