import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Cloud, X } from 'lucide-react'
import { CloudConnection } from './CloudConnection'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import { useCloudIdentity } from './useCloudIdentity'
import { isPermanentAccount } from '../../shared/cloud/account'
import { AuthModal } from './AuthModal'

export interface CloudSyncHandle {
  open: () => void
}

export const CloudSyncButton = forwardRef<
  CloudSyncHandle,
  { workspace: ProjectWorkspace }
>(({ workspace }, ref) => {
  const identity = useCloudIdentity()
  const isPermanent = isPermanentAccount(identity.user)
  const [cloudOpened, setCloudOpened] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const cloudDialog = useRef<HTMLDialogElement>(null)

  const handleOpen = () => {
    if (!isPermanent) {
      setAuthModalOpen(true)
    } else {
      setCloudOpened(true)
      cloudDialog.current?.showModal()
    }
  }

  useImperativeHandle(ref, () => ({
    open() {
      handleOpen()
    },
  }))

  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label="Cloud ကတ်များ"
        title={isPermanent ? 'တခြားစက်များနှင့် ချိတ်ဆက်ရန် (Cloud Sync)' : 'အကောင့်ဝင်ရန် (Sign In)'}
        onClick={handleOpen}
      >
        <Cloud size={17} />
      </button>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setCloudOpened(true)
          cloudDialog.current?.showModal()
        }}
      />

      <dialog
        ref={cloudDialog}
        onClose={() => {
          if (!cloudDialog.current?.open) setCloudOpened(false)
        }}
        className="share-dialog"
        aria-labelledby="cloud-sync-dialog-heading"
      >
        <div className="share-dialog-header">
          <h2 id="cloud-sync-dialog-heading">
            တခြားစက်များနှင့် ချိတ်ဆက်ရန် (Cloud Sync)
          </h2>
          <button
            type="button"
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
        {(workspace.saveStatus === 'error' ||
          workspace.saveStatus === 'blocked') && (
          <p role="alert" className="music-error">
            လက်ရှိပြင်ထားတာတွေ မသိမ်းရသေးပါ။ Editor မှာ သိမ်းဆည်းမှုအခြေအနေကို
            ပြန်စစ်ပေးပါ။
          </p>
        )}
        {cloudOpened && (
          <CloudConnection
            workspace={workspace}
            onRestored={() => cloudDialog.current?.close()}
          />
        )}
      </dialog>
    </>
  )
})
