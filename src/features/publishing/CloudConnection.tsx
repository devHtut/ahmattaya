import { AccountPanel } from './AccountPanel'
import { useCloudIdentity } from './useCloudIdentity'
import { isPermanentAccount } from '../../shared/cloud/account'
import { lazy, Suspense, useState } from 'react'
import { cloudConfig } from '../../shared/cloud/client'
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
  const [authBusy, setAuthBusy] = useState(false)
  const [draftBusy, setDraftBusy] = useState(false)

  if (cloudConfig.status !== 'configured')
    return (
      <p className="share-dialog-desc">
        {cloudConfig.status === 'missing'
          ? 'Cloud configuration မထည့်ရသေးပါ။'
          : 'Cloud configuration ကို ပြန်စစ်ပေးရပါမယ်။'}
      </p>
    )

  const isPermanent = isPermanentAccount(identity.user)

  return (
    <section className="cloud-connection" aria-label="Cloud ချိတ်ဆက်မှု">
      {identity.loading ? (
        <p role="status" className="share-dialog-desc">
          Cloud session ကို စစ်ဆေးနေပါတယ်…
        </p>
      ) : isPermanent ? (
        <p
          role="status"
          className="share-dialog-desc"
          style={{ color: 'var(--success, #16a34a)', fontWeight: 500 }}
        >
          ✓ အကောင့်ဝင်ထားပြီးပါပြီ (Signed In)
        </p>
      ) : (
        <p role="status" className="share-dialog-desc">
          ကတ်များကို Cloud ပေါ် သိမ်းဆည်းရန်နှင့် အခြားစက်များမှ အချိန်မရွေး
          ပြန်လည်ပြင်ဆင်နိုင်ရန် အကောင့်ဝင်ပါ (Sign In / Sign Up)။
        </p>
      )}

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

      {isPermanent && identity.user && (
        <Suspense fallback={<p role="status">Cloud ကတ်များ ပြင်ဆင်နေပါတယ်…</p>}>
          <CloudDrafts
            key={identity.user.id}
            workspace={workspace}
            ownerId={identity.user.id}
            externalDisabled={authBusy}
            onBusy={setDraftBusy}
            account={true}
            onRestored={onRestored}
          />
        </Suspense>
      )}
    </section>
  )
}

