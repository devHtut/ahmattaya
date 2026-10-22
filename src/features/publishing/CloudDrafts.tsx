import { PublishCard } from './PublishCard'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudDownload, CloudUpload, RefreshCw } from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { getCloudClient } from '../../shared/cloud/client'
import type { TransferProgress } from '../../shared/cloud/media'
import {
  CLOUD_PAGE_SIZE,
  cloudDraftMessage,
  listCloudDrafts,
  prepareCloudDraft,
  readCloudDraft,
  saveCloudDraft,
  type CloudDraftSummary,
} from '../../shared/cloud/drafts'

export function CloudDrafts({
  workspace: w,
  ownerId,
  onRestored,
  externalDisabled = false,
  onBusy,
  account = false,
}: {
  workspace: ProjectWorkspace
  ownerId: string
  onRestored?: () => void
  externalDisabled?: boolean
  onBusy?: (busy: boolean) => void
  account?: boolean
}) {
  const [items, setItems] = useState<CloudDraftSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [action, setAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [transfer, setTransfer] = useState<TransferProgress | null>(null)
  const onProgress = (progress: TransferProgress) => {
    if (alive.current) setTransfer(progress)
  }
  const alive = useRef(false)
  const busy = useRef(false)
  const navigate = useNavigate()
  useEffect(() => {
    let cancelled = false
    alive.current = true
    getCloudClient()
      .then((client) => listCloudDrafts(client, ownerId))
      .then((rows) => {
        if (!cancelled) {
          setItems(rows)
          setMore(rows.length === CLOUD_PAGE_SIZE)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(cloudDraftMessage(err))
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
      alive.current = false
    }
  }, [ownerId])

  let mediaIssue = ''
  try {
    prepareCloudDraft(w.project)
  } catch (err) {
    mediaIssue = cloudDraftMessage(err)
  }

  async function refresh(append = false) {
    if (busy.current || loading || publishing || externalDisabled) return
    busy.current = true
    onBusy?.(true)
    setLoading(true)
    setError('')
    try {
      const client = await getCloudClient()
      const rows = await listCloudDrafts(
        client,
        ownerId,
        append ? items.length : 0,
      )
      if (alive.current) {
        setItems(
          append
            ? [...items, ...rows].filter(
                (row, index, all) =>
                  all.findIndex((item) => item.id === row.id) === index,
              )
            : rows,
        )
        setMore(rows.length === CLOUD_PAGE_SIZE)
      }
    } catch (err) {
      if (alive.current) setError(cloudDraftMessage(err))
    } finally {
      busy.current = false
      onBusy?.(false)
      if (alive.current) setLoading(false)
    }
  }
  async function save() {
    if (busy.current || loading || publishing || externalDisabled || mediaIssue)
      return
    busy.current = true
    onBusy?.(true)
    setAction('save')
    setTransfer(null)
    setFeedback('')
    setError('')
    // Capture exactly the requested snapshot. Later edits stay in the workspace.
    const project = structuredClone(w.project)
    try {
      const client = await getCloudClient()
      const receipt = await saveCloudDraft(client, ownerId, project, {
        onProgress,
      })
      w.recordCloudSave(project.id, receipt)
      if (alive.current) {
        setFeedback(
          '✓ တင်လိုက်ချိန်က ကတ်မိတ္တူကို Cloud မှာ သိမ်းပြီးပါပြီ။ ထပ်ပြင်ပြီးရင် ပြန်သိမ်းပေးပါ။',
        )
        const row = {
          id: receipt.projectId,
          owner_id: ownerId,
          name: project.name,
          revision: receipt.revision,
          updated_at: receipt.savedAt,
        }
        setItems((current) => [
          row,
          ...current.filter((item) => item.id !== row.id),
        ])
      }
    } catch (err) {
      if (alive.current) setError(cloudDraftMessage(err))
    } finally {
      busy.current = false
      onBusy?.(false)
      if (alive.current) setAction('')
      if (alive.current) setTransfer(null)
    }
  }
  async function restore(id: string) {
    if (busy.current || loading || publishing || externalDisabled) return
    busy.current = true
    onBusy?.(true)
    setAction(id)
    setTransfer(null)
    setFeedback('')
    setError('')
    try {
      const client = await getCloudClient()
      const row = await readCloudDraft(client, ownerId, id, { onProgress })
      if (!alive.current) return
      w.importCloudCopy(row)
      onRestored?.()
      navigate('/create')
    } catch (err) {
      if (alive.current) setError(cloudDraftMessage(err))
    } finally {
      busy.current = false
      onBusy?.(false)
      if (alive.current) setAction('')
      if (alive.current) setTransfer(null)
    }
  }
  const disabled = loading || Boolean(action) || publishing || externalDisabled
  const receipt =
    w.project.cloud?.ownerId === ownerId ? w.project.cloud : undefined
  return (
    <div className="cloud-drafts">
      {w.hasActiveProject && (
        <PublishCard
          key={w.project.id}
          workspace={w}
          ownerId={ownerId}
          disabled={loading || Boolean(action) || externalDisabled}
          publishBlocked={Boolean(mediaIssue)}
          onBusy={(value) => {
            setPublishing(value)
            onBusy?.(value)
          }}
        />
      )}
      <h3>ကိုယ့်အတွက် Cloud ကတ်များ</h3>
      <p className="field-hint">
        ကိုယ်တိုင် သိမ်းမယ်နှိပ်မှ Cloud ပေါ်တင်ပေးပါတယ်။ ဓာတ်ပုံ၊ စာသား၊
        နောက်ခံပုံ၊ ကိုယ်ပိုင်သီချင်း၊ အလှဆင်နဲ့ Cake ပါဝင်ပါတယ်။ ဒီမိတ္တူကို
        ကိုယ်တိုင်ပဲ ပြန်ပြင်နိုင်ပါတယ်။
      </p>
      <button
        className="button primary"
        disabled={
          !w.hasActiveProject ||
          disabled ||
          Boolean(mediaIssue) ||
          w.saveStatus === 'blocked'
        }
        onClick={() => void save()}
      >
        <CloudUpload size={16} />
        {action === 'save'
          ? 'Cloud မှာ သိမ်းနေပါတယ်…'
          : 'ဒီကတ်ကို Cloud မှာ သိမ်းမယ်'}
      </button>
      {transfer && transfer.total > 0 && (
        <div className="cloud-transfer" role="status">
          <p>
            {transfer.phase === 'upload'
              ? 'ပုံ/သီချင်း တင်နေပါတယ်'
              : 'ပုံ/သီချင်း ပြန်ယူနေပါတယ်'}{' '}
            · {transfer.completed} / {transfer.total}
          </p>
          <progress
            aria-label="ပုံ/သီချင်း လွှဲပြောင်းမှု"
            value={transfer.completed}
            max={transfer.total}
          />
        </div>
      )}
      {receipt && (
        <p className="field-hint">
          နောက်ဆုံး Cloud သိမ်းချိန် ·{' '}
          {new Date(receipt.savedAt).toLocaleString()} · v{receipt.revision}
        </p>
      )}
      {mediaIssue && <p className="field-hint">{mediaIssue}</p>}
      {feedback && (
        <p role="status" className="cloud-success">
          {feedback}
        </p>
      )}
      {error && (
        <p role="alert" className="music-error">
          {error}
        </p>
      )}
      <div className="cloud-list-heading">
        <h4>သိမ်းထားတဲ့ Cloud ကတ်များ</h4>
        <button
          className="button secondary"
          disabled={disabled}
          onClick={() => void refresh()}
        >
          <RefreshCw size={14} />
          ပြန်စစ်မယ်
        </button>
      </div>
      {loading && <p role="status">Cloud ကတ်တွေကို ရှာနေပါတယ်…</p>}
      {!loading && !error && !items.length && (
        <p className="field-hint">Cloud ကတ် မရှိသေးပါ။</p>
      )}
      <ul className="cloud-draft-list">
        {items.map((row) => (
          <li key={row.id}>
            <div>
              <strong>{row.name}</strong>
              <small>
                {new Date(row.updated_at).toLocaleString()} · v{row.revision}
              </small>
            </div>
            <button
              className="button secondary"
              disabled={disabled}
              onClick={() => void restore(row.id)}
              aria-label={`${row.name} ကို Cloud မှ မိတ္တူယူမယ်`}
            >
              <CloudDownload size={14} />
              {action === row.id ? 'ပြန်ယူနေပါတယ်…' : 'မိတ္တူယူမယ်'}
            </button>
          </li>
        ))}
      </ul>
      {more && (
        <button
          className="button secondary"
          disabled={disabled}
          onClick={() => void refresh(true)}
        >
          နောက်ထပ် ကတ်များ
        </button>
      )}
      <p className="field-hint">
        Cloud မှ ပြန်ယူရင် browser ကတ်အသစ်တစ်ခုအဖြစ် ဖွင့်ပေးပါတယ်။ အဲဒီကတ်ကို
        Cloud ပြန်သိမ်းရင် မူရင်း Cloud ကတ်ကို update လုပ်ပေးပါတယ်။ လက်ရှိ
        browser ကတ်တွေကို အစားမထိုးပါ။{' '}
        {account
          ? 'Account email နဲ့ တခြားစက်မှာ ဝင်ပြီး Cloud ကတ်ကို မိတ္တူယူ၊ ဆက်ပြင်နိုင်ပါတယ်။'
          : 'Guest session မပျောက်ခင် အပေါ်မှာ Email account နဲ့ ချိတ်ထားပေးပါ။'}
      </p>
    </div>
  )
}
