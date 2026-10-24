import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Cloud, X } from 'lucide-react'
import { CloudConnection } from './CloudConnection'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'

export interface CloudSyncHandle {
  open: () => void
}

export const CloudSyncButton = forwardRef<
  CloudSyncHandle,
  { workspace: ProjectWorkspace }
>(({ workspace }, ref) => {
  const [cloudOpened, setCloudOpened] = useState(false)
  const cloudDialog = useRef<HTMLDialogElement>(null)

  useImperativeHandle(ref, () => ({
    open() {
      setCloudOpened(true)
      cloudDialog.current?.showModal()
    },
  }))

  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label="Cloud ကတ်များ"
        title="တခြားစက်များနှင့် ချိတ်ဆက်ရန် (Cross-Device Cloud Sync)"
        onClick={() => {
          setCloudOpened(true)
          cloudDialog.current?.showModal()
        }}
      >
        <Cloud size={17} />
      </button>

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
