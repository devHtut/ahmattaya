import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { cloudConfig, getCloudClient } from '../../shared/cloud/client'
import { guestAuthMessage } from '../../shared/cloud/auth-errors'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
const CloudDrafts = lazy(() =>
  import('./CloudDrafts').then((module) => ({ default: module.CloudDrafts })),
)

export function CloudConnection({
  workspace,
  onRestored,
}: {
  workspace: ProjectWorkspace
  onRestored?: () => void
}) {
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'connected' | 'error'
  >('loading')
  const [feedback, setFeedback] = useState('')
  const alive = useRef(false)
  const busy = useRef(false)
  useEffect(() => {
    alive.current = true
    if (cloudConfig.status !== 'configured')
      return () => {
        alive.current = false
      }
    getCloudClient()
      .then(async (client) => {
        const { data, error } = await client.auth.getSession()
        if (error) throw error
        if (data.session) {
          const verified = await client.auth.getUser()
          if (verified.error) throw verified.error
          if (alive.current) {
            setOwnerId(verified.data.user?.id ?? null)
            setStatus(verified.data.user ? 'connected' : 'idle')
          }
        } else if (alive.current) setStatus('idle')
      })
      .catch(() => {
        if (alive.current) {
          setStatus('error')
          setFeedback(
            'သိမ်းထားတဲ့ Guest session ကို ပြန်ဖွင့်မရပါ။ ပြန်ချိတ်ကြည့်နိုင်ပါတယ်။',
          )
        }
      })
    return () => {
      alive.current = false
    }
  }, [])
  async function connect() {
    if (busy.current) return
    busy.current = true
    setStatus('loading')
    setFeedback('')
    try {
      const client = await getCloudClient()
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      // Reuse an existing session rather than creating a guest on every click.
      const result = data.session
        ? await client.auth.getUser()
        : await client.auth.signInAnonymously()
      if (result.error) throw result.error
      if (!result.data.user) throw new Error('No user returned')
      if (alive.current) {
        setOwnerId(result.data.user.id)
        setStatus('connected')
      }
    } catch (error) {
      if (alive.current) {
        setStatus('error')
        setFeedback(
          guestAuthMessage(error && typeof error === 'object' ? error : {}),
        )
      }
    } finally {
      busy.current = false
    }
  }
  if (cloudConfig.status !== 'configured')
    return (
      <p className="share-dialog-desc">
        {cloudConfig.status === 'missing'
          ? 'Cloud configuration မထည့်ရသေးပါ။'
          : 'Cloud configuration ကို ပြန်စစ်ပေးရပါမယ်။'}
      </p>
    )
  return (
    <section className="cloud-connection" aria-label="Cloud ချိတ်ဆက်မှု">
      <p role="status" className="share-dialog-desc">
        {status === 'connected'
          ? '✓ Guest session ချိတ်ပြီးပါပြီ။'
          : status === 'loading'
            ? 'Cloud session ကို စစ်ဆေးနေပါတယ်…'
            : 'Account မဖွင့်ဘဲ Guest အဖြစ် စတင်ချိတ်ဆက်နိုင်ပါတယ်။'}
      </p>
      {feedback && (
        <p className="music-error" role="alert">
          {feedback}
        </p>
      )}
      {status !== 'connected' && (
        <button
          className="button secondary"
          disabled={status === 'loading'}
          onClick={() => void connect()}
        >
          Guest အဖြစ် ချိတ်မယ်
        </button>
      )}
      {status === 'connected' && ownerId && (
        <Suspense fallback={<p role="status">Cloud ကတ်များ ပြင်ဆင်နေပါတယ်…</p>}>
          <CloudDrafts
            key={ownerId}
            workspace={workspace}
            ownerId={ownerId}
            onRestored={onRestored}
          />
        </Suspense>
      )}
    </section>
  )
}
