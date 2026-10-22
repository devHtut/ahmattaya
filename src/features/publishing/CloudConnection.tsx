import { AccountPanel } from './AccountPanel'
import { useCloudIdentity } from './useCloudIdentity'
import { isPermanentAccount } from '../../shared/cloud/account'
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
  const identity = useCloudIdentity()
  const [feedback, setFeedback] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [draftBusy, setDraftBusy] = useState(false)
  const alive = useRef(false),
    busy = useRef(false)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  async function connect() {
    if (busy.current) return
    busy.current = true
    setAuthBusy(true)
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
        setFeedback('ချိတ်ဆက်ပြီးပါပြီ။')
      }
    } catch (error) {
      if (alive.current) {
        setFeedback(
          guestAuthMessage(error && typeof error === 'object' ? error : {}),
        )
      }
    } finally {
      busy.current = false
      if (alive.current) setAuthBusy(false)
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
        {identity.user
          ? isPermanentAccount(identity.user)
            ? '✓ Account ချိတ်ပြီးပါပြီ။'
            : '✓ Guest session ချိတ်ပြီးပါပြီ။'
          : identity.loading
            ? 'Cloud session ကို စစ်ဆေးနေပါတယ်…'
            : 'Account မဖွင့်ဘဲ Guest အဖြစ် စတင်ချိတ်ဆက်နိုင်ပါတယ်။'}
      </p>
      {identity.failed && (
        <p className="music-error" role="alert">
          Cloud session ကို စစ်မရပါ။{' '}
          <button className="button secondary" onClick={identity.retry}>
            ပြန်စစ်မယ်
          </button>
        </p>
      )}
      <AccountPanel
        key={identity.user?.id ?? 'signed-out'}
        user={identity.user}
        disabled={identity.loading || identity.failed || draftBusy}
        onBusy={setAuthBusy}
      />
      {feedback && (
        <p className="music-error" role="alert">
          {feedback}
        </p>
      )}
      {!identity.user && !identity.failed && (
        <button
          className="button secondary"
          disabled={identity.loading || authBusy || draftBusy}
          onClick={() => void connect()}
        >
          Guest အဖြစ် ချိတ်မယ်
        </button>
      )}
      {identity.user && (
        <Suspense fallback={<p role="status">Cloud ကတ်များ ပြင်ဆင်နေပါတယ်…</p>}>
          <CloudDrafts
            key={identity.user.id}
            workspace={workspace}
            ownerId={identity.user.id}
            externalDisabled={authBusy}
            onBusy={setDraftBusy}
            account={isPermanentAccount(identity.user)}
            onRestored={onRestored}
          />
        </Suspense>
      )}
    </section>
  )
}
