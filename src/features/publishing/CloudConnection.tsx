import { useCloudIdentity } from './useCloudIdentity'
import { isPermanentAccount, signOutAccount } from '../../shared/cloud/account'
import { lazy, Suspense, useState } from 'react'
import { cloudConfig, getCloudClient } from '../../shared/cloud/client'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { LogIn, LogOut } from 'lucide-react'
import { AuthModal } from './AuthModal'

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
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [signOutReady, setSignOutReady] = useState(false)

  if (cloudConfig.status !== 'configured')
    return (
      <p className="share-dialog-desc">
        {cloudConfig.status === 'missing'
          ? 'Cloud configuration မထည့်ရသေးပါ။'
          : 'Cloud configuration ကို ပြန်စစ်ပေးရပါမယ်။'}
      </p>
    )

  const isPermanent = isPermanentAccount(identity.user)

  async function handleSignOut() {
    setAuthBusy(true)
    try {
      const client = await getCloudClient()
      await signOutAccount(client)
      setSignOutReady(false)
    } catch {
      // error handled by state
    } finally {
      setAuthBusy(false)
    }
  }

  return (
    <section className="cloud-connection" aria-label="Cloud ချိတ်ဆက်မှု">
      {identity.loading ? (
        <p role="status" className="share-dialog-desc">
          Cloud session ကို စစ်ဆေးနေပါတယ်…
        </p>
      ) : isPermanent && identity.user ? (
        <div className="cloud-account-bar">
          <div className="cloud-account-info">
            <span className="account-email">✉ {identity.user.email}</span>
            <span className="cloud-badge-success">✓ Signed In</span>
          </div>
          {!signOutReady ? (
            <button
              type="button"
              className="button secondary sm"
              disabled={authBusy || draftBusy}
              onClick={() => setSignOutReady(true)}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          ) : (
            <div className="account-signout-inline">
              <span className="field-hint">ထွက်မှာ သေချာပါသလား?</span>
              <button
                type="button"
                className="button secondary sm"
                disabled={authBusy}
                onClick={handleSignOut}
              >
                ထွက်မယ်
              </button>
              <button
                type="button"
                className="button ghost sm"
                onClick={() => setSignOutReady(false)}
              >
                မထွက်ပါ
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="cloud-guest-card">
          <p className="share-dialog-desc">
            ကတ်များကို Cloud ပေါ် သိမ်းဆည်းရန်နှင့် အခြားစက်များမှ အချိန်မရွေး
            ပြန်လည်ပြင်ဆင်နိုင်ရန် အကောင့်ဝင်ပါ (Sign In)။
          </p>
          <button
            type="button"
            className="button primary"
            onClick={() => setAuthModalOpen(true)}
          >
            <LogIn size={15} /> Sign In
          </button>
        </div>
      )}

      {identity.failed && (
        <p className="music-error" role="alert">
          Cloud session ကို စစ်မရပါ။{' '}
          <button className="button secondary" onClick={identity.retry}>
            ပြန်စစ်မယ်
          </button>
        </p>
      )}

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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </section>
  )
}
