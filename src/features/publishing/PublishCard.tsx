import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Copy, ExternalLink, Link2, Link2Off, QrCode } from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { getCloudClient } from '../../shared/cloud/client'
import {
  getPublication,
  publishProject,
  publishingMessage,
  receiverUrl,
  unpublish,
  type Publication,
} from '../../shared/cloud/publishing'
import type { TransferProgress } from '../../shared/cloud/media'
const QrInvitation = lazy(() => import('./qr/QrInvitation'))
export function PublishCard({
  workspace: w,
  ownerId: propOwnerId,
  disabled = false,
  publishBlocked = false,
  onBusy,
}: {
  workspace: ProjectWorkspace
  ownerId?: string
  disabled?: boolean
  publishBlocked?: boolean
  onBusy?: (busy: boolean) => void
}) {
  const [publication, setPublication] = useState<Publication | null>(null)
  const [qrOpened, setQrOpened] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [progress, setProgress] = useState<TransferProgress | null>(null)
  const alive = useRef(false),
    running = useRef(false)

  useEffect(() => {
    let cancelled = false
    alive.current = true

    async function checkPub() {
      try {
        const client = await getCloudClient()
        const { data } = await client.auth.getSession()
        const currentOwner = propOwnerId || data.session?.user.id
        if (!currentOwner) {
          if (!cancelled) setLoading(false)
          return
        }
        const projectId =
          w.project.cloud?.ownerId === currentOwner
            ? w.project.cloud.projectId
            : w.project.id

        const p = await getPublication(client, projectId)
        if (!cancelled) {
          setPublication(p)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(publishingMessage(err))
          setLoading(false)
        }
      }
    }

    void checkPub()

    return () => {
      cancelled = true
      alive.current = false
    }
  }, [propOwnerId, w.project.cloud, w.project.id])

  async function act(remove = false) {
    if (
      running.current ||
      disabled ||
      loading ||
      (!remove && (publishBlocked || w.saveStatus === 'blocked'))
    )
      return
    running.current = true
    setBusy(true)
    onBusy?.(true)
    setError('')
    setFeedback('')
    setProgress(null)
    const project = structuredClone(w.project)
    try {
      const client = await getCloudClient()
      const { data } = await client.auth.getSession()
      let effectiveOwner = propOwnerId || data.session?.user.id

      if (!effectiveOwner) {
        // Automatic silent anonymous sign-in: enables instant publishing without requiring an email!
        const anon = await client.auth.signInAnonymously()
        if (anon.error) throw anon.error
        if (!anon.data.user) throw new Error('No user returned')
        effectiveOwner = anon.data.user.id
      }

      const result =
        remove && publication
          ? await unpublish(client, publication.id)
          : await publishProject(client, effectiveOwner, project, {
            onSaved: (receipt) => w.recordCloudSave(project.id, receipt),
            onProgress: (p) => {
              if (alive.current) setProgress(p)
            },
          })
      if (alive.current) {
        setPublication(result)
        setFeedback(
          remove
            ? 'Link ပိတ်ပြီးပါပြီ။'
            : '✓ Publish ပြီးပါပြီ။ ဒီ link ကို ချစ်ရသူဆီ ပို့နိုင်ပါပြီ။',
        )
      }
    } catch (err) {
      if (alive.current) setError(publishingMessage(err))
    } finally {
      running.current = false
      onBusy?.(false)
      if (alive.current) {
        setBusy(false)
        setProgress(null)
      }
    }
  }
  const url = publication?.active ? receiverUrl(publication.id) : ''
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      if (alive.current) setFeedback('Link ကူးပြီးပါပြီ။')
    } catch {
      if (alive.current)
        setFeedback('အောက်က link ကို ရွေးပြီး ကိုယ်တိုင် ကူးယူနိုင်ပါတယ်။')
    }
  }
  return (
    <section className="publish-card" aria-labelledby="publish-heading">
      <h3 id="publish-heading">
        <Link2 size={18} /> ချစ်ရသူဆီ ပို့မယ်
      </h3>
      {loading && <p role="status">Share link ကို စစ်နေပါတယ်…</p>}
      <button
        className="button primary"
        disabled={
          disabled ||
          busy ||
          loading ||
          publishBlocked ||
          w.saveStatus === 'blocked'
        }
        onClick={() => void act()}
      >
        {busy
          ? 'အွန်လိုင်းပေါ် တင်နေပါသည်…'
          : publication?.active
            ? 'ပြင်ဆင်ထားချက်များကို Update လုပ်မည်'
            : 'Publish လုပ်ပြီး Link ယူမည် 🚀'}
      </button>
      {progress && progress.total > 0 && (
        <p role="status">
          ပုံ/သီချင်း ပြင်ဆင်နေပါတယ် · {progress.completed} / {progress.total}
        </p>
      )}
      {url && (
        <div className="published-link">
          <label htmlFor="receiver-link">Receiver ကို ပေးမယ့် link</label>
          <input
            id="receiver-link"
            readOnly
            value={url}
            onFocus={(event) => event.target.select()}
          />
          <div className="publish-actions">
            <button className="button secondary" onClick={() => void copy()}>
              <Copy size={14} /> Link ကူးမယ်
            </button>
            <a
              className="button secondary"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} /> ဖွင့်ကြည့်မယ်
            </a>
            <button
              className="button ghost"
              disabled={disabled || busy}
              onClick={() => void act(true)}
            >
              <Link2Off size={14} /> Link ပိတ်မယ်
            </button>
          </div>
          <button
            className="button secondary"
            disabled={disabled || busy}
            onClick={() => setQrOpened((value) => !value)}
            aria-expanded={qrOpened}
          >
            <QrCode size={16} />{' '}
            {qrOpened ? 'QR ဖိတ်စာ ပိတ်မယ်' : 'QR ဖိတ်စာ ယူမယ်'}
          </button>
          {qrOpened && publication && (
            <Suspense fallback={<p role="status">QR ပြင်ဆင်နေပါတယ်…</p>}>
              <QrInvitation
                key={`${publication.id}:${publication.revision}`}
                id={publication.id}
                revision={publication.revision}
                disabled={disabled || busy}
              />
            </Suspense>
          )}
          <p className="field-hint">
            {publication?.published_at &&
              new Date(publication.published_at).toLocaleString()}{' '}
            · Publish ပြန်လုပ်ရင် ဒီ link အတိုင်းပဲ ဖြစ်ပါတယ်။ Link ပိတ်ရင်
            အသစ်ဖွင့်ကြည့်လို့မရတော့ပါ။
          </p>
        </div>
      )}
      {feedback && (
        <p className="cloud-success" role="status">
          {feedback}
        </p>
      )}
      {error && (
        <p className="music-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
